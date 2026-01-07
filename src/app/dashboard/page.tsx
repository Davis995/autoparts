'use client';

import { useState } from 'react';
import { Package, User, LogOut } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { formatPrice } from '@/lib/currency';
import { useOrders, useCancelOrder } from '@/hooks/useOrders';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const { data: orders = [], isLoading } = useOrders({
    scope: 'me',
    // Use Supabase realtime to keep tracking status live
    // @ts-expect-error - internal flag on useOrders
    enableRealtime: true,
  });
  const cancelOrder = useCancelOrder();
  const { user, logout } = useAuth();
  const router = useRouter();

  const displayName =
    (user?.user_metadata as any)?.first_name && (user?.user_metadata as any)?.last_name
      ? `${(user?.user_metadata as any).first_name} ${(user?.user_metadata as any).last_name}`
      : (user?.user_metadata as any)?.full_name
        ? (user?.user_metadata as any).full_name
        : user?.email ?? 'Customer';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-emerald-100 text-emerald-800';
      case 'CASH_ON_DELIVERY': return 'bg-orange-100 text-orange-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'Delivered';
      case 'OUT_FOR_DELIVERY': return 'Out for Delivery';
      case 'PAID': return 'Paid';
      case 'CASH_ON_DELIVERY': return 'Cash on Delivery';
      case 'CANCELLED': return 'Cancelled';
      case 'PENDING': return 'Pending';
      default: return status;
    }
  };

  // Order status flow for customer tracking (Paid is the final step)
  const STATUS_FLOW: string[] = ['PENDING', 'CASH_ON_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'PAID'];

  const getStatusStepIndex = (status: string) => {
    const idx = STATUS_FLOW.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const activeOrders = orders.filter((order) => !['DELIVERED', 'CANCELLED'].includes(order.status));
  const deliveredOrders = orders.filter((order) => ['DELIVERED', 'CANCELLED'].includes(order.status));

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
                  <h2 className="font-bold text-base sm:text-lg">{displayName}</h2>
                  <p className="text-sm text-gray-600">{user?.email}</p>
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
                  onClick={async () => {
                    try {
                      await logout();
                      router.push('/login');
                    } catch (err) {
                      console.error('Logout failed:', err);
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left hover:bg-gray-50 text-red-600"
                >
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
                  <h2 className="text-lg font-bold mb-4">Active Orders</h2>

                  {isLoading ? (
                    <p className="text-sm text-gray-600">Loading your orders...</p>
                  ) : activeOrders.length === 0 ? (
                    <p className="text-sm text-gray-600">You have no active orders at the moment.</p>
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.map((order) => {
                        const currentStep = getStatusStepIndex(order.status);
                        return (
                          <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                              <div>
                                <h3 className="font-semibold">{order.orderNumber}</h3>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-left sm:text-right">
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

                            {/* Show progress flow only for non-cancelled orders */}
                            {order.status !== 'CANCELLED' && (
                              <>
                                {/* Mobile progress bar */}
                                <div className="mt-3 mb-4 sm:hidden">
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-2 rounded-full bg-blue-500"
                                      style={{ width: `${(currentStep / Math.max(1, STATUS_FLOW.length - 1)) * 100}%` }}
                                    />
                                  </div>
                                  <div className="mt-1 flex justify-between text-[10px] text-gray-600">
                                    <span>{getStatusText(STATUS_FLOW[0])}</span>
                                    <span>{getStatusText(order.status)}</span>
                                    <span>{getStatusText(STATUS_FLOW[STATUS_FLOW.length - 1])}</span>
                                  </div>
                                </div>

                                {/* Status stepper - shown on tablets/desktop */}
                                <div className="mt-3 mb-4 overflow-x-auto hidden sm:block">
                                  <div className="flex items-center gap-3 px-1">
                                    {STATUS_FLOW.map((step, index) => {
                                      const isCompleted = index < currentStep;
                                      const isCurrent = index === currentStep;
                                      return (
                                        <div key={step} className="flex-1 flex flex-col items-center text-center">
                                          <div className="flex items-center w-full">
                                            {index > 0 && (
                                              <div
                                                className={`h-0.5 flex-1 ${
                                                  index <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                                                }`}
                                              />
                                            )}
                                            <div
                                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border ${
                                                isCompleted
                                                  ? 'bg-green-500 text-white border-green-500'
                                                  : isCurrent
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-gray-100 text-gray-500 border-gray-300'
                                              }`}
                                            >
                                              {index + 1}
                                            </div>
                                            {index < STATUS_FLOW.length - 1 && (
                                              <div
                                                className={`h-0.5 flex-1 ${
                                                  index < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                                                }`}
                                              />
                                            )}
                                          </div>
                                          <p className="mt-1 text-[10px] sm:text-xs text-gray-600 whitespace-nowrap">
                                            {getStatusText(step)}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </>
                            )}

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

                            {['PENDING', 'CASH_ON_DELIVERY'].includes(order.status) && (
                              <div className="mt-4 flex justify-end">
                                <button
                                  type="button"
                                  disabled={cancelOrder.isPending}
                                  onClick={() => {
                                    if (cancelOrder.isPending) return;
                                    const confirmed = window.confirm('Are you sure you want to cancel this order?');
                                    if (!confirmed) return;
                                    cancelOrder.mutate({ id: order.id });
                                  }}
                                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {cancelOrder.isPending ? 'Cancelling...' : 'Cancel Order'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-bold mb-4">Delivered Orders (History)</h2>

                  {isLoading ? (
                    <p className="text-sm text-gray-600">Loading your orders...</p>
                  ) : deliveredOrders.length === 0 ? (
                    <p className="text-sm text-gray-600">You have no delivered orders yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {deliveredOrders.map((order) => (
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
                      defaultValue={user?.user_metadata?.phone || ''}
                      placeholder="e.g. +256 712 345 678"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    disabled
                    className="bg-gray-300 text-gray-600 px-6 py-2 rounded-lg font-medium cursor-not-allowed"
                    title="Profile editing is not yet wired to backend"
                  >
                    Save Changes
                  </button>
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
