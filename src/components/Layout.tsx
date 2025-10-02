import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="lg:flex">
        <div className="hidden lg:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        <div
          className={`lg:hidden fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar
            collapsed={false}
            onToggleCollapse={() => setMobileSidebarOpen(false)}
            isMobile={true}
            isOpen={mobileSidebarOpen}
          />
        </div>

        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden transition-opacity duration-300"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen">
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="p-2 hover:bg-[#f5f5f5] rounded-xl transition"
              >
                {mobileSidebarOpen ? (
                  <X className="w-6 h-6 text-black" />
                ) : (
                  <Menu className="w-6 h-6 text-black" />
                )}
              </button>
              <span className="text-xl font-bold text-black">Cherry</span>
              <div className="w-10" />
            </div>
          </header>

          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
