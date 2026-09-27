import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { audioEngine } from '../../utils/audioEngine';

export const VoiceAiBotOpsView: React.FC = () => {
  const { addNotification, setActiveTab } = useTelephony();

  const [selectedBotModel, setSelectedBotModel] = useState('Deepgram + Claude 3.5 + ElevenLabs');
  const [selectedPersona, setSelectedPersona] = useState<'Joanna' | 'Brian'>('Joanna');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [botModelFilter, setBotModelFilter] = useState('all');
  const [isSimulatingMic, setIsSimulatingMic] = useState(false);
  const [activeCallDetails, setActiveCallDetails] = useState<string | null>('CALL-98239');

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; sub?: string }>>([
    {
      sender: 'bot',
      text: 'Hello! Thanks for calling AetherDial Support. How can I help you today?',
      sub: 'AI Voice Agent (TTS 180ms)',
    },
    {
      sender: 'user',
      text: '“I was double-billed on my last invoice and this is totally unacceptable, transfer me right now!”',
      sub: 'Simulated Caller (SIP #842)',
    },
    {
      sender: 'bot',
      text: 'I completely understand your frustration, and I apologize for the error. I can see the duplicate charge of $120.00 from yesterday. Would you like me to process an instant refund to your card ending in 4092, or would you prefer to speak directly with an account specialist?',
      sub: 'AI Voice Agent (Speaking now...)',
    },
  ]);

  const handleSimulateMic = () => {
    setIsSimulatingMic(true);
    audioEngine.speakText(
      'Yes please, process the refund immediately to my card, that would be much faster.',
      () => {
        setIsSimulatingMic(false);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'user',
            text: '“Yes please, process the refund immediately to my card, that would be much faster.”',
            sub: 'Simulated Caller (Microphone)',
          },
          {
            sender: 'bot',
            text: 'Done! I have initiated the $120.00 refund to your card ending in 4092. You will receive an email confirmation shortly. Is there anything else I can help with?',
            sub: 'AI Voice Agent (TTS 140ms - Contained)',
          },
        ]);
        addNotification('Voice Simulator Turn Completed', 'Autonomous bot successfully contained billing inquiry without human transfer.', 'success');
      }
    );
  };

  const handleEscalationTest = () => {
    addNotification('Escalation Test Triggered', 'Sentiment threshold breached. Warm transfer packet generated and dispatched to Tier 2 queue.', 'error');
  };

  return (
    <div className="flex-1 p-4 lg:p-6 flex flex-col gap-5 overflow-y-auto bg-surface custom-scrollbar">
      {/* 1. Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant/50 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface">
              AI Voice Bot Orchestration &amp; Telemetry
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-label-sm font-mono-code bg-tertiary-container/30 border border-tertiary/40 text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
              AI Bot Cluster: Active (v4.2-neural)
            </span>
          </div>
          <p className="text-body-sm font-body-sm text-outline mt-0.5">
            Real-time containment metrics, interactive sandbox test harness, live escalation diagnostics &amp; transcript logs
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => addNotification('Audit Exported', 'Escalation audit report downloaded.', 'info')}
            className="bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded text-label-md text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm text-secondary">download</span>
            <span>Export Escalation Audit</span>
          </button>
          <button
            onClick={() => handleSimulateMic()}
            className="bg-surface-container-low border border-outline-variant px-3 py-1.5 rounded text-label-md text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm text-secondary">play_circle</span>
            <span>Audio Simulator Test</span>
          </button>
          <button
            onClick={() => addNotification('Bot Revision Deployed', 'Cluster updated with system prompt directive v4.2.1-strict.', 'success')}
            className="bg-primary text-on-primary-container px-3.5 py-1.5 rounded text-label-md text-xs font-bold hover:bg-primary-container transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <span className="material-symbols-outlined text-sm">rocket_launch</span>
            <span>Deploy Bot Revision</span>
          </button>
        </div>
      </div>

      {/* 2. Top Telemetry KPI Ribbon */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Total Calls */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase tracking-wider">
            <span>Total Inbound Bot Calls</span>
            <span className="material-symbols-outlined text-base text-primary">call</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">14,820</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>+18.4%
            </span>
          </div>
          <p className="text-[11px] text-outline mt-1 truncate">Autonomous IVR &amp; conversational deflection</p>
        </div>

        {/* Card 2: AI Contained */}
        <div className="bg-surface-container-low border border-tertiary/40 rounded p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-outline text-label-sm font-label-sm uppercase tracking-wider">
              AI Contained &amp; Resolved
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-tertiary/10 border border-tertiary/40 text-tertiary">
              CONTAINED
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono-code text-tertiary">10,967</span>
            <span className="text-sm font-mono-code text-tertiary font-bold">74.0%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-outline">
            <span>Self-service completed</span>
            <span className="text-tertiary font-mono-code font-semibold">Target &gt;70%</span>
          </div>
        </div>

        {/* Card 3: Escalated */}
        <div className="bg-surface-container-low border border-error/40 rounded p-3 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-outline text-label-sm font-label-sm uppercase tracking-wider">
              Escalated to Human
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-error/10 border border-error/40 text-error">
              TRANSFERRED
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl font-bold font-mono-code text-error">3,853</span>
            <span className="text-sm font-mono-code text-error font-bold">26.0%</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-outline">
            <span className="truncate">Warm handoff with context:</span>
            <span className="text-secondary font-mono-code font-bold">98.4%</span>
          </div>
        </div>

        {/* Card 4: Avg Turn Duration */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase tracking-wider">
            <span>Avg Bot Turn Duration</span>
            <span className="material-symbols-outlined text-base text-secondary">avg_pace</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">1m 42s</span>
            <span className="text-xs font-mono-code text-tertiary font-semibold">-12s vs human</span>
          </div>
          <p className="text-[11px] text-outline mt-1 font-mono-code">
            Avg Token Latency: <span className="text-secondary font-bold">280ms</span>
          </p>
        </div>

        {/* Card 5: CSAT */}
        <div className="bg-surface-container-low border border-outline-variant/60 rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase tracking-wider">
            <span>CSAT Post-Bot Call</span>
            <span className="material-symbols-outlined text-base text-tertiary">star</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">4.6</span>
            <span className="text-xs font-mono-code text-outline">/ 5.0</span>
          </div>
          <p className="text-[11px] text-outline mt-1">Based on 3.2k automated post-call surveys</p>
        </div>
      </section>

      {/* 3. Two-Column Core Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-5">
          {/* Section A: Call Escalation Breakdown & Root Causes */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Call Escalation Breakdown &amp; Root Causes
                </h2>
                <p className="text-xs text-outline">
                  Telemetry attribution for 3,853 transfers during current active operational shift
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-surface-container-highest border border-outline-variant text-on-surface-variant self-start sm:self-auto">
                Shift: 08:00 - 18:00 EST
              </span>
            </div>

            {/* Horizontal Stacked Bar */}
            <div className="w-full h-3 bg-surface-container-lowest rounded overflow-hidden flex gap-0.5 p-0.5 border border-outline-variant/40 mb-4">
              <div className="h-full bg-error rounded-sm" style={{ width: '34%' }} title="Sentiment Dip (34%)"></div>
              <div className="h-full bg-secondary rounded-sm" style={{ width: '28%' }} title="Complex Intent (28%)"></div>
              <div className="h-full bg-primary-container rounded-sm" style={{ width: '22%' }} title="Explicit Request (22%)"></div>
              <div className="h-full bg-tertiary rounded-sm" style={{ width: '11%' }} title="Payment / Sensitive (11%)"></div>
              <div className="h-full bg-outline rounded-sm" style={{ width: '5%' }} title="ASR / Noise (5%)"></div>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container-high transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-error mt-1.5 shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-on-surface">
                        Sentiment Dip / Frustration Detected
                      </span>
                      <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-error/10 text-error border border-error/30">
                        34% (1,310 calls)
                      </span>
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 font-mono-code">
                      Trigger: Acoustic vocal pitch &amp; negative lexicon threshold (&lt; -0.65)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-mono-code text-error font-bold">+4.2% /hr</span>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container-high transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-on-surface">
                        Complex Intent / Out of Knowledge Base
                      </span>
                      <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-secondary/10 text-secondary border border-secondary/30">
                        28% (1,078 calls)
                      </span>
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 font-mono-code">
                      Trigger: RAG retrieval score &lt; 0.65 (Fallback to Domain Queue)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-mono-code text-secondary font-bold">Stable</span>
                </div>
              </div>

              {/* Item 3 */}
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container-high transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-primary-container mt-1.5 shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-on-surface">
                        Customer Explicit Human Request (“Talk to agent”)
                      </span>
                      <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-primary-container/20 text-primary border border-primary/30">
                        22% (848 calls)
                      </span>
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 font-mono-code">
                      Trigger: DTMF '0' or phrase “representative” / “human”
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-mono-code text-tertiary font-bold">-2.1% /hr</span>
                </div>
              </div>

              {/* Item 4 */}
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container-high transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-tertiary mt-1.5 shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-on-surface">
                        Payment / Sensitive Authentication
                      </span>
                      <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-tertiary/10 text-tertiary border border-tertiary/30">
                        11% (424 calls)
                      </span>
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 font-mono-code">
                      Trigger: High-risk security policy constraint (PCI-DSS IVR vaulting)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-mono-code text-outline font-bold">Normal</span>
                </div>
              </div>

              {/* Item 5 */}
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-surface-container-high transition-colors">
                <div className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-outline mt-1.5 shrink-0"></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-on-surface">
                        Speech Recognition Failure / Noise
                      </span>
                      <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                        5% (193 calls)
                      </span>
                    </div>
                    <p className="text-[11px] text-outline mt-0.5 font-mono-code">
                      Trigger: 3 consecutive ASR low-confidence retries (&lt; 0.40)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-mono-code text-tertiary font-bold">Optimal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Call History & Conversational Audit Logs */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Call History &amp; Conversational Audit Logs
                </h2>
                <p className="text-xs text-outline">Real-time session indexing with inline transfer tracing</p>
              </div>
              <span className="text-xs font-mono-code text-secondary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                Live Ingest Active
              </span>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 bg-surface-container rounded border border-outline-variant/40">
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs font-mono-code text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
                placeholder="Filter by Call ID / Phone..."
                type="text"
              />
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs font-mono-code text-on-surface focus:outline-none"
              >
                <option value="all">Outcome: All Sessions</option>
                <option value="contained">Bot Contained (74%)</option>
                <option value="escalated">Escalated to Human (26%)</option>
              </select>
              <select
                value={botModelFilter}
                onChange={(e) => setBotModelFilter(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs font-mono-code text-on-surface focus:outline-none"
              >
                <option value="all">Bot Model: All Active</option>
                <option value="billing">BillingBot-v4</option>
                <option value="care">Tier-1 CareBot</option>
                <option value="sales">SalesInquiry-v2</option>
              </select>
            </div>

            {/* Telemetry Table */}
            <div className="overflow-x-auto rounded border border-outline-variant/40 bg-surface-container-lowest">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/60 bg-surface-container text-[11px] font-mono-code text-outline uppercase tracking-wider">
                    <th className="p-2.5">Call ID &amp; Time</th>
                    <th className="p-2.5">Caller Contact</th>
                    <th className="p-2.5">Bot Model</th>
                    <th className="p-2.5">Turns</th>
                    <th className="p-2.5">Outcome</th>
                    <th className="p-2.5">Escalation &amp; Agent</th>
                    <th className="p-2.5 text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30 font-mono-code text-xs">
                  {/* Row 1 */}
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-2.5">
                      <span className="text-on-surface font-semibold">#CALL-98241</span>
                      <div className="text-outline text-[10px]">14:32:10 EST</div>
                    </td>
                    <td className="p-2.5">
                      <span className="text-on-surface">+1 (312) 440-1920</span>
                      <div className="text-outline text-[10px]">Sarah Lin</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface text-[10px]">
                        BillingBot-v4
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span>2m 14s</span>
                      <div className="text-outline text-[10px]">5 turns</div>
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary border border-tertiary/30 font-semibold text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-tertiary"></span> Contained
                      </span>
                    </td>
                    <td className="p-2.5 text-outline text-[11px]">N/A (Card updated)</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => addNotification('Audio Inspection', 'Playing audio buffer for CALL-98241.', 'info')}
                        className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-secondary border border-outline-variant text-[11px] inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">play_arrow</span> Play
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 */}
                  <tr className="bg-surface-container/60 border-l-2 border-l-error">
                    <td className="p-2.5">
                      <span className="text-error font-semibold">#CALL-98239</span>
                      <div className="text-outline text-[10px]">14:30:45 EST</div>
                    </td>
                    <td className="p-2.5">
                      <span className="text-on-surface">+1 (415) 890-2341</span>
                      <div className="text-outline text-[10px]">Jonathan Vance</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface text-[10px]">
                        Tier-1 CareBot
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span>1m 50s</span>
                      <div className="text-outline text-[10px]">4 turns</div>
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/30 font-semibold text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-error"></span> Escalated
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="text-error font-medium text-[11px]">Sentiment Dip</span>
                      <div className="text-outline text-[10px]">Agent Marcus S. (Wait: 8s)</div>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => setActiveTab('agent_telephony')}
                        className="px-2 py-1 rounded bg-error/20 text-error border border-error/40 text-[11px] font-semibold inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">notes</span> Drawer Active
                      </button>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="p-2.5">
                      <span className="text-on-surface font-semibold">#CALL-98228</span>
                      <div className="text-outline text-[10px]">14:26:12 EST</div>
                    </td>
                    <td className="p-2.5">
                      <span className="text-on-surface">+1 (617) 555-0187</span>
                      <div className="text-outline text-[10px]">Elena Rostova</div>
                    </td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface-container border border-outline-variant text-on-surface text-[10px]">
                        SalesInquiry-v2
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span>3m 05s</span>
                      <div className="text-outline text-[10px]">8 turns</div>
                    </td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-error/10 text-error border border-error/30 font-semibold text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-error"></span> Escalated
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="text-secondary font-medium text-[11px]">Explicit Request</span>
                      <div className="text-outline text-[10px]">Agent Sarah Chen</div>
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => addNotification('Audio Inspection', 'Playing audio buffer for CALL-98228.', 'info')}
                        className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant text-[11px] inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">play_arrow</span> Play
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-xs text-outline px-1 font-mono-code">
              <span>Showing 3 of 14,820 live calls</span>
              <span>Page 1 / 370</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {/* Section C: Interactive Voice Bot Testing Sandbox */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between border-b border-outline-variant/40 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">science</span>
                  <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                    Voice Bot Simulator
                  </h2>
                </div>
                <p className="text-xs text-outline font-mono-code">Real-time Latency &amp; ASR/LLM Test Harness</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-secondary/10 border border-secondary/40 text-secondary">
                SANDBOX ISOLATED
              </span>
            </div>

            {/* Model & Persona Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-code">
              <div>
                <label className="text-outline text-[10px] uppercase tracking-wider block mb-1">
                  Model &amp; Pipeline
                </label>
                <select
                  value={selectedBotModel}
                  onChange={(e) => setSelectedBotModel(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-1.5 text-on-surface focus:outline-none focus:border-secondary"
                >
                  <option>Deepgram + Claude 3.5 + ElevenLabs</option>
                  <option>OpenAI GPT-4o Realtime Voice API</option>
                  <option>Whisper Large v3 + Llama 3.3 70B</option>
                </select>
              </div>

              <div>
                <label className="text-outline text-[10px] uppercase tracking-wider block mb-1">
                  Voice Persona
                </label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setSelectedPersona('Joanna')}
                    className={`py-1 px-2 rounded text-center text-xs font-semibold border ${
                      selectedPersona === 'Joanna'
                        ? 'bg-surface-container-high border-secondary text-secondary'
                        : 'bg-surface-container border-outline-variant text-outline'
                    }`}
                  >
                    Joanna (Female)
                  </button>
                  <button
                    onClick={() => setSelectedPersona('Brian')}
                    className={`py-1 px-2 rounded text-center text-xs font-semibold border ${
                      selectedPersona === 'Brian'
                        ? 'bg-surface-container-high border-secondary text-secondary'
                        : 'bg-surface-container border-outline-variant text-outline'
                    }`}
                  >
                    Brian (Male)
                  </button>
                </div>
              </div>
            </div>

            {/* Voice Waveform & Decibel */}
            <div className="bg-surface-container-lowest rounded border border-outline-variant/50 p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-mono-code">
                <span className="text-tertiary flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  {isSimulatingMic ? 'Mic Audio Transmitting...' : 'Mic Active / Simulating Inbound SIP Caller'}
                </span>
                <span className="text-outline font-mono-code">-18.4 dBFS</span>
              </div>
              <div className="h-8 flex items-center justify-between gap-1 px-1 bg-surface-container/40 rounded">
                {[2, 3, 5, 7, 4, 6, 8, 5, 6, 4, 2, 6, 7, 3, 2, 1, 5, 6, 2].map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h * 4}px` }}
                    className={`w-1 rounded-full ${h >= 7 ? 'bg-tertiary' : 'bg-secondary'}`}
                  ></span>
                ))}
              </div>
            </div>

            {/* Live Interactive Chat Dialog */}
            <div className="bg-surface-container-lowest rounded border border-outline-variant/40 p-3 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 ${
                    msg.sender === 'user' ? 'items-end self-end max-w-[90%]' : 'items-start max-w-[95%]'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1 text-[10px] font-mono-code ${
                      msg.sender === 'user' ? 'text-error' : 'text-secondary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs">
                      {msg.sender === 'user' ? 'record_voice_over' : 'smart_toy'}
                    </span>
                    <span>{msg.sub}</span>
                  </div>
                  <div
                    className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-error-container/20 border border-error/40 text-on-surface'
                        : 'bg-surface-container border border-outline-variant/40 text-on-surface'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Inference Diagnostics Card */}
              <div className="bg-surface-container-high border border-secondary/40 rounded p-2.5 flex flex-col gap-2 my-1">
                <div className="flex items-center justify-between border-b border-outline-variant/30 pb-1.5 text-xs font-mono-code">
                  <span className="text-secondary font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">psychology</span>
                    Real-time Inference Diagnostics
                  </span>
                  <span className="text-outline">Confidence: 96%</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-code">
                  <div>
                    <span className="text-outline block text-[9px] uppercase">Sentiment Vector:</span>
                    <span className="text-error font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error"></span> Agitated (-0.78)
                    </span>
                  </div>
                  <div>
                    <span className="text-outline block text-[9px] uppercase">Intent Extracted:</span>
                    <span className="text-secondary font-semibold">Billing Dispute</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono-code bg-surface-container-lowest p-1.5 rounded border border-outline-variant/40">
                  <span className="text-tertiary block text-[9px] uppercase font-bold">Bot Decision:</span>
                  <span className="text-on-surface text-[10px]">
                    PROPOSE REFUND FIRST; IF ESCALATED → Warm Transfer to Billing Tier-2
                  </span>
                </div>
              </div>
            </div>

            {/* SIP Latency Breakdown Ribbon */}
            <div className="p-2 rounded bg-surface-container-high border border-outline-variant/50 flex items-center justify-between text-[11px] font-mono-code">
              <span className="text-outline">Latency:</span>
              <span className="text-on-surface-variant">ASR: <strong className="text-secondary">95ms</strong></span>
              <span className="text-outline">|</span>
              <span className="text-on-surface-variant">LLM TTFT: <strong className="text-primary">140ms</strong></span>
              <span className="text-outline">|</span>
              <span className="text-on-surface-variant">TTS: <strong className="text-tertiary">85ms</strong></span>
              <span className="text-outline">|</span>
              <span className="text-on-surface font-bold bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant">
                Total: 320ms
              </span>
            </div>

            {/* Action Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleSimulateMic}
                disabled={isSimulatingMic}
                className="bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface py-2 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm text-secondary">mic</span>
                <span>{isSimulatingMic ? 'Audio Playing...' : 'Simulate Voice Mic'}</span>
              </button>
              <button
                onClick={handleEscalationTest}
                className="bg-error-container/30 border border-error/50 hover:bg-error-container/50 text-error py-2 rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">emergency_home</span>
                <span>Trigger Escalation Test</span>
              </button>
            </div>
          </div>

          {/* Quick Telemetry Snapshot */}
          <div className="bg-surface-container-low border border-outline-variant/60 rounded p-3 text-xs font-mono-code flex flex-col gap-2">
            <div className="flex items-center justify-between text-outline">
              <span className="uppercase tracking-wider">Trunk Codec / Protocol</span>
              <span className="text-tertiary">Opus 48kHz (FEC Enabled)</span>
            </div>
            <div className="flex items-center justify-between text-outline">
              <span className="uppercase tracking-wider">SIP Packet Loss / Jitter</span>
              <span className="text-on-surface">0.02% / 1.4ms</span>
            </div>
            <div className="flex items-center justify-between text-outline">
              <span className="uppercase tracking-wider">Warm Transfer Handoff Token</span>
              <span className="text-secondary truncate max-w-[180px]">tok_ctx_98239_vance_auth</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
