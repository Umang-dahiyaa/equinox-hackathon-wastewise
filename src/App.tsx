import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { HeatmapView } from './components/HeatmapView.tsx';
import { GovernmentReportModal } from './components/GovernmentReportModal.tsx';
import { SnapReportModal } from './components/SnapReportModal.tsx';
import { GovernmentRegistry } from './components/GovernmentRegistry.tsx';
import { SweeperQueue } from './components/SweeperQueue.tsx';
import { WasteClassifier } from './components/WasteClassifier.tsx';
import type { DumpReport } from './types.ts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'snap' | 'government' | 'sweeper' | 'classifier'>('heatmap');
  const [dumps, setDumps] = useState<DumpReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [isGovModalOpen, setIsGovModalOpen] = useState(false);
  const [selectedDumpForGov, setSelectedDumpForGov] = useState<DumpReport | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const fetchDumps = async () => {
    try {
      const res = await fetch('/api/dumps');
      const data = await res.json();
      if (data.success && data.dumps) {
        setDumps(data.dumps);
      }
    } catch (err) {
      console.error('Error fetching dumps:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDumps();
  }, []);

  const handleOpenGovernmentModal = (dump: DumpReport) => {
    setSelectedDumpForGov(dump);
    setIsGovModalOpen(true);
  };

  const handleReportCreated = (newDump: DumpReport, openGovernmentDispatchImmediately = false) => {
    setDumps((prev) => [newDump, ...prev]);
    showToast(`Roadside dump "${newDump.title}" recorded and added to sweeper density heatmap.`);

    if (openGovernmentDispatchImmediately) {
      setSelectedDumpForGov(newDump);
      setIsGovModalOpen(true);
    }
  };

  const handleGovernmentReportSuccess = (updatedDump: DumpReport) => {
    setDumps((prev) => prev.map((d) => (d.id === updatedDump.id ? updatedDump : d)));
    showToast(`Official Grievance Ticket #${updatedDump.governmentDispatch?.ticketNumber} transmitted to Government body.`);
  };

  const handleUpdateStatus = async (
    id: string,
    status: any,
    assignedTeam?: string,
    sweeperNotes?: string,
    afterImageUrl?: string,
    recycledKg?: number
  ) => {
    try {
      const res = await fetch(`/api/dumps/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          assignedTeam,
          sweeperNotes,
          afterImageUrl,
          recycledKg,
        }),
      });

      const data = await res.json();
      if (data.success && data.dump) {
        setDumps((prev) => prev.map((d) => (d.id === id ? data.dump : d)));
        showToast(`Sweeper status updated: Area marked as ${status.replace(/_/g, ' ')}.`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const activeDumpsCount = dumps.filter((d) => d.status !== 'cleaned').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSnapModal={() => setIsSnapModalOpen(true)}
        activeDumpsCount={activeDumpsCount}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500">
                Loading WasteWise Geo-Sanitation Network...
              </span>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'heatmap' && (
              <HeatmapView
                dumps={dumps}
                onSelectDump={(dump) => setSelectedDumpForGov(dump)}
                onOpenGovernmentModal={handleOpenGovernmentModal}
                onOpenSnapModal={() => setIsSnapModalOpen(true)}
                onUpdateStatus={handleUpdateStatus}
                onRefreshDumps={fetchDumps}
              />
            )}

            {activeTab === 'government' && (
              <GovernmentRegistry
                dumps={dumps}
                onOpenGovernmentModal={handleOpenGovernmentModal}
                onOpenSnapModal={() => setIsSnapModalOpen(true)}
              />
            )}

            {activeTab === 'sweeper' && (
              <SweeperQueue
                dumps={dumps}
                onUpdateStatus={handleUpdateStatus}
                onOpenGovernmentModal={handleOpenGovernmentModal}
              />
            )}

            {activeTab === 'classifier' && (
              <WasteClassifier onOpenSnapModal={() => setIsSnapModalOpen(true)} />
            )}
          </>
        )}
      </main>

      {/* Citizen Snap & Report Modal */}
      <SnapReportModal
        isOpen={isSnapModalOpen}
        onClose={() => setIsSnapModalOpen(false)}
        onReportCreated={handleReportCreated}
      />

      {/* Government Report & Dispatch Modal */}
      <GovernmentReportModal
        dump={selectedDumpForGov}
        isOpen={isGovModalOpen}
        onClose={() => {
          setIsGovModalOpen(false);
          setSelectedDumpForGov(null);
        }}
        onReportSuccess={handleGovernmentReportSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
