'use client';

import { useState } from 'react';
import { Package, User, MapPin, CreditCard, LogOut } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { formatPrice } from '@/lib/currency';
import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses' | 'payment'>('orders');
  const { data: orders = [], isLoading } = useOrders({ scope: 'me', refetchIntervalMs: 10000 });
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered': return 'Delivered';
      case 'shipped': return 'Shipped';
      case 'processing': return 'Processing';
      case 'pending': return 'Pending';
      default: return status;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        {/* Navigation */}
        <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg">John Doe</h2>
                  <p className="text-sm text-gray-600">john@example.com</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'orders' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <Package className="h-5 w-5" />
                  <span className="text-sm sm:text-base">My Orders</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="text-sm sm:text-base">Profile</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'addresses' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm sm:text-base">Addresses</span>
                </button>
                <button
                  onClick={() => setActiveTab('payment')}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left transition-colors ${
                    activeTab === 'payment' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="text-sm sm:text-base">Payment Methods</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left hover:bg-gray-50 text-red-600">
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm sm:text-base">Log Out</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-bold mb-4">Order History</h2>

                  {isLoading ? (
                    <p className="text-sm text-gray-600">Loading your orders...</p>
                  ) : orders.length === 0 ? (
                    <p className="text-sm text-gray-600">You have no orders yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{order.orderNumber}</h3>
                              <p className="text-sm text-gray-600">
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  order.status
                                )}`}
                              >
                                {getStatusText(order.status)}
                              </span>
                              <p className="text-lg font-bold mt-1">{formatPrice(order.total)}</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {(order.orderItems || []).map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  {item.quantity}x {item.product?.name ?? 'Product'}
                                </span>
                                <span>{formatPrice(item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold mb-6">Profile Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue={user?.user_metadata?.first_name || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue={user?.user_metadata?.last_name || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue={user?.email || ''}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Shipping Addresses</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Add Address
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Home</h3>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Default</span>
                      </div>
                      <p className="text-gray-600 text-sm">123 Main St</p>
                      <p className="text-gray-600 text-sm">New York, NY 10001</p>
                      <p className="text-gray-600 text-sm">United States</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Office</h3>
                      </div>
                      <p className="text-gray-600 text-sm">456 Business Ave</p>
                      <p className="text-gray-600 text-sm">New York, NY 10002</p>
                      <p className="text-gray-600 text-sm">United States</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Payment Methods</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Add Payment Method
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            VISA
                          </div>
                          <div>
                            <p className="font-medium">•••• 4242</p>
                            <p className="text-sm text-gray-600">Expires 12/25</p>
                          </div>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Default</span>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">
                            MC
                          </div>
                          <div>
                            <p className="font-medium">•••• 5555</p>
                            <p className="text-sm text-gray-600">Expires 09/24</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
