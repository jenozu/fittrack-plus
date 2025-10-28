import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

