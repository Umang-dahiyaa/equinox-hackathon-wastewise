import React from 'react';
import { Camera, MapPin, Send, Truck, Sparkles } from 'lucide-react';

interface NavbarProps {
  activeTab: 'heatmap' | 'snap' | 'government' | 'sweeper' | 'classifier';
  setActiveTab: (tab: 'heatmap' | 'snap' | 'government' | 'sweeper' | 'classifier') => void;
  onOpenSnapModal: () => void;
  activeDumpsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSnapModal,
  activeDumpsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('heatmap')}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                W
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  WasteWise
                </span>
                <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                  Civic Sanitation & Illegal Dump Heatmap
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Nav links */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'heatmap'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Sweeper Heatmap</span>
              {activeDumpsCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-mono font-semibold">
                  {activeDumpsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('government')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'government'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Send className="w-4 h-4 text-blue-600" />
              <span>Government Dispatch</span>
            </button>

            <button
              onClick={() => setActiveTab('sweeper')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'sweeper'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span>Sweeper Crew HUD</span>
            </button>

            <button
              onClick={() => setActiveTab('classifier')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'classifier'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Smart Waste Sort</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenSnapModal}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-sm whitespace-nowrap shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>Snap Roadside Dump</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation strip */}
      <div className="flex md:hidden border-t border-slate-200 px-2 py-1.5 bg-slate-50 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab('heatmap')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'heatmap' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Heatmap
        </button>
        <button
          onClick={() => setActiveTab('government')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'government' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Gov Dispatch
        </button>
        <button
          onClick={() => setActiveTab('sweeper')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'sweeper' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Sweeper HUD
        </button>
        <button
          onClick={() => setActiveTab('classifier')}
          className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
            activeTab === 'classifier' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Smart Sort
        </button>
      </div>
    </header>
  );
};
