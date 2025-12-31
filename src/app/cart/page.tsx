'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { formatPrice } from '@/lib/currency';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    description: string | null;
    images: string[];
    stock: number;
  };
  quantity: number;
}

export default function CartPage() {
  const router = useRouter();
  const { items, loading, error, updateQuantity, removeFromCart } = useCart();
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Navigation */}
      <Navigation />

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4">
          <ShoppingBag className="h-16 w-16 sm:h-20 sm:w-20 text-gray-300 mb-4" />
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6 text-center">Add some car accessories to get started</p>
          <button 
            onClick={() => router.push('/products')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Image
                      src={item.product?.images?.[0] || '/images/placeholder.jpg'}
                      alt={item.product?.name || 'Product image'}
                      width={120}
                      height={120}
                      className="w-full sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2">{item.product?.name ?? 'Product'}</h3>
                      {item.product?.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2">
                          {item.product.description}
                        </p>
                      )}
                      <p className="text-lg sm:text-xl font-bold text-blue-600 mb-3">
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center bg-gray-100 rounded-lg">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.id);
                              } else {
                                updateQuantity(item.id, item.quantity - 1);
                              }
                            }}
                            disabled={loading}
                            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="px-3 sm:px-4 py-1 sm:py-2 text-sm sm:text-base font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || item.quantity >= item.product.stock}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          disabled={loading}
                          className="text-red-500 hover:text-red-700 transition-colors p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.quantity >= item.product.stock && (
                        <span className="text-xs sm:text-sm text-gray-500 ml-1">Max stock reached</span>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-base sm:text-lg">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
                <h2 className="text-lg sm:text-xl font-bold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-base sm:text-lg">Total</span>
                      <span className="font-bold text-lg sm:text-xl text-blue-600">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors mb-3 text-sm sm:text-base"
                >
                  Proceed to Checkout
                </button>

                <button 
                  onClick={() => router.push('/products')}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
