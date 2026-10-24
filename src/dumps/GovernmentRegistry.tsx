import React, { useState } from 'react';
import {
  Building2,
  Send,
  FileText,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
  ExternalLink,
  Search,
} from 'lucide-react';
import type { DumpReport } from './types';

interface GovernmentRegistryProps {
  dumps: DumpReport[];
  onOpenGovernmentModal: (dump: DumpReport) => void;
  onOpenSnapModal: () => void;
}

export const GovernmentRegistry: React.FC<GovernmentRegistryProps> = ({
  dumps,
  onOpenGovernmentModal,
  onOpenSnapModal,
}) => {
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');

  const dispatchedDumps = dumps.filter((d) => d.governmentDispatch || d.status === 'dispatched_to_government');
  const pendingDumps = dumps.filter((d) => !d.governmentDispatch && d.status !== 'cleaned');

  const filteredDispatches = dispatchedDumps.filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchAddress = (d.location.address || '').toLowerCase().includes(q);
      const matchTicket = (d.governmentDispatch?.ticketNumber || '').toLowerCase().includes(q);
      if (!matchTitle && !matchAddress && !matchTicket) return false;
    }
    if (selectedDeptFilter !== 'all' && d.governmentDispatch?.departmentName !== selectedDeptFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Government Grievance & Dispatch Registry
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Direct coordination portal with Municipal Sanitation Corporations & Public Works Departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs font-mono font-semibold text-blue-800">
            {dispatchedDumps.length} Active Official Tickets
          </div>
          <button
            onClick={onOpenSnapModal}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all"
          >
            Snap New Dump
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Dispatched
          </span>
          <span className="text-2xl font-bold font-mono text-slate-900 mt-1 block">
            {dispatchedDumps.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Transmitted to municipal authorities</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">
            Awaiting Clearance
          </span>
          <span className="text-2xl font-bold font-mono text-amber-600 mt-1 block">
            {dispatchedDumps.filter((d) => d.status !== 'cleaned').length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">In municipal resolution pipeline</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">
            Cleaned & Closed
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-1 block">
            {dispatchedDumps.filter((d) => d.status === 'cleaned').length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Verified by field sanitation teams</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider block">
            Pending Dispatch
          </span>
          <span className="text-2xl font-bold font-mono text-red-600 mt-1 block">
            {pendingDumps.length}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Citizen reports not yet sent to gov</span>
        </div>
      </div>

      {/* Action Strip for Unsent Reports */}
      {pendingDumps.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                {pendingDumps.length} Citizen Dump Reports Need Government Transmission
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Send these roadside evidence dossiers to the municipal corporation to schedule sweeper trucks.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenGovernmentModal(pendingDumps[0])}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs whitespace-nowrap shrink-0 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Dispatch Next Pending Dump
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ticket #, address, material..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Department:</span>
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          >
            <option value="all">All Municipal Departments</option>
            <option value="Municipal Solid Waste Management & Public Health Wing">Solid Waste Management</option>
            <option value="Emergency Rapid Sanitation & Environmental Protection Board">Emergency Rapid Sanitation</option>
            <option value="Department of Public Works - Road Clearance Division">Public Works / Roads</option>
          </select>
        </div>
      </div>

      {/* Dispatched Records Table / Cards */}
      <div className="space-y-4">
        {filteredDispatches.map((dump) => (
          <div
            key={dump.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 flex flex-col md:flex-row gap-5"
          >
            {/* Image Preview */}
            <div className="relative w-full md:w-56 h-40 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
              <img
                src={dump.imageUrl}
                alt={dump.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black/70 text-white backdrop-blur-xs">
                Ticket #{dump.governmentDispatch?.ticketNumber || 'PENDING'}
              </div>
            </div>

            {/* Content & Metadata */}
            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">
                  {dump.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    dump.status === 'cleaned'
                      ? 'bg-emerald-100 text-emerald-800'
                      : dump.severity === 'critical'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {dump.status === 'cleaned' ? 'Cleaned & Verified' : dump.status.replace(/_/g, ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{dump.location.address}</span>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 border-y border-slate-100 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Department</span>
                  <span className="truncate block font-semibold text-slate-800">
                    {dump.governmentDispatch?.departmentName || 'Public Works'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Assigned Officer</span>
                  <span className="text-slate-800 font-semibold truncate block">
                    {dump.governmentDispatch?.assignedOfficer || 'Sanitary Inspector'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Est. Weight</span>
                  <span className="text-slate-800 font-bold">{dump.estimatedWeightKg} kg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-sans block">Dispatched Date</span>
                  <span className="text-slate-600">
                    {dump.governmentDispatch?.dispatchedAt
                      ? new Date(dump.governmentDispatch.dispatchedAt).toLocaleDateString()
                      : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  {dump.categories.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                      {c}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${dump.location.lat},${dump.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Map Coordinates
                  </a>

                  <button
                    onClick={() => onOpenGovernmentModal(dump)}
                    className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" /> View Official Dossier & Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredDispatches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-700">No matching government dispatches found.</p>
            <p>Use the "Report to Government" button on any roadside dump to initiate an official ticket.</p>
          </div>
        )}
      </div>
    </div>
  );
};
