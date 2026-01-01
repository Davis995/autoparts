'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Navigation } from '@/components/Navigation';
import { ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, loading, clearCart } = useCart();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      {/* Navigation */}
      <Navigation />

      {/* Simple one-step checkout header */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold">Checkout</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Confirm your details and place your order.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-6">Contact & Delivery details</h2>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery location</label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter area, street, or place name"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This will be used with Google Maps to calculate delivery distance.
                  </p>
                </div>
              </div>

              {/* Coordinates are now resolved internally via Google APIs; no need to show fields */}

              <button
                onClick={async () => {
                  if (!items.length) {
                    setError('Your cart is empty.');
                    return;
                  }

                  setIsPlacingOrder(true);
                  setError(null);

                  try {
                    const sessionData =
                      typeof window !== 'undefined'
                        ? localStorage.getItem('auth_session')
                        : null;
                    const token = sessionData ? JSON.parse(sessionData).token : null;

                    if (!token) {
                      router.push('/login');
                      return;
                    }

                    const response = await fetch('/api/orders/checkout', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        phone,
                        locationName,
                        items: items.map((item) => ({
                          productId: item.product.id,
                          quantity: item.quantity,
                        })),
                        latitude: latitude ? Number(latitude) : null,
                        longitude: longitude ? Number(longitude) : null,
                      }),
                    });

                    if (!response.ok) {
                      const data = await response.json().catch(() => ({}));
                      setError(data.error || 'Failed to place order');
                      return;
                    }

                    // Order placed successfully; clear the local cart
                    clearCart();
                    router.push('/dashboard');
                  } catch (err) {
                    setError('Unexpected error placing order');
                  } finally {
                    setIsPlacingOrder(false);
                  }
                }}
                disabled={isPlacingOrder || loading || !items.length}
                className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPlacingOrder ? 'Placing order...' : 'Place Order'}
                {!isPlacingOrder && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
              <h2 className="text-lg sm:text-xl font-bold mb-4">Order Summary</h2>

              {loading ? (
                <p className="text-sm text-gray-600">Loading cart...</p>
              ) : items.length === 0 ? (
                <p className="text-sm text-gray-600">Your cart is empty.</p>
              ) : (
                <>
                  <div className="space-y-3 mb-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <Image
                          src={item.product?.images?.[0] || '/images/placeholder.jpg'}
                          alt={item.product?.name || 'Product image'}
                          width={80}
                          height={80}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm sm:text-base">{item.product?.name ?? 'Product'}</h4>
                          {item.product?.description && (
                            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
                              {item.product.description}
                            </p>
                          )}
                          <p className="text-xs sm:text-sm text-gray-500">Qty: {item.quantity}</p>
                          <p className="text-sm sm:text-base font-medium">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm sm:text-base">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-base sm:text-lg">Total</span>
                        <span className="font-bold text-lg sm:text-xl text-blue-600">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
