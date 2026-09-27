import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const BuyNumberModal: React.FC = () => {
  const { isBuyNumberOpen, setIsBuyNumberOpen, addDid, campaigns } = useTelephony();
  const [country, setCountry] = useState('US');
  const [areaCode, setAreaCode] = useState('415');
  const [selectedType, setSelectedType] = useState<'Local' | 'Toll-Free'>('Local');
  const [assignedCampaign, setAssignedCampaign] = useState(campaigns[0]?.name || 'Tier 1 Customer Care & Support');

  if (!isBuyNumberOpen) return null;

  const mockAvailableNumbers = [
    { number: `+1 (${areaCode}) 204-8911`, cost: '$1.15/mo', capabilities: { voice: true, sms: true, mediaStream: true } },
    { number: `+1 (${areaCode}) 341-9920`, cost: '$1.15/mo', capabilities: { voice: true, sms: true, mediaStream: true } },
    { number: `+1 (${areaCode}) 552-0199`, cost: '$1.15/mo', capabilities: { voice: true, sms: false, mediaStream: true } },
    { number: `+1 (${areaCode}) 892-4412`, cost: '$1.15/mo', capabilities: { voice: true, sms: true, mediaStream: true } },
  ];

  const handlePurchase = (num: typeof mockAvailableNumbers[0]) => {
    addDid({
      number: num.number,
      type: selectedType === 'Toll-Free' ? 'Toll-Free' : 'Local (SF)',
      assignedCampaign,
      friendlyName: `${selectedType} Inbound Carrier Pool`,
      capabilities: num.capabilities,
      reputation: 'Clean (100% verified)',
      status: 'Active',
    });
    setIsBuyNumberOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-surface-container-low border border-outline-variant rounded shadow-2xl p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">add_call</span>
            <div>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                Provision Twilio Phone Number (DID)
              </h3>
              <span className="text-xs text-outline font-mono-code">
                Carrier: Twilio Elastic SIP • Real-time Inventory
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsBuyNumberOpen(false)}
            className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1.5 text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option value="US">United States (+1)</option>
              <option value="UK">United Kingdom (+44)</option>
              <option value="CA">Canada (+1)</option>
              <option value="DE">Germany (+49)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as 'Local' | 'Toll-Free')}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1.5 text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option value="Local">Local Geographic</option>
              <option value="Toll-Free">Toll-Free (800/888)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">Area Code / NPA</label>
            <input
              type="text"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1.5 text-xs font-mono-code text-on-surface focus:outline-none focus:border-secondary"
              placeholder="e.g. 415"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">
            Assign Immediately To Campaign
          </label>
          <select
            value={assignedCampaign}
            onChange={(e) => setAssignedCampaign(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-xs text-on-surface focus:outline-none focus:border-secondary"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>

        {/* Results List */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-on-surface">Available Phone Numbers</label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {mockAvailableNumbers.map((num, i) => (
              <div
                key={i}
                className="p-2.5 rounded bg-surface-container border border-outline-variant/60 flex items-center justify-between hover:border-secondary transition-colors"
              >
                <div>
                  <div className="font-mono-code text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">call</span>
                    {num.number}
                  </div>
                  <div className="text-[11px] text-outline flex items-center gap-2 mt-0.5 font-mono-code">
                    <span>Voice</span>
                    <span>•</span>
                    <span>SMS</span>
                    <span>•</span>
                    <span className="text-secondary">MediaStream</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono-code text-tertiary font-bold">{num.cost}</span>
                  <button
                    onClick={() => handlePurchase(num)}
                    className="px-2.5 py-1 bg-secondary hover:bg-secondary-container text-on-secondary font-bold text-xs rounded transition-colors"
                  >
                    Buy & Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant text-xs text-outline">
          <span>Billed directly to Twilio Account SID</span>
          <button
            onClick={() => setIsBuyNumberOpen(false)}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
