import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar'; // We'll create this next

export const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
        <div className="container px-6 py-8 mx-auto">
          <Outlet /> {/* Page content will be rendered here */}
        </div>
      </main>
    </div>
  );
};
