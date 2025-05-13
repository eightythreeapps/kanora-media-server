import React from 'react';
import { Link } from 'react-router-dom';

export const UserAccessDenied: React.FC = () => {
  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-gray-600">
          Self-Registration Not Available
        </p>
      </div>

      <div className="p-4 mb-4 text-sm text-amber-700 bg-amber-100 rounded-lg">
        <p className="font-medium">Local Authentication System</p>
        <p className="mt-2">
          Kanora uses a local authentication system where new accounts must be
          created by an administrator for security purposes.
        </p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-600">
          Please contact your system administrator to request a new user
          account.
        </p>
      </div>

      <div className="mt-6">
        <Link
          to="/login"
          className="w-full flex justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
};
