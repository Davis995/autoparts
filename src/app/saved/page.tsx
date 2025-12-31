'use client';

import { useState, useEffect } from 'react';
import { Heart, Share2, Trash2, ShoppingCart } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { formatPrice } from '@/lib/currency';
import { useCart } from '@/hooks/useCart';

interface SavedItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  savedDate: string;
  inStock: boolean;
  productId: string;
}

export default function SavedPage() {
  const { user, isAuthenticated } = useAuth();
  const { addToCart, loading: cartLoading } = useCart();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSavedItems();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  const fetchSavedItems = async () => {
    try {
      const sessionData = localStorage.getItem('auth_session');
      if (!sessionData) return;

      const { token } = JSON.parse(sessionData);
      const response = await fetch('/api/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Transform backend data to match SavedItem interface
        const transformedItems = data.map((item: any) => ({
          id: item.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.images[0] || '/api/placeholder/300/200',
          category: item.product.category.name,
          savedDate: new Date(item.createdAt).toLocaleDateString(),
          inStock: item.product.stock > 0,
          productId: item.product.id,
        }));
        setSavedItems(transformedItems);
      } else {
        setError('Failed to load saved items');
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
      setError('An error occurred while loading saved items');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromSaved = async (id: string, productId: string) => {
    try {
      const sessionData = localStorage.getItem('auth_session');
      if (!sessionData) return;

      const { token } = JSON.parse(sessionData);
      const response = await fetch(`/api/favorites/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedItems(savedItems.filter(item => item.id !== id));
      } else {
        console.error('Failed to remove item from favorites');
      }
    } catch (error) {
      console.error('Error removing from saved:', error);
    }
  };

  const addToCartFromSaved = async (productId: string) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    const saved = savedItems.find((item) => item.productId === productId);
    if (!saved) return;

    try {
      // First update local cart via context/localStorage
      await addToCart({
        id: saved.productId,
        name: saved.name,
        price: saved.price,
        description: null,
        stock: saved.inStock ? 999999 : 0,
        images: [saved.image],
      } as any, 1);
      // Optional: server sync to database cart could be added here later
      console.log('Added to cart from saved:', productId);
    } catch (error) {
      console.error('Error adding to cart from saved:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Saved Items</h1>
            <p className="mt-2 text-gray-600">Items you've saved for later</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
              <p className="mt-2 text-gray-600">{error}</p>
              <button 
                onClick={fetchSavedItems}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : savedItems.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No saved items</h3>
              <p className="mt-2 text-gray-600">Start browsing and save items you're interested in!</p>
              <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                    <button
                      onClick={() => removeFromSaved(item.id, item.productId)}
                      className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                    </button>
                    {!item.inStock && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-2">
                      <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                        {item.category}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Saved {item.savedDate}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCartFromSaved(item.productId)}
                        disabled={!item.inStock}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          item.inStock 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                      
                      <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {savedItems.length > 0 && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setSavedItems([])}
                className="text-red-600 hover:text-red-700 font-medium text-sm"
              >
                Clear all saved items
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
