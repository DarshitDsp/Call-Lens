import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { DispositionType } from '../../types/telephony';
import { audioEngine } from '../../utils/audioEngine';

export const AgentTelephonyView: React.FC = () => {
  const {
    activeCall,
    agentState,
    setAgentState,
    agentStateTime,
    toggleMute,
    toggleHold,
    toggleRecording,
    setCallDisposition,
    updateCallNotes,
    submitDispositionAndNext,
    endCall,
    setIsKeypadOpen,
    contacts,
    startCall,
    addNotification,
    isGeneratingSummary,
    generateActiveCallSummary,
    callLogs,
  } = useTelephony();

  const [scriptBranch, setScriptBranch] = useState<'budget' | 'approval' | 'ready'>('ready');
  const [followUpDate, setFollowUpDate] = useState('2026-09-29');
  const [followUpTime, setFollowUpTime] = useState('02:00 PM PST');
  const [sendInvite, setSendInvite] = useState(true);
  const [transferModal, setTransferModal] = useState(false);
  const [confModal, setConfModal] = useState(false);
  const [copiedTakeaways, setCopiedTakeaways] = useState(false);

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSummarize = async () => {
    const result = await generateActiveCallSummary();
    if (result) {
      const formatted = `Summary: ${result.summary}\n\nKey Takeaways:\n${result.keyTakeaways.map((t: string) => `• ${t}`).join('\n')}\n\nAction Items:\n${result.actionItems.map((a: string) => `→ ${a}`).join('\n')}`;
      updateCallNotes(formatted);
    }
  };

  const handleCopyTakeaways = (takeaways: string[]) => {
    const text = takeaways.map((t) => `• ${t}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedTakeaways(true);
    setTimeout(() => setCopiedTakeaways(false), 2000);
    addNotification('Takeaways Copied', 'Bulleted takeaways copied to clipboard.', 'success');
  };

  const latestCallLog = callLogs[0];

  const handleSubmit = () => {
    submitDispositionAndNext({
      date: followUpDate,
      time: followUpTime,
      syncOutlook: sendInvite,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-surface">
      {/* 3. TOP AGENT TELEPHONY SOFTPHONE RIBBON */}
      <div className="w-full bg-surface-container border-b border-outline-variant px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm z-30">
        {/* Sub-section A: Agent State Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                agentState === 'ready'
                  ? 'bg-tertiary status-pulse'
                  : agentState === 'talking'
                  ? 'bg-secondary'
                  : 'bg-surface-variant'
              }`}
            ></span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <select
                  value={agentState}
                  onChange={(e) => setAgentState(e.target.value as any)}
                  className="bg-transparent border-0 text-on-surface font-label-md text-label-md p-0 pr-6 focus:ring-0 cursor-pointer font-semibold"
                >
                  <option className="bg-surface-container-high text-on-surface" value="ready">
                    Ready / Accepting Calls
                  </option>
                  <option className="bg-surface-container-high text-on-surface" value="talking">
                    Talking (In-Call)
                  </option>
                  <option className="bg-surface-container-high text-on-surface" value="wrapup">
                    Wrap-up Active
                  </option>
                  <option className="bg-surface-container-high text-on-surface" value="break">
                    Break (15 Min)
                  </option>
                  <option className="bg-surface-container-high text-on-surface" value="training">
                    Training / Coaching
                  </option>
                </select>
              </div>
              <div className="flex items-center gap-1 text-outline">
                <span className="material-symbols-outlined text-xs">schedule</span>
                <span className="font-mono-code text-label-sm text-tertiary">
                  {formatTimer(agentStateTime)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant ml-1">in state</span>
              </div>
            </div>
          </div>
          <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
        </div>

        {/* Sub-section B: Active Call Live Telemetry Bar */}
        {activeCall ? (
          <div className="flex items-center gap-4 bg-surface-container-lowest/80 border border-outline-variant px-3 py-1.5 rounded">
            {/* Audio Packet Pulse Graphic */}
            <div className="flex items-end gap-0.5 h-6 w-10 px-1 py-0.5 bg-surface-container rounded border border-outline-variant">
              <span className={`w-1 rounded-sm h-3 ${activeCall.isOnHold ? 'bg-amber-400' : 'bg-secondary animate-pulse'}`}></span>
              <span className={`w-1 rounded-sm h-5 ${activeCall.isOnHold ? 'bg-amber-400' : 'bg-secondary animate-pulse'}`} style={{ animationDelay: '150ms' }}></span>
              <span className={`w-1 rounded-sm h-2 ${activeCall.isOnHold ? 'bg-amber-400' : 'bg-tertiary animate-pulse'}`} style={{ animationDelay: '300ms' }}></span>
              <span className={`w-1 rounded-sm h-4 ${activeCall.isOnHold ? 'bg-amber-400' : 'bg-secondary animate-pulse'}`} style={{ animationDelay: '75ms' }}></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-sm text-on-surface font-semibold leading-tight">
                  {activeCall.contactName}
                </span>
                <span className="font-mono-code text-xs text-on-surface-variant">
                  {activeCall.contactNumber}
                </span>
                <span
                  className={`px-1.5 py-0.2 border font-label-sm text-[10px] rounded uppercase font-bold ${
                    activeCall.isOnHold
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : activeCall.status === 'ringing'
                      ? 'bg-secondary/20 text-secondary border-secondary/40'
                      : 'bg-tertiary-container/30 border-tertiary/40 text-tertiary'
                  }`}
                >
                  {activeCall.isOnHold ? 'ON HOLD' : activeCall.status === 'ringing' ? 'RINGING...' : 'LIVE IN-CALL'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
                <span className="text-secondary">{activeCall.campaign}</span>
                <span className="text-outline">•</span>
                <span className="text-outline font-mono-code">G.711u HD Audio</span>
              </div>
            </div>

            {/* Timer */}
            <div className="ml-2 pl-3 border-l border-outline-variant flex flex-col items-center">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">Duration</span>
              <span className="font-mono-code text-lg font-bold text-primary leading-none tracking-tight">
                {formatTimer(activeCall.duration)}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-surface-container-lowest/60 border border-outline-variant px-3 py-1.5 rounded">
            <span className="material-symbols-outlined text-outline text-lg">phone_paused</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-on-surface">Softphone Idle</span>
              <span className="text-[11px] text-outline">Select contact or use Keypad to dial</span>
            </div>
          </div>
        )}

        {/* Sub-section C: Softphone Action Bar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mute */}
          <button
            onClick={toggleMute}
            disabled={!activeCall}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded transition-all active:scale-95 border ${
              activeCall?.isMuted
                ? 'bg-error-container text-error border-error'
                : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-outline-variant disabled:opacity-40'
            }`}
            title="Mute Microphone"
          >
            <span className="material-symbols-outlined text-lg">
              {activeCall?.isMuted ? 'mic_off' : 'mic'}
            </span>
            <span className="font-label-sm text-[9px]">{activeCall?.isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          {/* Hold */}
          <button
            onClick={toggleHold}
            disabled={!activeCall}
            className={`flex flex-col items-center justify-center w-11 h-11 rounded transition-all active:scale-95 border ${
              activeCall?.isOnHold
                ? 'bg-amber-950/60 text-amber-300 border-amber-500 status-pulse'
                : 'bg-surface-container-high hover:bg-surface-variant text-on-surface border-outline-variant disabled:opacity-40'
            }`}
            title="Place Call on Hold"
          >
            <span className="material-symbols-outlined text-lg">
              {activeCall?.isOnHold ? 'play_arrow' : 'pause_circle'}
            </span>
            <span className="font-label-sm text-[9px]">
              {activeCall?.isOnHold ? 'Resume' : 'Hold'}
            </span>
          </button>

          {/* Keypad */}
          <button
            onClick={() => setIsKeypadOpen(true)}
            className="flex flex-col items-center justify-center w-11 h-11 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant rounded transition-all active:scale-95 group"
            title="DTMF Dialpad"
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant group-hover:text-on-surface">
              dialpad
            </span>
            <span className="font-label-sm text-[9px] text-outline">Keypad</span>
          </button>

          {/* Transfer */}
          <button
            onClick={() => setTransferModal(true)}
            disabled={!activeCall}
            className="flex flex-col items-center justify-center w-11 h-11 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant rounded transition-all active:scale-95 disabled:opacity-40"
            title="Transfer Call"
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">phone_forwarded</span>
            <span className="font-label-sm text-[9px] text-outline">Transfer</span>
          </button>

          {/* Add Conference */}
          <button
            onClick={() => setConfModal(true)}
            disabled={!activeCall}
            className="flex flex-col items-center justify-center w-11 h-11 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant rounded transition-all active:scale-95 disabled:opacity-40"
            title="Bridge Conference"
          >
            <span className="material-symbols-outlined text-lg text-on-surface-variant">group_add</span>
            <span className="font-label-sm text-[9px] text-outline">Conf</span>
          </button>

          {/* Record Toggle */}
          <button
            onClick={toggleRecording}
            disabled={!activeCall}
            className="flex flex-col items-center justify-center w-11 h-11 bg-surface-container-high hover:bg-surface-variant text-on-surface border border-outline-variant rounded transition-all active:scale-95 relative disabled:opacity-40"
            title="Toggle Call Recording"
          >
            <div className="relative flex items-center justify-center">
              <span className="material-symbols-outlined text-lg text-on-surface-variant">
                radio_button_checked
              </span>
              {activeCall?.isRecording && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-error status-pulse"></span>
              )}
            </div>
            <span className={`font-label-sm text-[9px] ${activeCall?.isRecording ? 'text-error font-bold' : 'text-outline'}`}>
              REC
            </span>
          </button>

          {/* End Call / Dial Call Button */}
          {activeCall ? (
            <button
              onClick={endCall}
              className="flex items-center gap-1.5 px-4 h-11 bg-error-container hover:bg-on-error border border-error text-on-error-container font-headline-sm text-sm rounded font-bold shadow-lg shadow-error-container/40 transition-all active:scale-95 ml-1"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                call_end
              </span>
              <span>End Call</span>
            </button>
          ) : (
            <button
              onClick={() => {
                const lead = contacts[0];
                if (lead) startCall(lead);
              }}
              className="flex items-center gap-1.5 px-4 h-11 bg-tertiary hover:bg-tertiary-fixed text-on-tertiary font-headline-sm text-sm rounded font-bold shadow-lg shadow-tertiary/30 transition-all active:scale-95 ml-1"
            >
              <span className="material-symbols-outlined text-lg">call</span>
              <span>Dial Next Lead</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. THREE-PANE HIGH EFFICIENCY WORKSPACE */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-y-auto min-h-0 bg-surface">
        {/* PANE 1: Customer CRM 360 & History (Col 3) */}
        <section className="lg:col-span-3 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Contact Card */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary font-bold font-headline-sm">
                  {activeCall ? activeCall.contactName.split(' ').map((n) => n[0]).join('') : 'JV'}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-headline-sm text-sm font-bold text-on-surface truncate">
                    {activeCall ? activeCall.contactName : 'Jonathan Vance'}
                  </span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant truncate">
                    {activeCall?.contactTitle || 'VP of Telecom Infrastructure'}
                  </span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-primary-container/30 border border-primary text-primary font-label-sm text-[10px] rounded uppercase tracking-wider font-semibold">
                VIP Enterprise
              </span>
            </div>

            <div className="text-xs text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-sm">corporate_fare</span>
              <span className="text-on-surface font-medium truncate">
                {activeCall?.company || 'Apex Global Dataworks Inc.'}
              </span>
            </div>

            {/* Account Financial & Expiry Matrix */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant">
              <div className="bg-surface-container p-2 rounded border border-outline-variant/60 flex flex-col">
                <span className="font-label-sm text-[10px] uppercase text-outline">ARR Value</span>
                <span className="font-mono-code text-base text-on-surface font-bold leading-tight">
                  {activeCall?.arrValue || '$120,000'}
                </span>
                <span className="font-label-sm text-[10px] text-tertiary mt-0.5">+18% vs PY</span>
              </div>
              <div className="bg-surface-container p-2 rounded border border-outline-variant/60 flex flex-col">
                <span className="font-label-sm text-[10px] uppercase text-outline">Contract Expiry</span>
                <span className="font-mono-code text-base text-error font-bold leading-tight">
                  {activeCall?.contractExpiryDays || 45} Days
                </span>
                <span className="font-label-sm text-[10px] text-on-surface-variant mt-0.5">Oct 31, 2026</span>
              </div>
            </div>

            {/* Quick CRM Details */}
            <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant pt-1">
              <div className="flex items-center justify-between">
                <span className="text-outline">Email:</span>
                <span className="font-mono-code text-on-surface text-[11px] truncate max-w-[150px]">
                  {activeCall?.email || 'j.vance@apexdataworks.io'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-outline">Timezone:</span>
                <span className="text-on-surface text-[11px] truncate">
                  {activeCall?.timezone || 'America/Los_Angeles (PST)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-outline">Assigned Rep:</span>
                <span className="text-secondary text-[11px] font-medium">Sarah Chen (You)</span>
              </div>
            </div>
          </div>

          {/* Real-Time Speech Sentiment */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-base">neurology</span>
                <span className="font-headline-sm text-xs font-bold text-on-surface">
                  AI Real-time Sentiment
                </span>
              </div>
              <span className="font-mono-code text-xs text-tertiary font-bold px-1.5 py-0.5 bg-tertiary-container/20 rounded border border-tertiary/40">
                POSITIVE {activeCall?.sentiment.score || 82}%
              </span>
            </div>

            {/* Sentiment Meter */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-label-sm text-xs text-outline">
                <span>Risk: Low</span>
                <span className="text-tertiary font-semibold">{activeCall?.sentiment.score || 82}% Affirmative</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-secondary via-primary-container to-tertiary rounded-full transition-all duration-300"
                  style={{ width: `${activeCall?.sentiment.score || 82}%` }}
                ></div>
              </div>
            </div>

            {/* Detected Keywords Chips */}
            <div className="flex flex-col gap-1.5 mt-1">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline">
                Keywords Detected (Live Audio)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeCall?.sentiment.keywords || ['excited', 'upgrade', 'pricing tier', 'multi-region']).map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 bg-tertiary-container/20 border border-tertiary/40 text-tertiary font-mono-code text-[11px] rounded flex items-center gap-1"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Past Touchpoints Timeline */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-2 flex-1">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">history</span>
                <span className="font-headline-sm text-xs font-bold text-on-surface">Interaction History</span>
              </div>
              <span className="font-label-sm text-[11px] text-outline">3 Records</span>
            </div>

            <div className="relative pl-4 border-l border-outline-variant flex flex-col gap-3 mt-2 text-xs">
              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface-container-low"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">Yesterday</span>
                  <span className="font-mono-code text-outline text-[10px]">15:20 PST</span>
                </div>
                <p className="text-on-surface-variant text-[11px]">Outbound email opened: "Apex Global - Q3 Enterprise License Options".</p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-tertiary ring-4 ring-surface-container-low"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">3 days ago</span>
                  <span className="text-[10px] text-tertiary bg-tertiary-container/30 px-1 rounded">CSAT 5/5</span>
                </div>
                <p className="text-on-surface-variant text-[11px]">Support Ticket #8921 resolved: "SIP Trunk latency reduced on US-West Gateway".</p>
              </div>

              <div className="relative flex flex-col gap-0.5">
                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-outline ring-4 ring-surface-container-low"></span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-on-surface">2 weeks ago</span>
                  <span className="font-mono-code text-outline text-[10px]">08:14 Call</span>
                </div>
                <p className="text-on-surface-variant text-[11px]">Inbound call (8 mins) discussing telemetry roadmap and API SLA extensions.</p>
              </div>
            </div>
          </div>
        </section>

        {/* PANE 2: Dynamic Script & Objection (Col 5) */}
        <section className="lg:col-span-5 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* Script Header & Breadcrumbs */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">description</span>
                <div>
                  <span className="font-headline-sm text-xs font-bold text-on-surface">Campaign Script Engine</span>
                  <div className="font-label-sm text-[11px] text-secondary">Tree: Q3-ENT-MIGRATION-REV4</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-surface-container-high border border-outline-variant text-on-surface font-mono-code text-xs rounded">
                Step 2 of 4
              </span>
            </div>

            {/* Script Step Title */}
            <div className="bg-surface-container p-3 rounded border-l-4 border-secondary border-t border-r border-b border-outline-variant">
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary font-bold">
                  Current Script Node
                </span>
                <span className="font-label-sm text-[10px] text-outline">Read aloud verbatim</span>
              </div>
              <h2 className="font-headline-sm text-sm font-semibold text-on-surface mb-2">
                Opening Pitch - Enterprise Tier Migration
              </h2>
              <p className="text-xs text-on-surface leading-relaxed italic bg-surface-container-lowest/60 p-3 rounded border border-outline-variant">
                "Hi Jonathan, glad we caught each other! I'm following up on Apex Global's infrastructure review. With your contract up in 45 days, our system flagged your team for our new High-Throughput Dedicated Trunk Tier with zero overage billing. Have you had a chance to review the migration brief we emailed yesterday?"
              </p>
            </div>

            {/* Interactive Branching Tree */}
            <div className="flex flex-col gap-2">
              <span className="font-label-sm text-[10px] uppercase tracking-wider text-outline font-semibold">
                Select Customer Branching Response
              </span>
              <div className="flex flex-col gap-2">
                {/* Branch 1 */}
                <label
                  onClick={() => setScriptBranch('budget')}
                  className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                    scriptBranch === 'budget'
                      ? 'bg-surface-container-high border-secondary'
                      : 'bg-surface-container hover:bg-surface-container-high border-outline-variant'
                  }`}
                >
                  <input
                    type="radio"
                    name="script_branch"
                    checked={scriptBranch === 'budget'}
                    onChange={() => setScriptBranch('budget')}
                    className="mt-1 text-secondary focus:ring-secondary"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">"Too expensive / Budget constrained this quarter"</span>
                    <span className="text-[11px] text-on-surface-variant">Triggers Objection Pathway: ROI Calculator & CapEx write-off.</span>
                  </div>
                </label>

                {/* Branch 2 */}
                <label
                  onClick={() => setScriptBranch('approval')}
                  className={`flex items-start gap-3 p-2.5 rounded border cursor-pointer transition-colors ${
                    scriptBranch === 'approval'
                      ? 'bg-surface-container-high border-secondary'
                      : 'bg-surface-container hover:bg-surface-container-high border-outline-variant'
                  }`}
                >
                  <input
                    type="radio"
                    name="script_branch"
                    checked={scriptBranch === 'approval'}
                    onChange={() => setScriptBranch('approval')}
                    className="mt-1 text-secondary focus:ring-secondary"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-on-surface">"Needs executive approval / Board review next Tuesday"</span>
                    <span className="text-[11px] text-on-surface-variant">Triggers Pathway: Send One-Pager Executive Summary + Schedule Follow-Up.</span>
                  </div>
                </label>

                {/* Branch 3 */}
                <label
                  onClick={() => setScriptBranch('ready')}
                  className={`flex items-start gap-3 p-2.5 rounded border-2 cursor-pointer shadow-sm ${
                    scriptBranch === 'ready'
                      ? 'bg-surface-container-high border-secondary'
                      : 'bg-surface-container hover:bg-surface-container-high border-outline-variant'
                  }`}
                >
                  <input
                    type="radio"
                    name="script_branch"
                    checked={scriptBranch === 'ready'}
                    onChange={() => setScriptBranch('ready')}
                    className="mt-1 text-secondary focus:ring-secondary"
                  />
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-secondary">"Ready to sign / Let's lock in pricing today"</span>
                      <span className="text-[10px] bg-tertiary-container/30 text-tertiary px-1.5 py-0.2 rounded font-semibold uppercase">
                        Hot Path
                      </span>
                    </div>
                    <span className="text-[11px] text-on-surface">
                      Proceeds to immediate DocuSign dispatches & multi-year contract confirmation.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Real-Time AI Co-Pilot Guidance Card */}
          <div className="bg-surface-container-low border border-secondary/40 rounded p-3 flex flex-col gap-2 relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-2 text-secondary">
              <span className="material-symbols-outlined text-lg">smart_toy</span>
              <span className="font-label-md text-xs font-bold uppercase tracking-wider">
                AI Co-Pilot Real-time Suggestion
              </span>
            </div>

            <div className="bg-surface-container p-3 rounded border border-outline-variant/80 flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary text-xl shrink-0 mt-0.5">lightbulb</span>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-on-surface">Proactive Discount Trigger:</span>
                <p className="text-xs text-on-surface-variant leading-normal">
                  "Mention the <span className="text-tertiary font-bold">15% multi-year lock-in discount</span> if budget objection is raised. Customer has a 98.4% uptime requirement in contract clause 4.2 that our new cluster directly solves."
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-outline pt-1">
              <div className="flex items-center gap-1 font-mono-code">
                <span className="material-symbols-outlined text-xs">bolt</span>
                <span>Model latency: 114ms</span>
              </div>
              <button
                onClick={() => addNotification('SLA Clause 4.2', 'Clause 4.2: 99.98% uptime SLA with automatic failover to Secondary Edge.', 'info')}
                className="text-secondary hover:underline flex items-center gap-0.5"
              >
                <span>View full SLA clause</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </button>
            </div>
          </div>
        </section>

        {/* PANE 3: Disposition, Notes & Tasks (Col 4) */}
        <section className="lg:col-span-4 flex flex-col gap-3 min-h-0 overflow-y-auto pr-1">
          {/* One-Click Call Disposition Buttons */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-base">check_circle</span>
                <span className="font-headline-sm text-xs font-bold text-on-surface">Call Disposition</span>
              </div>
              <span className="text-[10px] text-outline font-mono-code">Single Click Select</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {([
                { disp: 'Interested / Demo', sub: 'Advance Pipeline', color: 'bg-tertiary' },
                { disp: 'Contract Sent', sub: 'DocuSign Dispatched', color: 'bg-secondary' },
                { disp: 'Follow Up Required', sub: 'Assign schedule', color: 'bg-primary' },
                { disp: 'Not Interested', sub: 'Mark Nurture', color: 'bg-outline' },
              ] as { disp: DispositionType; sub: string; color: string }[]).map((d) => (
                <button
                  key={d.disp}
                  onClick={() => setCallDisposition(d.disp)}
                  className={`flex items-center gap-2 p-2 rounded text-left transition-colors border ${
                    activeCall?.selectedDisposition === d.disp
                      ? 'bg-surface-container-high border-secondary'
                      : 'bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${d.color} shrink-0`}></span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate">{d.disp}</span>
                    <span className="text-[10px] text-outline truncate">{d.sub}</span>
                  </div>
                </button>
              ))}

              {/* DNC Full Width */}
              <button
                onClick={() => setCallDisposition('Wrong Number / DNC')}
                className={`sm:col-span-2 flex items-center justify-between p-2 rounded text-left transition-colors border ${
                  activeCall?.selectedDisposition === 'Wrong Number / DNC'
                    ? 'bg-error-container/40 border-error'
                    : 'bg-surface-container hover:bg-error-container/20 border-outline-variant text-on-surface'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-error shrink-0"></span>
                  <span className="text-xs font-semibold">Wrong Number / DNC (Do Not Call)</span>
                </div>
                <span className="text-[10px] text-error bg-error-container/30 px-1.5 rounded font-mono-code font-bold">
                  COMPLIANCE
                </span>
              </button>
            </div>
          </div>

          {/* Structured Notes & AI Auto-Summarizer */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <span className="font-headline-sm text-xs font-bold text-on-surface">Structured Call Notes</span>
              <button
                onClick={handleSummarize}
                disabled={isGeneratingSummary}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high hover:bg-primary hover:text-on-primary border border-outline-variant text-primary rounded text-xs transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-xs ${isGeneratingSummary ? 'animate-spin' : ''}`}>
                  auto_awesome
                </span>
                <span className="font-semibold">
                  {isGeneratingSummary ? 'Synthesizing...' : 'Generate AI Summary'}
                </span>
              </button>
            </div>
            <textarea
              value={activeCall?.notes || ''}
              onChange={(e) => updateCallNotes(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2.5 text-xs text-on-surface placeholder:text-outline focus:border-secondary outline-none resize-none font-mono-code leading-relaxed"
              rows={4}
              placeholder="Type call notes or click 'Generate AI Summary' to automatically distill speech into structured bullet takeaways..."
            ></textarea>
            <div className="flex items-center justify-between text-outline text-[11px] font-mono-code">
              <span>Speech-to-Text synced to interaction log</span>
              <span>{(activeCall?.notes || '').split(' ').filter(Boolean).length} words</span>
            </div>
          </div>

          {/* AI-Powered Automated Call Summary & Bulleted Takeaways Card */}
          <div className="bg-surface-container-low border border-tertiary/40 rounded p-3 flex flex-col gap-2.5 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-base">auto_awesome</span>
                <div>
                  <span className="font-headline-sm text-xs font-bold text-on-surface">
                    AI Automated Bulleted Takeaways
                  </span>
                  <span className="block text-[10px] text-tertiary font-mono-code">
                    Gemini 3.8 Flash • Auto-Saves on Call End
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {(activeCall?.aiSummary || latestCallLog?.keyTakeaways) && (
                  <button
                    onClick={() =>
                      handleCopyTakeaways(
                        activeCall?.aiSummary?.keyTakeaways || latestCallLog?.keyTakeaways || []
                      )
                    }
                    className="p-1 hover:bg-surface-container rounded text-outline hover:text-on-surface transition-colors"
                    title="Copy Takeaways"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {copiedTakeaways ? 'check' : 'content_copy'}
                    </span>
                  </button>
                )}
                <button
                  onClick={handleSummarize}
                  disabled={isGeneratingSummary || !activeCall}
                  className="px-2 py-0.5 bg-surface-container-high hover:bg-tertiary hover:text-on-tertiary border border-outline-variant text-[11px] font-semibold rounded text-on-surface transition-colors disabled:opacity-40"
                >
                  {isGeneratingSummary ? 'Analyzing...' : 'Refresh AI'}
                </button>
              </div>
            </div>

            {isGeneratingSummary ? (
              <div className="p-4 rounded bg-surface-container-lowest border border-outline-variant flex flex-col items-center justify-center gap-2 py-6">
                <div className="w-6 h-6 border-2 border-tertiary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-on-surface font-medium">Synthesizing audio into takeaways...</span>
                <span className="text-[10px] text-outline font-mono-code">Extracting key decisions, objections &amp; action items</span>
              </div>
            ) : activeCall?.aiSummary ? (
              <div className="space-y-2 text-xs">
                {/* Executive Summary */}
                <div className="p-2 rounded bg-tertiary-container/15 border border-tertiary/30 text-on-surface">
                  <span className="font-bold text-tertiary block text-[10px] uppercase font-mono-code mb-0.5">
                    Executive Summary
                  </span>
                  <p className="text-[11px] leading-relaxed text-on-surface font-medium">
                    {activeCall.aiSummary.summary}
                  </p>
                </div>

                {/* Bulleted Takeaways */}
                <div>
                  <span className="text-[10px] font-mono-code uppercase tracking-wider text-outline block mb-1">
                    Bulleted Takeaways ({activeCall.aiSummary.keyTakeaways.length})
                  </span>
                  <ul className="space-y-1 bg-surface-container-lowest p-2.5 rounded border border-outline-variant">
                    {activeCall.aiSummary.keyTakeaways.map((takeaway, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11px] text-on-surface leading-snug">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0"></span>
                        <span>{takeaway}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                {activeCall.aiSummary.actionItems && activeCall.aiSummary.actionItems.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono-code uppercase tracking-wider text-outline block mb-1">
                      Next Steps &amp; Action Items
                    </span>
                    <ul className="space-y-1 bg-surface-container-lowest p-2 rounded border border-outline-variant">
                      {activeCall.aiSummary.actionItems.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-secondary leading-snug">
                          <span className="material-symbols-outlined text-xs mt-0.5 shrink-0">arrow_forward</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : latestCallLog?.keyTakeaways ? (
              /* Fallback to latest interaction log takeaways */
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-outline font-mono-code">
                  <span>Last Interaction: {latestCallLog.callerName}</span>
                  <span className="text-tertiary">Saved to Log</span>
                </div>
                <ul className="space-y-1 bg-surface-container-lowest p-2.5 rounded border border-outline-variant">
                  {latestCallLog.keyTakeaways.slice(0, 3).map((takeaway, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-on-surface leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1.5 shrink-0"></span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between text-[10px] text-outline">
                  <span>Auto-saved to Auditing &amp; Interaction Log</span>
                  <button
                    onClick={handleSummarize}
                    disabled={!activeCall}
                    className="text-secondary hover:underline"
                  >
                    Summarize current call
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/60 text-center">
                <p className="text-xs text-outline">
                  Bulleted takeaways will auto-generate upon call completion, or click "Generate AI Summary".
                </p>
              </div>
            )}
          </div>

          {/* Quick Follow-up Task Creator */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-outline-variant pb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-base">add_task</span>
                <span className="font-headline-sm text-xs font-bold text-on-surface">Quick Follow-up Task</span>
              </div>
              <span className="text-[11px] text-secondary font-mono-code">Auto-syncs Outlook</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-outline">Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1.5 font-mono-code text-on-surface focus:border-secondary outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase text-outline">Time Slot</label>
                <select
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1.5 font-mono-code text-on-surface focus:border-secondary outline-none"
                >
                  <option value="10:00 AM PST">10:00 AM PST</option>
                  <option value="02:00 PM PST">02:00 PM PST</option>
                  <option value="04:30 PM PST">04:30 PM PST</option>
                </select>
              </div>
            </div>

            {/* Email Confirmation Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <span className="text-xs text-on-surface font-medium">Send invite &amp; brief</span>
                <span className="text-[10px] text-outline">
                  Email calendar invite to {activeCall?.email || 'lead'}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendInvite}
                  onChange={(e) => setSendInvite(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-secondary"></div>
              </label>
            </div>
          </div>

          {/* Pacing Indicator & Submit Action */}
          <div className="bg-surface-container p-3 rounded border border-outline-variant flex flex-col gap-2 mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono-code uppercase tracking-wider text-outline">
                Dialer Pacing Queue
              </span>
              <span className="font-mono-code text-xs text-secondary font-bold">Auto-Pacing 1.4x</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-surface-container-lowest rounded border border-outline-variant text-xs">
              <span className="material-symbols-outlined text-secondary text-base">fast_forward</span>
              <p className="text-on-surface-variant">
                Next call will preview in <span className="font-mono-code text-secondary font-bold">30s</span> after submission.
              </p>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full py-2.5 px-4 bg-tertiary hover:bg-tertiary-fixed text-on-tertiary font-headline-sm text-sm rounded font-bold shadow-md shadow-tertiary/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              <span>Submit Disposition &amp; Next Call</span>
            </button>
          </div>
        </section>
      </main>

      {/* Transfer Modal */}
      {transferModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <span className="font-bold text-sm text-on-surface">Transfer Active Call</span>
            <p className="text-xs text-outline">Select destination agent queue for warm or cold transfer:</p>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => {
                  addNotification('Warm Transfer Dispatched', 'Transferring Jonathan Vance to Tier-2 Escalations (Agent Marcus S.)', 'info');
                  setTransferModal(false);
                }}
                className="w-full text-left p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant flex justify-between"
              >
                <span>Tier 2 Technical Escalations</span>
                <span className="text-tertiary">Ready (Wait: 0s)</span>
              </button>
              <button
                onClick={() => {
                  addNotification('Cold Transfer Dispatched', 'Transferred to Billing Department IVR queue.', 'info');
                  setTransferModal(false);
                }}
                className="w-full text-left p-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant flex justify-between"
              >
                <span>Billing Operations IVR</span>
                <span className="text-secondary">Auto-IVR</span>
              </button>
            </div>
            <button
              onClick={() => setTransferModal(false)}
              className="py-1 bg-surface-container rounded border border-outline-variant text-xs mt-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Conference Modal */}
      {confModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <span className="font-bold text-sm text-on-surface">Bridge 3-Way Conference</span>
            <p className="text-xs text-outline">Enter phone or SIP URI to bridge third participant:</p>
            <input
              type="text"
              placeholder="+1 (555) 000-0000 or sip:agent@domain"
              className="bg-surface-container-lowest border border-outline-variant p-2 rounded text-xs text-on-surface"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfModal(false)}
                className="px-3 py-1 bg-surface-container rounded border border-outline-variant text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addNotification('Conference Bridge Active', 'Participant bridged into 3-way encrypted Opus audio session.', 'success');
                  setConfModal(false);
                }}
                className="px-3 py-1 bg-secondary text-on-secondary rounded font-bold text-xs"
              >
                Bridge Call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
