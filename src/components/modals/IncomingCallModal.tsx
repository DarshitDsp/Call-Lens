import React from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useTelephony();

  if (!incomingCall) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-bounce sm:animate-none animate-in slide-in-from-top duration-300">
      <div className="w-96 bg-surface-container-low border-2 border-secondary rounded shadow-2xl p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded bg-secondary/20 border border-secondary flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl animate-pulse">ring_volume</span>
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-tertiary animate-ping"></span>
            </div>
            <div>
              <span className="text-[11px] font-mono-code text-secondary font-bold uppercase tracking-wider block">
                INCOMING CALL • TWILIO TRUNK
              </span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface leading-tight">
                {incomingCall.contactName}
              </h3>
              <span className="font-mono-code text-xs text-on-surface-variant block">
                {incomingCall.contactNumber}
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-tertiary/15 text-tertiary border border-tertiary/30">
            VIP ROUTE
          </span>
        </div>

        <div className="p-2 bg-surface-container-lowest rounded border border-outline-variant/60 text-xs font-mono-code flex items-center justify-between text-outline">
          <span>{incomingCall.company}</span>
          <span className="text-secondary">{incomingCall.campaign}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={acceptIncomingCall}
            className="py-2.5 px-3 bg-tertiary hover:bg-tertiary/90 text-on-tertiary font-bold text-xs rounded flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">call</span>
            <span>Accept Call</span>
          </button>
          <button
            onClick={rejectIncomingCall}
            className="py-2.5 px-3 bg-error-container hover:bg-error-container/80 text-error border border-error/40 font-semibold text-xs rounded flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">call_end</span>
            <span>Send to IVR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
