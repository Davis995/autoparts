'use client';

export default function SimpleAdminLogin() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">
              Sign in to access the AutoHub Garage admin panel
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="admin@autohubgarage.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Enter your admin password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Sign in to Admin Panel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
