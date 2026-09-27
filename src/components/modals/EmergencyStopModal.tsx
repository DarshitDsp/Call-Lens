import React from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const EmergencyStopModal: React.FC = () => {
  const { isEmergencyStopOpen, setIsEmergencyStopOpen, toggleDialerRunState, dialerRunState, addNotification } = useTelephony();

  if (!isEmergencyStopOpen) return null;

  const handleConfirmEmergencyStop = () => {
    if (dialerRunState === 'RUNNING') {
      toggleDialerRunState();
    }
    addNotification(
      'EMERGENCY STOP EXECUTED',
      'All predictive dialers halted, outbound trunks throttled, and active queues parked in compliance hold.',
      'error'
    );
    setIsEmergencyStopOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-low border-2 border-error rounded shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-error-container text-error border border-error/50 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl font-bold">warning</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-base font-bold text-error">
              Emergency Stop Confirmation
            </h3>
            <span className="font-mono-code text-xs text-outline">
              FCC Safe Telephony Kill-Switch
            </span>
          </div>
        </div>

        <div className="p-3 bg-surface-container-lowest rounded border border-error/30 text-xs text-on-surface space-y-2">
          <p className="leading-relaxed">
            Executing an <strong>Emergency Stop</strong> will:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-on-surface-variant font-mono-code text-[11px]">
            <li>Instantly halt all automated predictive dialer lines</li>
            <li>Stop dispatching new leads to active agent pools</li>
            <li>Flush and park non-connected calls gracefully</li>
            <li>Log an irreversible security audit event in cluster telemetry</li>
          </ul>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant">
          <button
            onClick={() => setIsEmergencyStopOpen(false)}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmEmergencyStop}
            className="px-4 py-2 rounded bg-error text-on-error font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-error/30 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-base">power_settings_new</span>
            <span>Halt All Telephony Queues</span>
          </button>
        </div>
      </div>
    </div>
  );
};
