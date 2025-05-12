import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl p-8 space-y-8 bg-white rounded-lg shadow-lg">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome to Kanora
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Hello, {user?.firstName} {user?.lastName}!
            </p>
          </div>

          <div className="p-6 mt-6 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800">
              Your Account Information
            </h2>
            <div className="mt-4 space-y-2">
              <div className="flex">
                <span className="w-32 font-medium text-gray-600">Email:</span>
                <span className="text-gray-800">{user?.email}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-medium text-gray-600">Name:</span>
                <span className="text-gray-800">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 font-medium text-gray-600">Joined:</span>
                <span className="text-gray-800">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 mt-6 bg-gray-50 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-800">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-2 lg:grid-cols-3">
              <button className="flex flex-col items-center justify-center p-4 transition-colors bg-white border rounded-lg shadow-sm hover:bg-primary-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                  />
                </svg>
                <span className="mt-2 font-medium text-gray-800">
                  Browse Music
                </span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 transition-colors bg-white border rounded-lg shadow-sm hover:bg-primary-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="mt-2 font-medium text-gray-800">
                  Upload Music
                </span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 transition-colors bg-white border rounded-lg shadow-sm hover:bg-primary-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="mt-2 font-medium text-gray-800">Settings</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
