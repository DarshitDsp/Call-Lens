import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const CampaignSwitcherModal: React.FC = () => {
  const { isCampaignSwitcherOpen, setIsCampaignSwitcherOpen, campaigns, addNotification, setActiveTab } = useTelephony();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns[0]?.id || '');

  if (!isCampaignSwitcherOpen) return null;

  const handleSwitch = (id: string) => {
    setSelectedCampaignId(id);
    const chosen = campaigns.find((c) => c.id === id);
    if (chosen) {
      addNotification('Campaign Context Switched', `Switched active floor operations to ${chosen.name}.`, 'success');
      setIsCampaignSwitcherOpen(false);
      setActiveTab('operations');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">swap_horiz</span>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Global Campaign Switcher
              </h3>
              <span className="text-xs text-outline font-mono-code">
                Cluster East-01 • Active Partition: PROD-NA
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCampaignSwitcherOpen(false)}
            className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {campaigns.map((cam) => {
            const isSelected = selectedCampaignId === cam.id;
            return (
              <div
                key={cam.id}
                onClick={() => handleSwitch(cam.id)}
                className={`p-3 rounded border cursor-pointer flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-surface-container-high border-secondary text-secondary'
                    : 'bg-surface-container border-outline-variant hover:bg-surface-container-high text-on-surface'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-sm font-bold">{cam.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code bg-surface-container-lowest text-outline border border-outline-variant">
                      {cam.type}
                    </span>
                  </div>
                  <div className="text-xs text-outline mt-1 flex items-center gap-3 font-mono-code">
                    <span>Agents: {cam.agentsLogged}</span>
                    <span>SLA: {cam.serviceLevel}</span>
                    <span>Status: {cam.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      cam.status.includes('STABLE') || cam.status.includes('OPTIMAL')
                        ? 'bg-tertiary'
                        : 'bg-secondary'
                    }`}
                  ></span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant text-xs text-outline">
          <span>Active Nodes: 6 Pods Monitored</span>
          <button
            onClick={() => setIsCampaignSwitcherOpen(false)}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
