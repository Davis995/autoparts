'use client';

import Image from 'next/image';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/currency';
import type { ProductWithCategory } from '@/hooks/useProducts';

let favoritesLoaded = false;
let favoriteIds = new Set<string>();
let favoritesPromise: Promise<void> | null = null;

async function ensureFavoritesLoaded() {
  if (favoritesLoaded) return;

  if (favoritesPromise) {
    await favoritesPromise;
    return;
  }

  favoritesPromise = (async () => {
    try {
      if (typeof window === 'undefined') return;

      const rawSession = localStorage.getItem('auth_session');
      if (!rawSession) return;

      const parsed = JSON.parse(rawSession);
      const token = parsed?.token;
      if (!token) return;

      const response = await fetch('/api/favorites', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) return;

      const data: Array<{ product?: { id: string } }> = await response.json();
      const ids = new Set<string>();
      for (const item of data || []) {
        const id = item?.product?.id;
        if (id) ids.add(id);
      }
      favoriteIds = ids;
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      favoritesLoaded = true;
    }
  })();

  await favoritesPromise;
}

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string, isFavorited: boolean) => void;
}

export function ProductCard({ product, onAddToCart, onToggleFavorite }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { addToCart, items, loading: cartLoading } = useCart();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const quantityInCart = items.find((i) => i.product_id === product.id)?.quantity ?? 0;

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    (async () => {
      await ensureFavoritesLoaded();
      if (!isMounted) return;
      setIsFavorited(favoriteIds.has(product.id));
    })();

    return () => {
      isMounted = false;
    };
  }, [product.id, isAuthenticated]);

  const toggleFavorite = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('auth_session') ? JSON.parse(localStorage.getItem('auth_session')!).token : null;
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const method = isFavorited ? 'DELETE' : 'POST';
      const response = await fetch(`/api/favorites/${product.id}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const newFavoriteStatus = !isFavorited;
        setIsFavorited(newFavoriteStatus);
        if (newFavoriteStatus) {
          favoriteIds.add(product.id);
        } else {
          favoriteIds.delete(product.id);
        }
        onToggleFavorite?.(product.id, newFavoriteStatus);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    // If stock information is missing, allow add-to-cart; otherwise enforce stock rules
    if ((product as any).stock === 0) {
      return;
    }

    try {
      await addToCart(product as any, 1);
      onAddToCart?.(product.id);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-transform transition-shadow duration-300 hover:-translate-y-1 h-full flex flex-col cursor-pointer" onClick={() => router.push(`/products/${product.id}`)}>
      <div className="relative w-full h-48 sm:h-56 lg:h-64">
        <Image
          src={product.images[0] || '/images/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
        />
        {product.isBestSelling && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold z-10">
            Best Seller
          </div>
        )}
        {product.isTopSelling && (
          <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs sm:text-sm font-semibold z-10">
            Top Rated
          </div>
        )}
        {quantityInCart > 0 && (
          <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-semibold z-10">
            In Cart: {quantityInCart}
          </div>
        )}
        <button
          onClick={toggleFavorite}
          disabled={isLoading}
          className="absolute top-2 left-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Heart 
            className={`h-4 w-4 sm:h-5 sm:w-5 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`}
          />
        </button>
      </div>
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="text-xs sm:text-sm text-gray-500 mb-1">{product.category?.name}</div>
        <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 line-clamp-2 flex-grow">{product.name}</h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
        <div className="flex items-center justify-between mb-3 mt-auto">
          <div>
            <span className="text-lg sm:text-xl font-bold text-blue-600">{formatPrice(product.price)}</span>
            <div className="text-xs sm:text-sm text-gray-500 mb-1">{product.category?.name}</div>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={(product as any).stock === 0 || cartLoading}
            className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
        {(product as any).stock < 10 && (product as any).stock > 0 && (
          <div className="text-xs sm:text-sm text-orange-600">Only {(product as any).stock} left</div>
        )}
        {(product as any).stock === 0 && (
          <div className="text-xs sm:text-sm text-red-600">Out of stock</div>
        )}
      </div>
    </div>
  );
}
