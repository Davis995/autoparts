'use client';

import { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuthContext } from './AuthProvider';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthContext();

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-blue-600" />
        </div>
        <span className="text-sm font-medium hidden sm:block">{user.name}</span>
        <ChevronDown className="h-4 w-4 text-gray-600" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
