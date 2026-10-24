import React, { useState } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Upload,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Shield,
  Send,
} from 'lucide-react';
import type { DumpReport } from './types';

interface SweeperQueueProps {
  dumps: DumpReport[];
  onUpdateStatus: (
    id: string,
    status: any,
    assignedTeam?: string,
    sweeperNotes?: string,
    afterImageUrl?: string,
    recycledKg?: number
  ) => void;
  onOpenGovernmentModal: (dump: DumpReport) => void;
}

export const SweeperQueue: React.FC<SweeperQueueProps> = ({
  dumps,
  onUpdateStatus,
  onOpenGovernmentModal,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');
  const [selectedDump, setSelectedDump] = useState<DumpReport | null>(null);

  // Field action form state
  const [assignedCrew, setAssignedCrew] = useState('Municipal Sweeper Crew Alpha #2');
  const [crewNotes, setCrewNotes] = useState('');
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [recycledKg, setRecycledKg] = useState<number>(50);

  const pendingDumps = dumps.filter((d) => d.status === 'reported' || d.status === 'dispatched_to_government');
  const inProgressDumps = dumps.filter((d) => d.status === 'in_progress' || d.status === 'assigned_sweeper');
  const completedDumps = dumps.filter((d) => d.status === 'cleaned');

  const currentList =
    activeTab === 'pending' ? pendingDumps : activeTab === 'in_progress' ? inProgressDumps : completedDumps;

  const handleStartSweep = (dump: DumpReport) => {
    onUpdateStatus(
      dump.id,
      'in_progress',
      assignedCrew,
      'Crew arrived on site; hydraulic compacting and raking in progress.'
    );
  };

  const handleCompleteSweep = (dump: DumpReport) => {
    const afterProof =
      afterImage ||
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80'; // clean street photo

    onUpdateStatus(
      dump.id,
      'cleaned',
      assignedCrew,
      crewNotes || 'Area thoroughly sanitized, waste collected and sent to municipal recycling/compost center.',
      afterProof,
      recycledKg || dump.estimatedWeightKg
    );
    setSelectedDump(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Municipal Sweeper Field Operations
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Task dispatch, heavy machinery routing, and before/after cleanup verification for city sanitarians.
          </p>
        </div>

        {/* Sweeper Crew Badge */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <div className="text-xs">
            <span className="text-slate-400 block font-mono uppercase text-[10px]">Active Sweeper Unit</span>
            <span className="font-bold text-slate-800">{assignedCrew}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'pending'
              ? 'bg-amber-100 text-amber-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Priority Queue</span>
          <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded text-[11px]">
            {pendingDumps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('in_progress')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'in_progress'
              ? 'bg-blue-100 text-blue-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Crews In Progress</span>
          <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded text-[11px]">
            {inProgressDumps.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'completed'
              ? 'bg-emerald-100 text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Cleaned & Verified</span>
          <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded text-[11px]">
            {completedDumps.length}
          </span>
        </button>
      </div>

      {/* Grid of Task Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {currentList.map((dump) => (
          <div
            key={dump.id}
            className={`bg-white rounded-2xl border shadow-xs flex flex-col overflow-hidden transition-all hover:shadow-md ${
              dump.severity === 'critical' ? 'border-red-200' : 'border-slate-200'
            }`}
          >
            {/* Image & Status Pill */}
            <div className="relative h-44 bg-slate-100">
              <img
                src={dump.imageUrl}
                alt={dump.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white bg-black/60 backdrop-blur-xs">
                {dump.severity} priority · {dump.estimatedWeightKg} kg
              </div>
              {dump.governmentDispatch && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white bg-blue-600 shadow-xs">
                  Gov #{dump.governmentDispatch.ticketNumber}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900 leading-snug">
                  {dump.title}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{dump.location.address}</span>
                </p>

                {/* Equipment & Risks */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Required Machinery</span>
                    <span className="text-slate-700 font-medium block truncate">
                      {dump.recommendedEquipment.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Health Hazard</span>
                    <span className="text-red-700 font-medium block truncate">
                      {dump.healthRisks.join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cleaned Before/After verification view if completed */}
              {dump.status === 'cleaned' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Site Clearance Certified</span>
                  </div>
                  <p className="text-emerald-800 text-[11px]">
                    {dump.sweeperCrew?.sweeperNotes || 'Area sanitized, debris transferred to recycling facility.'}
                  </p>
                  <div className="flex justify-between text-[11px] font-mono text-emerald-900 pt-1 border-t border-emerald-200/60">
                    <span>Cleaned By: {dump.sweeperCrew?.assignedTeam}</span>
                    <span>Recycled: {dump.sweeperCrew?.recycledKg || dump.estimatedWeightKg} kg</span>
                  </div>
                </div>
              )}

              {/* Card Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                {dump.status !== 'cleaned' && (
                  <button
                    onClick={() => onOpenGovernmentModal(dump)}
                    className="px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Report to Gov
                  </button>
                )}

                {dump.status === 'reported' || dump.status === 'dispatched_to_government' ? (
                  <button
                    onClick={() => handleStartSweep(dump)}
                    className="ml-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <Truck className="w-3.5 h-3.5" /> Deploy Sweeper Crew
                  </button>
                ) : dump.status === 'in_progress' ? (
                  <button
                    onClick={() => setSelectedDump(dump)}
                    className="ml-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Cleanup & Verify
                  </button>
                ) : (
                  <span className="ml-auto text-xs font-mono font-semibold text-emerald-700">
                    Verified Clean
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {currentList.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <Truck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No dumps currently in this sweeper stage.</p>
          </div>
        )}
      </div>

      {/* Completion Modal: Upload After Photo & Sign Off */}
      {selectedDump && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Certify Roadside Cleanup
              </h3>
              <button
                onClick={() => setSelectedDump(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <div className="text-xs text-slate-600">
              Confirm site clearance for <b className="text-slate-900">{selectedDump.title}</b> at {selectedDump.location.address}.
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sanitation Crew / Team
                </label>
                <input
                  type="text"
                  value={assignedCrew}
                  onChange={(e) => setAssignedCrew(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Recycled / Diverted Waste (kg)
                </label>
                <input
                  type="number"
                  value={recycledKg}
                  onChange={(e) => setRecycledKg(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Sweeper Crew Clearance Report & Sanitization Notes
                </label>
                <textarea
                  rows={2}
                  value={crewNotes}
                  onChange={(e) => setCrewNotes(e.target.value)}
                  placeholder="e.g. Street curb vacuumed, debris loaded into compactor truck #7, bio-disinfectant applied."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setSelectedDump(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCompleteSweep(selectedDump)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Mark Area Cleaned & Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
