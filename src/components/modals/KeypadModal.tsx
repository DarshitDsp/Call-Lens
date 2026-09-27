import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { audioEngine } from '../../utils/audioEngine';

export const KeypadModal: React.FC = () => {
  const { isKeypadOpen, setIsKeypadOpen, activeCall, startCall } = useTelephony();
  const [dialedNumber, setDialedNumber] = useState<string>('');

  if (!isKeypadOpen) return null;

  const keys = [
    { digit: '1', sub: '' },
    { digit: '2', sub: 'ABC' },
    { digit: '3', sub: 'DEF' },
    { digit: '4', sub: 'GHI' },
    { digit: '5', sub: 'JKL' },
    { digit: '6', sub: 'MNO' },
    { digit: '7', sub: 'PQRS' },
    { digit: '8', sub: 'TUV' },
    { digit: '9', sub: 'WXYZ' },
    { digit: '*', sub: '' },
    { digit: '0', sub: '+' },
    { digit: '#', sub: '' },
  ];

  const handleKeyPress = (digit: string) => {
    audioEngine.playDtmf(digit);
    setDialedNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!dialedNumber) return;
    startCall({
      name: `Direct Dial (${dialedNumber})`,
      phone: dialedNumber,
      company: 'Ad-hoc Outbound',
      campaign: 'Direct Manual Outbound',
      arr: '$50,000',
    });
    setIsKeypadOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-80 bg-surface-container-low border border-outline-variant rounded shadow-2xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">dialpad</span>
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              {activeCall ? 'DTMF In-Call Touch Tones' : 'Manual Dialpad'}
            </span>
          </div>
          <button
            onClick={() => setIsKeypadOpen(false)}
            className="p-1 text-outline hover:text-on-surface rounded hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Display */}
        <div className="p-3 bg-surface-container-lowest rounded border border-outline-variant flex items-center justify-between">
          <input
            type="text"
            value={dialedNumber}
            onChange={(e) => setDialedNumber(e.target.value)}
            placeholder={activeCall ? 'Press digits for IVR...' : 'Enter phone number...'}
            className="bg-transparent font-mono-code text-lg text-on-surface w-full focus:outline-none tracking-wider"
          />
          {dialedNumber && (
            <button
              onClick={handleBackspace}
              className="text-outline hover:text-error p-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">backspace</span>
            </button>
          )}
        </div>

        {/* Dialpad Grid */}
        <div className="grid grid-cols-3 gap-2">
          {keys.map(({ digit, sub }) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="h-13 bg-surface-container hover:bg-surface-container-high active:bg-secondary/20 active:border-secondary border border-outline-variant/60 rounded flex flex-col items-center justify-center transition-all select-none group"
            >
              <span className="font-mono-code text-lg font-bold text-on-surface group-hover:text-secondary leading-none">
                {digit}
              </span>
              {sub && (
                <span className="text-[9px] font-mono-code text-outline uppercase tracking-wider mt-0.5">
                  {sub}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-outline-variant">
          {!activeCall ? (
            <button
              onClick={handleCall}
              disabled={!dialedNumber}
              className="flex-1 py-2 bg-tertiary hover:bg-tertiary/90 disabled:opacity-40 text-on-tertiary font-bold text-sm rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">call</span>
              <span>Place Call</span>
            </button>
          ) : (
            <button
              onClick={() => setIsKeypadOpen(false)}
              className="flex-1 py-2 bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-xs rounded border border-outline-variant transition-colors"
            >
              Done (Tone Sent)
            </button>
          )}
          <button
            onClick={() => setDialedNumber('')}
            className="px-3 py-2 bg-surface-container hover:bg-surface-container-high text-outline text-xs rounded border border-outline-variant"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};
