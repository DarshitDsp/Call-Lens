import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const SupervisorMonitorModal: React.FC = () => {
  const { supervisorAction, setSupervisorAction, addNotification } = useTelephony();
  const [activeMode, setActiveMode] = useState<'listen' | 'whisper' | 'barge'>(
    supervisorAction?.type || 'listen'
  );
  const [micMuted, setMicMuted] = useState(false);

  if (!supervisorAction) return null;

  const { agent } = supervisorAction;

  const handleModeChange = (mode: 'listen' | 'whisper' | 'barge') => {
    setActiveMode(mode);
    if (mode === 'listen') {
      addNotification('Audio Mode: Listen (Silent)', `Listening to ${agent.name} without participant awareness.`, 'info');
    } else if (mode === 'whisper') {
      addNotification('Audio Mode: Whisper (Coach)', `Voice injected to ${agent.name} only (caller cannot hear).`, 'warning');
    } else {
      addNotification('Audio Mode: Barge (3-Way)', `Joined 3-way conference with ${agent.name} and customer.`, 'error');
    }
  };

  const handleClose = () => {
    addNotification('Monitoring Terminated', `Audio bridge to ${agent.name} closed.`, 'info');
    setSupervisorAction(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-secondary/15 text-secondary flex items-center justify-center border border-secondary/30">
              <span className="material-symbols-outlined text-lg">headphones</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Supervisor Audio Channel Intercept
              </h3>
              <span className="font-mono-code text-xs text-outline">
                Node ID: US-EAST-SIP-TAP-04
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Monitored Agent Card */}
        <div className="p-3 bg-surface-container rounded border border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded overflow-hidden border border-outline-variant">
              <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary border-2 border-surface-container"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  {agent.name}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code bg-tertiary/15 text-tertiary border border-tertiary/30">
                  {agent.status.toUpperCase()}
                </span>
              </div>
              <div className="text-xs text-outline mt-0.5 flex items-center gap-1.5">
                <span>Caller: {agent.callerName || 'Marcus Sterling'}</span>
                <span>•</span>
                <span className="text-secondary font-mono-code">{agent.campaign}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono-code text-outline uppercase block">Call Duration</span>
            <span className="font-mono-code text-base font-bold text-tertiary">04:12</span>
          </div>
        </div>

        {/* Real-time Audio Visualizer Simulation */}
        <div className="bg-surface-container-lowest p-3 rounded border border-outline-variant/60 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono-code">
            <span className="text-outline">WebRTC Opus Duplex Audio Stream</span>
            <span className="text-tertiary flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              Jitter: 1.1ms • MOS 4.45
            </span>
          </div>
          <div className="h-10 flex items-end justify-between gap-1 px-1 bg-surface-container/50 rounded">
            {[4, 8, 14, 22, 18, 30, 26, 12, 19, 28, 32, 24, 16, 9, 21, 27, 31, 15, 8, 12, 25, 18, 10].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h}px` }}
                className={`w-1 rounded-sm transition-all duration-75 ${
                  activeMode === 'barge'
                    ? 'bg-error'
                    : activeMode === 'whisper'
                    ? 'bg-secondary'
                    : 'bg-tertiary'
                }`}
              ></span>
            ))}
          </div>
        </div>

        {/* Intercept Mode Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-label-sm uppercase tracking-wider text-outline">
            Select Intercept Routing Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleModeChange('listen')}
              className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-all ${
                activeMode === 'listen'
                  ? 'bg-surface-container-high border-secondary text-secondary'
                  : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">headphones</span>
                <span className="font-headline-sm text-xs font-bold">1. Listen</span>
              </div>
              <span className="text-[10px] text-outline leading-tight">
                Silent monitor. Neither party hears supervisor.
              </span>
            </button>

            <button
              onClick={() => handleModeChange('whisper')}
              className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-all ${
                activeMode === 'whisper'
                  ? 'bg-surface-container-high border-secondary text-secondary'
                  : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">record_voice_over</span>
                <span className="font-headline-sm text-xs font-bold">2. Whisper</span>
              </div>
              <span className="text-[10px] text-outline leading-tight">
                Injected to agent only. Coach during negotiation.
              </span>
            </button>

            <button
              onClick={() => handleModeChange('barge')}
              className={`p-2.5 rounded border text-left flex flex-col gap-1 transition-all ${
                activeMode === 'barge'
                  ? 'bg-error-container/40 border-error text-error'
                  : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base">call_merge</span>
                <span className="font-headline-sm text-xs font-bold">3. Barge</span>
              </div>
              <span className="text-[10px] text-outline leading-tight">
                Full 3-way bridge. Take over critical escalation.
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
          <button
            onClick={() => setMicMuted((prev) => !prev)}
            className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              micMuted
                ? 'bg-error-container text-error border-error/40'
                : 'bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {micMuted ? 'mic_off' : 'mic'}
            </span>
            <span>{micMuted ? 'Supervisor Muted' : 'Supervisor Mic Live'}</span>
          </button>

          <button
            onClick={handleClose}
            className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold rounded transition-colors"
          >
            Disconnect Audio Tap
          </button>
        </div>
      </div>
    </div>
  );
};
