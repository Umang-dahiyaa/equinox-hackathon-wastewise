import React, { useState } from 'react';
import {
  X,
  Send,
  Building2,
  FileText,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Copy,
  ExternalLink,
  ShieldCheck,
  Clock,
  Truck,
} from 'lucide-react';
import type { DumpReport } from './types';

interface GovernmentReportModalProps {
  dump: DumpReport | null;
  isOpen: boolean;
  onClose: () => void;
  onReportSuccess: (updatedDump: DumpReport) => void;
}

export const GovernmentReportModal: React.FC<GovernmentReportModalProps> = ({
  dump,
  isOpen,
  onClose,
  onReportSuccess,
}) => {
  if (!isOpen || !dump) return null;

  const [selectedDept, setSelectedDept] = useState(
    dump.severity === 'critical'
      ? 'Emergency Rapid Sanitation & Environmental Protection Board'
      : dump.categories.includes('construction')
      ? 'Department of Public Works - Road Clearance Division'
      : 'Municipal Solid Waste Management & Public Health Wing'
  );

  const [customNotes, setCustomNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(dump.severity === 'critical' || dump.severity === 'high');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dossierResult, setDossierResult] = useState<any>(
    dump.governmentDispatch
      ? {
          ticketNumber: dump.governmentDispatch.ticketNumber,
          authority: dump.governmentDispatch.departmentName,
          officer: dump.governmentDispatch.assignedOfficer,
          dossierHash: dump.governmentDispatch.dossierHash,
        }
      : null
  );

  const handleSendToGovernment = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/dumps/${dump.id}/report-government`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetDepartment: selectedDept,
          customNotes,
          urgentPriority: isUrgent,
        }),
      });

      const data = await res.json();
      if (data.success && data.dump) {
        setDossierResult(data.formalDossier);
        onReportSuccess(data.dump);
      } else {
        alert(data.error || 'Failed to dispatch report to government body.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Network error while dispatching to government authority.');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate Mailto Link for Citizen email direct to municipal inbox
  const generateMailtoLink = () => {
    const ticket = dossierResult?.ticketNumber || dump.governmentDispatch?.ticketNumber || 'PENDING';
    const subject = encodeURIComponent(
      `[URGENT SANITATION GRIEVANCE #${ticket}] Illegal Roadside Dump at ${dump.location.address || `${dump.location.lat}, ${dump.location.lng}`}`
    );
    const body = encodeURIComponent(
      `TO: ${selectedDept}\n` +
      `ATTN: Municipal Sanitation & Public Works Clearance Division\n\n` +
      `GRIEVANCE TICKET: #${ticket}\n` +
      `DATE/TIME: ${new Date().toLocaleString()}\n` +
      `LOCATION: ${dump.location.address || 'Roadside Shoulder'}\n` +
      `GPS COORDINATES: ${dump.location.lat.toFixed(5)}, ${dump.location.lng.toFixed(5)}\n` +
      `MAPS LINK: https://www.google.com/maps?q=${dump.location.lat},${dump.location.lng}\n\n` +
      `WASTE DETAILS:\n` +
      `- Title: ${dump.title}\n` +
      `- Estimated Volume/Weight: ${dump.estimatedWeightKg} kg\n` +
      `- Severity: ${dump.severity.toUpperCase()}\n` +
      `- Categories: ${dump.categories.join(', ')}\n` +
      `- Public Health Hazards: ${dump.healthRisks.join(', ')}\n` +
      `- Recommended Machinery: ${dump.recommendedEquipment.join(', ')}\n\n` +
      `CITIZEN REMARKS: ${customNotes || 'Please deploy municipal sweepers to clear this illegal roadside dump as soon as possible.'}\n\n` +
      `PHOTO EVIDENCE RECORDED: ${dump.imageUrl}\n\n` +
      `Submitted via WasteWise Civic Sanitation Gateway.`
    );
    return `mailto:sanitation-grievance@municipal.gov.city?subject=${subject}&body=${body}`;
  };

  const copyDossierText = () => {
    const ticket = dossierResult?.ticketNumber || dump.governmentDispatch?.ticketNumber || 'SW-MUNI-REPORT';
    const text =
      `GOVERNMENT SANITATION GRIEVANCE DOSSIER #${ticket}\n` +
      `Department: ${selectedDept}\n` +
      `Coordinates: ${dump.location.lat}, ${dump.location.lng}\n` +
      `Address: ${dump.location.address}\n` +
      `Severity: ${dump.severity.toUpperCase()}\n` +
      `Estimated Weight: ${dump.estimatedWeightKg} kg\n` +
      `Categories: ${dump.categories.join(', ')}\n` +
      `Equipment Needed: ${dump.recommendedEquipment.join(', ')}\n` +
      `Verification Hash: ${dossierResult?.dossierHash || 'Verified'}\n` +
      `Google Maps: https://www.google.com/maps?q=${dump.location.lat},${dump.location.lng}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Send Report to Government Body
              </h2>
              <p className="text-xs text-slate-500">
                Official Municipal Grievance & Sweeper Dispatch Portal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {dossierResult ? (
            /* Successful Dispatch Dossier View */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">
                    Official Grievance Dossier Dispatched
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Your report has been formally registered with the municipal sanitation system. A sweeper crew has been notified.
                  </p>
                </div>
              </div>

              {/* Official Ticket Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 uppercase">Ticket Number</span>
                  <span className="font-bold text-slate-900 text-sm">{dossierResult.ticketNumber}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 uppercase">Municipal Authority</span>
                  <span className="font-semibold text-slate-800 text-right">{selectedDept}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 uppercase">Assigned Officer</span>
                  <span className="text-slate-800">{dossierResult.assignedOfficer || 'District Sanitary Inspector'}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 uppercase">Response SLA</span>
                  <span className="text-emerald-700 font-bold">Within {dump.severity === 'critical' ? '8' : '24'} Hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase">Verification Hash</span>
                  <span className="text-slate-600 text-[11px]">{dossierResult.dossierHash || 'e7f1082a9c4b9213'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={generateMailtoLink()}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Draft Official Email</span>
                </a>

                <button
                  onClick={copyDossierText}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Dossier Copied!' : 'Copy Grievance Text'}</span>
                </button>
              </div>

              {/* External GPS verification link */}
              <div className="text-center pt-2">
                <a
                  href={`https://www.google.com/maps?q=${dump.location.lat},${dump.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> View Geo-Tagged Location on Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            /* Submission Form */
            <div className="space-y-4">
              {/* Evidence Snapshot Strip */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <img
                  src={dump.imageUrl}
                  alt={dump.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
                />
                <div className="flex-1 min-w-0 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 truncate">{dump.title}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                      {dump.severity}
                    </span>
                  </div>
                  <p className="text-slate-500 truncate mt-0.5">{dump.location.address}</p>
                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-3">
                    <span>Est. Weight: <b className="font-mono">{dump.estimatedWeightKg} kg</b></span>
                    <span>Hazard: <b className="font-mono text-red-600">{dump.hazardScore}/10</b></span>
                  </div>
                </div>
              </div>

              {/* Target Government Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Recipient Government Authority
                </label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Municipal Solid Waste Management & Public Health Wing">
                    Municipal Solid Waste Management & Public Health Wing
                  </option>
                  <option value="Emergency Rapid Sanitation & Environmental Protection Board">
                    Emergency Rapid Sanitation & Environmental Protection Board
                  </option>
                  <option value="Department of Public Works - Road Clearance Division">
                    Department of Public Works - Road Clearance Division
                  </option>
                  <option value="City Drainage & Stormwater Anti-Clogging Cell">
                    City Drainage & Stormwater Anti-Clogging Cell
                  </option>
                </select>
              </div>

              {/* Additional Notes for Municipal Sweepers */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Additional Notes / Specific Street Landmark
                </label>
                <textarea
                  rows={2}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Near the alley entrance next to green electrical transformer box, blocks morning school bus lane..."
                  className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Urgency Checkbox */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-amber-900 block">
                    Flag as High-Priority Municipal Hazard
                  </span>
                  <span className="text-amber-700 text-[11px]">
                    Requests fast-tracked sweeper crew dispatch within 8-12 hours under City Cleanliness Bylaws.
                  </span>
                </div>
              </label>

              {/* Equipment Requirements Preview */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Truck className="w-3.5 h-3.5 text-slate-600" /> Recommended Municipal Machinery:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {dump.recommendedEquipment.map((eq, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] text-slate-600 font-medium">
                      {eq}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            {dossierResult ? 'Close Window' : 'Cancel'}
          </button>

          {!dossierResult && (
            <button
              onClick={handleSendToGovernment}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Transmitting to Municipal Server...' : 'Dispatch Grievance to Government'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
