import React from 'react';
import DemoBanner from '../common/DemoBanner';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileNav from './MobileNav';
import QuickSearchModal from '../common/QuickSearchModal';
import SosModal from '../common/SosModal';
import ToastContainer from '../common/Toast';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Demo Mode Indicator Top Banner */}
      <DemoBanner />

      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Desktop Sidebar */}
        <Sidebar />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-20 md:pb-6">
          <TopBar />
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Bottom Nav for Mobile */}
      <MobileNav />

      {/* Global Modals & Notifications */}
      <QuickSearchModal />
      <SosModal />
      <ToastContainer />
    </div>
  );
}
