'use client';

import { useState, useEffect } from 'react';
import { Save, Bell, Shield, Palette, Globe, CreditCard, Mail, Smartphone, Settings as SettingsIcon } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderConfirmationEmails: boolean;
  shippingUpdateEmails: boolean;
  marketingEmails: boolean;
  lowStockAlerts: boolean;
  newOrderAlerts: boolean;
}

interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  maintenanceMode: boolean;
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'store' | 'notifications' | 'appearance' | 'payment'>('store');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    storeName: 'AutoHub Garage',
    storeEmail: 'info@autohub.ug',
    storePhone: '+256 123 456 789',
    storeAddress: '123 Kampala Road, Kampala, Uganda',
    currency: 'UGX',
    taxRate: 18,
    shippingFee: 5000,
    freeShippingThreshold: 50000
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    orderConfirmationEmails: true,
    shippingUpdateEmails: true,
    marketingEmails: false,
    lowStockAlerts: true,
    newOrderAlerts: true
  });

  const [appearanceSettings, setAppearanceSettings] = useState<AppearanceSettings>({
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    logoUrl: '/images/logo.png',
    faviconUrl: '/favicon.ico',
    maintenanceMode: false
  });

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage('');
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 1500);
  };

  const tabs = [
    { id: 'store' as const, label: 'Store Settings', icon: Globe },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'payment' as const, label: 'Payment & Shipping', icon: CreditCard }
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your store configuration and preferences</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-64">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <tab.icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm p-6">
                {saveMessage && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    {saveMessage}
                  </div>
                )}

                {/* Store Settings */}
                {activeTab === 'store' && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Store Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                          <input
                            type="text"
                            value={storeSettings.storeName}
                            onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Store Email</label>
                          <input
                            type="email"
                            value={storeSettings.storeEmail}
                            onChange={(e) => setStoreSettings({...storeSettings, storeEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Store Phone</label>
                          <input
                            type="tel"
                            value={storeSettings.storePhone}
                            onChange={(e) => setStoreSettings({...storeSettings, storePhone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                          <select
                            value={storeSettings.currency}
                            onChange={(e) => setStoreSettings({...storeSettings, currency: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="UGX">UGX - Ugandan Shilling</option>
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
                        <textarea
                          rows={3}
                          value={storeSettings.storeAddress}
                          onChange={(e) => setStoreSettings({...storeSettings, storeAddress: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={storeSettings.taxRate}
                            onChange={(e) => setStoreSettings({...storeSettings, taxRate: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Fee (UGX)</label>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={storeSettings.shippingFee}
                            onChange={(e) => setStoreSettings({...storeSettings, shippingFee: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Free Shipping Threshold (UGX)</label>
                          <input
                            type="number"
                            min="0"
                            step="1000"
                            value={storeSettings.freeShippingThreshold}
                            onChange={(e) => setStoreSettings({...storeSettings, freeShippingThreshold: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Bell className="h-5 w-5" />
                      Notification Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Enable Email Notifications</span>
                            <p className="text-sm text-gray-500">Master switch for all email notifications</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailNotifications}
                            onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Order Confirmation Emails</span>
                            <p className="text-sm text-gray-500">Send order confirmation to customers</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.orderConfirmationEmails}
                            onChange={(e) => setNotificationSettings({...notificationSettings, orderConfirmationEmails: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Shipping Update Emails</span>
                            <p className="text-sm text-gray-500">Notify customers about shipping status</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.shippingUpdateEmails}
                            onChange={(e) => setNotificationSettings({...notificationSettings, shippingUpdateEmails: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Marketing Emails</span>
                            <p className="text-sm text-gray-500">Send promotional offers and newsletters</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.marketingEmails}
                            onChange={(e) => setNotificationSettings({...notificationSettings, marketingEmails: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>
                      </div>

                      <div className="space-y-4 pt-6 border-t">
                        <h3 className="font-medium text-gray-900">Admin Notifications</h3>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Low Stock Alerts</span>
                            <p className="text-sm text-gray-500">Alert when products run low on inventory</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.lowStockAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, lowStockAlerts: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>

                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">New Order Alerts</span>
                            <p className="text-sm text-gray-500">Notify when new orders are received</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.newOrderAlerts}
                            onChange={(e) => setNotificationSettings({...notificationSettings, newOrderAlerts: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>
                      </div>

                      <div className="space-y-4 pt-6 border-t">
                        <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                        
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Enable SMS Notifications</span>
                            <p className="text-sm text-gray-500">Send important updates via SMS</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={notificationSettings.smsNotifications}
                            onChange={(e) => setNotificationSettings({...notificationSettings, smsNotifications: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Appearance Settings */}
                {activeTab === 'appearance' && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <Palette className="h-5 w-5" />
                      Appearance Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={appearanceSettings.primaryColor}
                              onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
                              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={appearanceSettings.primaryColor}
                              onChange={(e) => setAppearanceSettings({...appearanceSettings, primaryColor: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={appearanceSettings.secondaryColor}
                              onChange={(e) => setAppearanceSettings({...appearanceSettings, secondaryColor: e.target.value})}
                              className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={appearanceSettings.secondaryColor}
                              onChange={(e) => setAppearanceSettings({...appearanceSettings, secondaryColor: e.target.value})}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                          <input
                            type="text"
                            value={appearanceSettings.logoUrl}
                            onChange={(e) => setAppearanceSettings({...appearanceSettings, logoUrl: e.target.value})}
                            placeholder="/images/logo.png"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Favicon URL</label>
                          <input
                            type="text"
                            value={appearanceSettings.faviconUrl}
                            onChange={(e) => setAppearanceSettings({...appearanceSettings, faviconUrl: e.target.value})}
                            placeholder="/favicon.ico"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t">
                        <label className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-700">Maintenance Mode</span>
                            <p className="text-sm text-gray-500">Temporarily disable the store for maintenance</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={appearanceSettings.maintenanceMode}
                            onChange={(e) => setAppearanceSettings({...appearanceSettings, maintenanceMode: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment & Shipping Settings */}
                {activeTab === 'payment' && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment & Shipping Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> Payment gateway integration requires additional setup. Contact your payment provider for API credentials.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">Payment Methods</h3>
                        
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Cash on Delivery</span>
                                <p className="text-sm text-gray-500">Customers pay when they receive their order</p>
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Mobile Money</span>
                                <p className="text-sm text-gray-500">MTN Mobile Money, Airtel Money, etc.</p>
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Credit/Debit Cards</span>
                                <p className="text-sm text-gray-500">Visa, Mastercard, etc. (Requires payment gateway)</p>
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Bank Transfer</span>
                                <p className="text-sm text-gray-500">Direct bank deposit/transfer</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-4 pt-6 border-t">
                        <h3 className="font-medium text-gray-900">Shipping Options</h3>
                        
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Standard Shipping</span>
                                <p className="text-sm text-gray-500">3-5 business days</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{storeSettings.shippingFee} UGX</span>
                          </label>

                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Express Shipping</span>
                                <p className="text-sm text-gray-500">1-2 business days</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">15,000 UGX</span>
                          </label>

                          <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <input type="checkbox" defaultChecked className="h-4 w-4 text-blue-600 rounded" />
                              <div>
                                <span className="font-medium text-gray-700">Free Shipping</span>
                                <p className="text-sm text-gray-500">Orders over {storeSettings.freeShippingThreshold} UGX</p>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-green-600">FREE</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t">
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      {isLoading ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
