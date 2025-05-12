import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="container flex items-center justify-between px-4 py-4 mx-auto">
          <Link to="/" className="flex items-center space-x-2">
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
            <span className="text-xl font-bold text-gray-900">Kanora</span>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-grow">
        <div className="container flex items-center justify-center px-4 py-12 mx-auto">
          {children}
        </div>
      </main>

      <footer className="py-6 bg-white">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <div className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Kanora Media Server. All rights
              reserved.
            </div>
            <div className="flex space-x-4">
              <Link
                to="/privacy"
                className="text-sm text-gray-600 hover:text-primary-600"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="text-sm text-gray-600 hover:text-primary-600"
              >
                Terms of Service
              </Link>
              <Link
                to="/contact"
                className="text-sm text-gray-600 hover:text-primary-600"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
