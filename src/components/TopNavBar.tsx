import React, { useState } from 'react';
import { useTelephony } from '../context/TelephonyContext';
import { NavigationTab, UserRole } from '../types/telephony';

export const TopNavBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    userRole,
    setUserRole,
    isDarkMode,
    toggleDarkMode,
    setIsEmergencyStopOpen,
    setIsCampaignSwitcherOpen,
    setIsScheduleReportOpen,
    triggerSimulatedInbound,
    notifications,
    clearNotification,
  } = useTelephony();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'supervisor', label: 'Supervisor / Director', desc: 'Floor monitoring, listen/whisper/barge, emergency stop' },
    { role: 'agent', label: 'Telephony Agent', desc: 'Softphone, contact dialer, script, disposition' },
    { role: 'admin', label: 'Telephony Admin', desc: 'Twilio SIP credentials, numbers, CRM integrations' },
    { role: 'compliance', label: 'Compliance Officer', desc: 'Auditing, call recordings, DNC list compliance' },
  ];

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
  };

  return (
    <header className="w-full h-14 px-4 flex items-center justify-between border-b border-outline-variant bg-surface-container-low shrink-0 z-40 select-none">
      <div className="flex items-center gap-6">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('operations')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <span className="material-symbols-outlined text-secondary text-2xl group-hover:scale-105 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>
            terminal
          </span>
          <span className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight">
            AetherDial Operations
          </span>
        </div>

        {/* Search Bar on Left */}
        <div className="relative w-64 hidden xl:block">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaign, agent, SIP URI..."
            className="w-full h-8 pl-8 pr-3 bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-outline text-label-md font-label-md rounded focus:outline-none focus:border-secondary transition-colors"
          />
        </div>

        {/* Top Nav Cluster */}
        <nav className="hidden lg:flex items-center gap-5 h-14">
          <button
            onClick={() => handleNavClick('operations')}
            className={`font-label-md text-label-md py-4 transition-colors flex items-center gap-1 ${
              activeTab === 'operations'
                ? 'text-secondary border-b-2 border-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => handleNavClick('campaigns')}
            className={`font-label-md text-label-md py-4 transition-colors flex items-center gap-1 ${
              activeTab === 'campaigns'
                ? 'text-secondary border-b-2 border-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Campaigns & Contacts
          </button>
          <button
            onClick={() => handleNavClick('voice_ai')}
            className={`font-label-md text-label-md py-4 transition-colors flex items-center gap-1.5 ${
              activeTab === 'voice_ai'
                ? 'text-secondary border-b-2 border-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>Voice AI Bots</span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
          </button>
          <button
            onClick={() => handleNavClick('trunk_routing')}
            className={`font-label-md text-label-md py-4 transition-colors flex items-center gap-1 ${
              activeTab === 'trunk_routing'
                ? 'text-secondary border-b-2 border-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Trunk Health & Twilio
          </button>
          <button
            onClick={() => handleNavClick('analytics')}
            className={`font-label-md text-label-md py-4 transition-colors flex items-center gap-1 ${
              activeTab === 'analytics'
                ? 'text-secondary border-b-2 border-secondary font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Analytics & SLA
          </button>
        </nav>
      </div>

      {/* Trailing Controls & Tools */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Inbound Call Simulation Button */}
        <button
          onClick={triggerSimulatedInbound}
          title="Simulate incoming PSTN call on Twilio trunk"
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-label-sm font-label-sm rounded bg-surface-container border border-outline-variant hover:border-tertiary text-tertiary hover:bg-surface-container-high transition-colors"
        >
          <span className="material-symbols-outlined text-sm">ring_volume</span>
          <span className="hidden md:inline font-mono-code">Test Inbound Call</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleDarkMode}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDarkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Diagnostics & Notification Icons */}
        <div className="flex items-center gap-1 border-x border-outline-variant px-2">
          <button
            onClick={() => handleNavClick('voice_ai')}
            className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            title="Voice Channel Spectrum"
          >
            <span className="material-symbols-outlined text-[18px]">graphic_eq</span>
          </button>
          <button
            onClick={() => setIsScheduleReportOpen(true)}
            className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            title="Scheduled SLA Clocks & Reports"
          >
            <span className="material-symbols-outlined text-[18px]">timer</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors relative"
              title="Alert Notifications"
            >
              <span className="material-symbols-outlined text-[18px]">notifications</span>
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-secondary"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-10 w-80 bg-surface-container-low border border-outline-variant rounded shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between border-b border-outline-variant pb-2 mb-2">
                  <span className="font-headline-sm text-xs font-bold text-on-surface">
                    Operational Telemetry Alerts
                  </span>
                  <span className="text-[10px] font-mono-code text-outline">
                    {notifications.length} unread
                  </span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2 rounded bg-surface-container text-xs flex flex-col gap-0.5 border border-outline-variant/40"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-on-surface text-[11px]">{n.title}</span>
                        <button
                          onClick={() => clearNotification(n.id)}
                          className="text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                      <p className="text-on-surface-variant text-[11px]">{n.message}</p>
                      <span className="text-[9px] font-mono-code text-outline mt-0.5">{n.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Switcher */}
        <button
          onClick={() => setIsCampaignSwitcherOpen(true)}
          className="h-8 px-2.5 rounded bg-surface-container text-on-surface border border-outline-variant hover:bg-surface-container-high text-label-sm font-label-md flex items-center gap-1.5 transition-colors"
        >
          <span className="material-symbols-outlined text-[16px] text-secondary">swap_calls</span>
          <span className="hidden sm:inline">Campaign Switcher</span>
        </button>

        {/* Emergency Stop Button */}
        <button
          onClick={() => setIsEmergencyStopOpen(true)}
          className="h-8 px-3 rounded bg-error-container text-on-error-container border border-error hover:bg-opacity-80 text-label-sm font-label-md flex items-center gap-1.5 transition-colors active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[16px] text-error font-bold">stop_circle</span>
          <span className="font-semibold">Emergency Stop</span>
        </button>

        {/* Role Switcher & Supervisor Profile */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 pl-1 group"
            title="Switch User Role & Access Profile"
          >
            <div className="w-8 h-8 rounded border border-outline-variant overflow-hidden bg-surface-container flex items-center justify-center font-mono-code font-bold text-secondary text-xs group-hover:border-secondary transition-colors">
              {userRole === 'supervisor' ? 'SU' : userRole === 'agent' ? 'AG' : userRole === 'admin' ? 'AD' : 'CP'}
            </div>
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 top-11 w-64 bg-surface-container-low border border-outline-variant rounded shadow-2xl p-2 z-50 animate-in fade-in duration-100">
              <div className="px-2 py-1.5 border-b border-outline-variant mb-1">
                <span className="text-[10px] font-mono-code text-outline uppercase tracking-wider block">
                  Role-Based Access Control (RBAC)
                </span>
                <span className="text-xs font-bold text-on-surface">Active Identity</span>
              </div>
              <div className="space-y-1">
                {roles.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      setUserRole(r.role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded text-xs flex flex-col gap-0.5 transition-colors ${
                      userRole === r.role
                        ? 'bg-surface-container-high border-l-2 border-secondary text-secondary font-bold'
                        : 'hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] text-outline font-normal">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
