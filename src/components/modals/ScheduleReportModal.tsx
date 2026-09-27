import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const ScheduleReportModal: React.FC = () => {
  const { isScheduleReportOpen, setIsScheduleReportOpen, addNotification } = useTelephony();
  const [reportTitle, setReportTitle] = useState('Executive SLA & Telemetry Summary');
  const [cadence, setCadence] = useState('Weekly (Every Monday 08:00 EST)');
  const [recipientEmail, setRecipientEmail] = useState('darshitsinh@gmail.com');
  const [format, setFormat] = useState('PDF + CSV Raw Dump');
  const [includeAudioTranscripts, setIncludeAudioTranscripts] = useState(true);

  if (!isScheduleReportOpen) return null;

  const handleSaveSchedule = () => {
    addNotification(
      'Automated Report Scheduled',
      `"${reportTitle}" configured to dispatch ${cadence} to ${recipientEmail}.`,
      'success'
    );
    setIsScheduleReportOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">schedule_send</span>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Schedule Automated Reporting
              </h3>
              <span className="text-xs text-outline font-mono-code">
                Dispatch engine: Cron Scheduler • Encrypted Delivery
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsScheduleReportOpen(false)}
            className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Report Title</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Cadence / Frequency</label>
            <select
              value={cadence}
              onChange={(e) => setCadence(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option>Daily Shift Audit (18:00 EST)</option>
              <option>Weekly (Every Monday 08:00 EST)</option>
              <option>Bi-Weekly Operational Review</option>
              <option>Monthly Executive SLA Board Deck</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Recipient Email / Channel</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option>PDF + CSV Raw Dump</option>
              <option>PDF Executive Presentation Only</option>
              <option>CSV Telemetry Data Only</option>
            </select>
          </div>

          <div className="pt-2 border-t border-outline-variant flex items-center justify-between">
            <span className="text-xs text-on-surface">Include Audio Recording Links & AI Summaries</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={includeAudioTranscripts}
                onChange={(e) => setIncludeAudioTranscripts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
          <button
            onClick={() => setIsScheduleReportOpen(false)}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSchedule}
            className="px-4 py-2 rounded bg-primary hover:bg-primary-container text-on-primary font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">alarm_on</span>
            <span>Activate Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
