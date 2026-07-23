import React from 'react';
import { LayoutDashboard, Mic, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab, onOpenSettings }) {
  return (
    <nav className="bottom-nav">
      <button 
        className={`bottom-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
      >
        <LayoutDashboard size={20} />
        <span>Dashboard</span>
      </button>

      <button 
        className={`bottom-nav-item ${activeTab === 'record' ? 'active' : ''}`}
        onClick={() => setActiveTab('record')}
      >
        <Mic size={20} />
        <span>Record</span>
      </button>

      <button 
        className="bottom-nav-item"
        onClick={onOpenSettings}
      >
        <Settings size={20} />
        <span>Settings</span>
      </button>
    </nav>
  );
}
