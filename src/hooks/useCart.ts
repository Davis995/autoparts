'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';

interface CartItemProduct {
  id: string;
  name: string;
  price: number;
  description: string | null;
  stock: number;
  images: string[];
  is_active?: boolean;
}

interface CartItem {
  id: string; // cart item id (local)
  product_id: string;
  quantity: number;
  price: number; // snapshot price
  product: CartItemProduct;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  itemCount: number;
  total: number;
}

export function useCart() {
  const { user, isAuthenticated } = useAuth();
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    loading: false,
    error: null,
    itemCount: 0,
    total: 0
  });

  const storageKey = user?.id ? `cart_${user.id}` : 'cart_guest';

  // Calculate derived values
  const updateDerivedValues = (items: CartItem[]) => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    // Use cart line price so totals stay consistent even if product price changes
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    setCartState(prev => ({
      ...prev,
      items,
      itemCount,
      total
    }));
  };

  // Load cart from localStorage only (no API calls for speed)
  const loadCart = () => {
    if (typeof window === 'undefined') return;
    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        updateDerivedValues([]);
        setCartState(prev => ({ ...prev, loading: false }));
        return;
      }

      const parsed = JSON.parse(raw) as any[];

      const normalized: CartItem[] = Array.isArray(parsed)
        ? parsed
            .map((item) => {
              if (!item) return null;

              const product = item.product ?? {
                id: item.product_id ?? item.productId,
                name: item.product?.name ?? 'Product',
                price: item.price ?? 0,
                description: item.product?.description ?? null,
                stock: item.product?.stock ?? 0,
                images: item.product?.images ?? [],
              };

              if (!product || !product.id) return null;

              return {
                id: String(item.id ?? `${product.id}-${Date.now()}`),
                product_id: String(item.product_id ?? product.id),
                quantity: Number(item.quantity ?? 1),
                price: Number(item.price ?? product.price ?? 0),
                product,
              } as CartItem;
            })
            .filter((i): i is CartItem => !!i)
        : [];

      // Just sync in-memory state from localStorage; avoid re-writing and
      // re-emitting the cart-updated event here to prevent event loops.
      updateDerivedValues(normalized);
    } catch {
      updateDerivedValues([]);
    } finally {
      setCartState(prev => ({ ...prev, loading: false }));
    }
  };

  const persistCart = (items: CartItem[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      // Notify other hook instances in this tab
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch {
      // ignore storage errors
    }
  };

  // Add item to cart
  const addToCart = async (product: CartItemProduct, quantity = 1) => {
    // Allow guest cart as well; only gate if you really want auth
    if (!product || quantity < 1) return;

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const items = [...cartState.items];
      const existingIndex = items.findIndex(i => i.product_id === product.id);

      if (existingIndex >= 0) {
        const existing = items[existingIndex];
        const newQuantity = existing.quantity + quantity;
        items[existingIndex] = { ...existing, quantity: newQuantity };
      } else {
        const newItem: CartItem = {
          id: `${product.id}-${Date.now()}`,
          product_id: product.id,
          quantity,
          price: product.price,
          product,
        };
        items.push(newItem);
      }

      persistCart(items);
      updateDerivedValues(items);
    } catch (error) {
      console.error('Add to cart error:', error);
      setCartState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to add to cart'
      }));
      throw error;
    } finally {
      setCartState(prev => ({ ...prev, loading: false }));
    }
  };

  // Update item quantity
  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const items = cartState.items.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      );

      persistCart(items);
      updateDerivedValues(items);
    } catch (error) {
      console.error('Update cart error:', error);
      setCartState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update cart'
      }));
      throw error;
    } finally {
      setCartState(prev => ({ ...prev, loading: false }));
    }
  };

  // Remove item from cart
  const removeFromCart = async (itemId: string) => {
    setCartState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const items = cartState.items.filter(item => item.id !== itemId);
      persistCart(items);
      updateDerivedValues(items);
    } catch (error) {
      console.error('Remove from cart error:', error);
      setCartState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to remove from cart'
      }));
      throw error;
    } finally {
      setCartState(prev => ({ ...prev, loading: false }));
    }
  };

  // Clear entire cart (used after successful checkout)
  const clearCart = () => {
    const empty: CartItem[] = [];
    persistCart(empty);
    updateDerivedValues(empty);
  };

  // Clear error
  const clearError = () => {
    setCartState(prev => ({ ...prev, error: null }));
  };

  // Load cart when auth/user changes (switch between guest/user cart)
  useEffect(() => {
    loadCart();

    if (typeof window === 'undefined') return;

    const handler = () => loadCart();
    window.addEventListener('cart-updated', handler);
    return () => window.removeEventListener('cart-updated', handler);
  }, [storageKey]);

  return {
    ...cartState,
    fetchCart: loadCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearError,
    clearCart,
  };
}
