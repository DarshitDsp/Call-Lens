import React, { useState } from 'react';
import { useTelephony } from '../context/TelephonyContext';
import { NavigationTab } from '../types/telephony';

export const SideNavBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    dialerRunState,
    toggleDialerRunState,
    userRole,
    setIsKeypadOpen,
  } = useTelephony();

  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const navItems: { tab: NavigationTab; label: string; icon: string; minRole?: string }[] = [
    { tab: 'operations', label: 'Live Operations', icon: 'dashboard' },
    { tab: 'campaigns', label: 'Campaigns & Queues', icon: 'campaign' },
    { tab: 'agent_telephony', label: 'Agent Telephony', icon: 'support_agent' },
    { tab: 'voice_ai', label: 'Voice AI & Bot Ops', icon: 'smart_toy' },
    { tab: 'ai_models', label: 'AI Models & Routing', icon: 'alt_route' },
    { tab: 'auditing', label: 'Auditing & Logs', icon: 'shield' },
    { tab: 'analytics', label: 'Analytics & SLA', icon: 'analytics' },
    { tab: 'trunk_routing', label: 'Trunk Routing (Twilio)', icon: 'cable' },
  ];

  return (
    <aside className="w-64 h-full flex flex-col justify-between p-3 border-r border-outline-variant bg-surface-container-lowest shrink-0 select-none z-30">
      <div className="flex flex-col gap-4">
        {/* Node Badge */}
        <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-surface-container-high border border-secondary/50 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-[18px]">dns</span>
          </div>
          <div className="overflow-hidden">
            <div className="text-headline-sm font-headline-sm font-bold text-on-surface truncate leading-tight">
              Telephony Hub
            </div>
            <div className="text-label-sm font-label-sm text-outline flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary status-pulse"></span>
              <span className="truncate font-mono-code text-[11px]">Cluster East-01 Active</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`flex items-center gap-3 px-3 py-2 rounded text-left font-label-md text-label-md transition-all duration-150 ${
                  isActive
                    ? 'text-secondary bg-surface-container-high border-l-2 border-secondary font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${isActive ? 'text-secondary' : 'text-outline'}`}
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Dialer Run State CTA Button */}
        <div className="px-1 pt-1">
          <button
            onClick={toggleDialerRunState}
            className={`w-full py-2 px-3 rounded border text-on-surface text-label-md font-label-md flex items-center justify-between transition-colors ${
              dialerRunState === 'RUNNING'
                ? 'bg-surface-container-high border-outline-variant hover:border-secondary'
                : 'bg-error-container/20 border-error/40 hover:border-error'
            }`}
          >
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  dialerRunState === 'RUNNING' ? 'bg-tertiary status-pulse' : 'bg-error'
                }`}
              ></span>
              <span className="text-xs">Dialer Run State</span>
            </span>
            <span
              className={`text-[10px] font-mono-code font-bold px-1.5 py-0.5 rounded ${
                dialerRunState === 'RUNNING'
                  ? 'bg-tertiary-container/30 text-tertiary border border-tertiary/40'
                  : 'bg-error-container/40 text-error border border-error/50'
              }`}
            >
              {dialerRunState === 'RUNNING' ? 'ACTIVE (1.4x)' : 'PAUSED'}
            </span>
          </button>
        </div>

        {/* Quick Softphone Keypad Launcher */}
        <div className="px-1">
          <button
            onClick={() => setIsKeypadOpen(true)}
            className="w-full py-1.5 px-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface-variant hover:text-secondary text-xs flex items-center justify-center gap-1.5 transition-colors font-mono-code"
          >
            <span className="material-symbols-outlined text-sm">dialpad</span>
            <span>Open Softphone Dialpad</span>
          </button>
        </div>
      </div>

      {/* Footer Subnav */}
      <div className="flex flex-col gap-1 border-t border-outline-variant pt-3">
        <button
          onClick={() => setShowDiagnostics(true)}
          className="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
          <span>Engine Diagnostics</span>
        </button>
        <button
          onClick={() => setShowDocs(true)}
          className="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">help</span>
          <span>Documentation</span>
        </button>
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant hover:text-on-surface rounded font-label-md text-label-md hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">settings</span>
          <span>Settings</span>
        </button>

        {/* SIP Engine Badge */}
        <div className="px-3 py-2 mt-1 bg-surface-container rounded border border-outline-variant flex items-center justify-between text-outline text-[11px] font-mono-code">
          <span>SIP: v4.19.8-prod</span>
          <span className="w-2 h-2 rounded-full bg-tertiary"></span>
        </div>
      </div>

      {/* Diagnostics Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-sm text-on-surface">Telephony Cluster Diagnostics</span>
              <button onClick={() => setShowDiagnostics(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-2 text-xs font-mono-code">
              <div className="p-2 rounded bg-surface-container flex justify-between">
                <span className="text-outline">Twilio Edge Connection:</span>
                <span className="text-tertiary">Active (18.4ms RTT)</span>
              </div>
              <div className="p-2 rounded bg-surface-container flex justify-between">
                <span className="text-outline">WebRTC Opus Audio Buffer:</span>
                <span className="text-secondary">1.2ms (Stable)</span>
              </div>
              <div className="p-2 rounded bg-surface-container flex justify-between">
                <span className="text-outline">Active User Role:</span>
                <span className="text-on-surface font-bold uppercase">{userRole}</span>
              </div>
              <div className="p-2 rounded bg-surface-container flex justify-between">
                <span className="text-outline">Carrier Trunk Load:</span>
                <span className="text-tertiary">142/500 Channels (28.4%)</span>
              </div>
            </div>
            <button
              onClick={() => setShowDiagnostics(false)}
              className="py-1.5 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant text-xs text-on-surface"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-sm text-on-surface">AetherDial Operations User Manual</span>
              <button onClick={() => setShowDocs(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="text-xs text-on-surface-variant space-y-2 max-h-72 overflow-y-auto">
              <p><strong>1. Inbound & Outbound Calling:</strong> Use the Softphone Console to make manual calls via Dialpad, or trigger automated campaign dialing from the Contacts list.</p>
              <p><strong>2. Contact Uploads:</strong> In "Campaigns & Queues", drag and drop any CSV or select sample enterprise leads to populate outbound dialer pools.</p>
              <p><strong>3. Recording Storage:</strong> All completed calls with recording toggled on are stored in "Auditing & Logs" with playable waveforms, sentiment score, and full transcript.</p>
              <p><strong>4. Role-Based Access:</strong> Switch roles in the top-right header to test supervisor floor monitoring (Listen/Whisper/Barge), agent softphone view, or admin Twilio settings.</p>
            </div>
            <button
              onClick={() => setShowDocs(false)}
              className="py-1.5 bg-secondary hover:bg-secondary-container text-on-secondary rounded font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-bold text-sm text-on-surface">Operations Workspace Preferences</span>
              <button onClick={() => setShowSettings(false)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span>STIR/SHAKEN A-Attestation Verification</span>
                <span className="text-tertiary font-mono-code font-bold">ENFORCED</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auto-record outbound calls</span>
                <span className="text-secondary font-mono-code font-bold">ENABLED</span>
              </div>
              <div className="flex items-center justify-between">
                <span>PCI-DSS Cardholder DTMF Redaction</span>
                <span className="text-tertiary font-mono-code font-bold">ACTIVE</span>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="py-1.5 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant text-xs text-on-surface mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
