import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { audioEngine } from '../../utils/audioEngine';

export const AiModelsRoutingView: React.FC = () => {
  const { crmIntegrations, toggleCrmSync, addNotification } = useTelephony();

  const [sttModel, setSttModel] = useState('Deepgram Nova-2 (Medical/Financial Lexicon)');
  const [llmModel, setLlmModel] = useState('Anthropic Claude 3.5 Sonnet (Hybrid RAG)');
  const [ttsModel, setTtsModel] = useState('ElevenLabs Flash v2.5 (Aria - Conversational)');
  const [temperature, setTemperature] = useState(0.2);
  const [voiceStability, setVoiceStability] = useState(75);
  const [clarityBoost, setClarityBoost] = useState(85);
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [phonemeBoost, setPhonemeBoost] = useState(true);
  const [wordTimestamps, setWordTimestamps] = useState(true);
  const [autoTicketTrigger, setAutoTicketTrigger] = useState('Create on Both (Containment & Human Transfer)');
  const [selectedMappingCrm, setSelectedMappingCrm] = useState<string | null>(null);

  const handleAuditVoice = () => {
    addNotification('Voice Synthesis Audit', 'Playing ElevenLabs Aria streaming preview sample.', 'info');
    audioEngine.speakText('Thank you for calling AetherDial. Your dedicated carrier trunk has been upgraded to Opus 48 kilohertz high definition.');
  };

  const handleTestPipeline = () => {
    addNotification('End-to-End Pipeline Test', 'ASR (95ms) → LLM (140ms) → TTS (85ms). Total roundtrip: 320ms. Verification PASSED.', 'success');
  };

  const handleDeployConfig = () => {
    addNotification('Configuration Deployed', 'Active stack updated across all cluster partitions.', 'success');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-background custom-scrollbar">
      {/* Breadcrumbs & Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-outline mb-1">
            <span>Voice AI Orchestration</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-medium">Engine Configuration &amp; Ticket Attribution</span>
          </div>
          <h1 className="text-headline-xl font-headline-xl font-bold text-on-surface tracking-tight">
            Voice AI Architecture &amp; CRM Integration Hub
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-4xl mt-1">
            Select and benchmark Speech-to-Text, LLM Reasoning, and Text-to-Speech pipelines, sync CRM ticketing endpoints, and audit ticket volume attribution across autonomous Voice Bots vs. Human Agents.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleTestPipeline}
            className="flex items-center gap-2 px-3.5 py-2 rounded bg-surface-container-low border border-outline-variant hover:bg-surface-container-high text-on-surface transition-colors text-xs font-medium"
          >
            <span className="material-symbols-outlined text-base text-secondary">play_arrow</span>
            <span>Test End-to-End Pipeline</span>
          </button>
          <button
            onClick={handleDeployConfig}
            className="flex items-center gap-2 px-4 py-2 rounded bg-primary-container text-on-surface font-semibold hover:bg-primary-container/90 active:scale-[0.98] transition-all shadow-xs text-xs"
          >
            <span className="material-symbols-outlined text-base">rocket_launch</span>
            <span>Deploy Configuration Changes</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: AI Model Pipeline Selection & Benchmarks */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">tune</span>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">
              AI Model Pipeline Selection &amp; Benchmarks
            </h2>
          </div>
          <span className="font-mono-code text-xs text-outline">
            Active Stack: Deepgram / Claude 3.5 / ElevenLabs
          </span>
        </div>

        {/* 3 Pipeline Selection Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1. Speech-to-Text (ASR) */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono-code text-secondary uppercase tracking-wider font-semibold">
                    Layer 01 // Input Synthesis
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold mt-0.5">
                    Speech-to-Text (ASR)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-tertiary-container/30 border border-tertiary/40 text-tertiary text-xs font-mono-code">
                  95ms latency
                </span>
              </div>

              {/* Selector */}
              <div className="mt-3">
                <label className="block text-xs text-outline mb-1">Active Recognition Model</label>
                <div className="relative">
                  <select
                    value={sttModel}
                    onChange={(e) => setSttModel(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option>Deepgram Nova-2 (Medical/Financial Lexicon)</option>
                    <option>Whisper Large-v3 Turbo (OpenAI)</option>
                    <option>AssemblyAI Conformer-2</option>
                    <option>Google Cloud Speech-to-Text v2</option>
                  </select>
                </div>
              </div>

              {/* Telemetry Readout */}
              <div className="grid grid-cols-3 gap-2 mt-3 p-2 rounded bg-surface-container-lowest border border-outline-variant/60 font-mono-code text-xs">
                <div>
                  <div className="text-[10px] text-outline">Accuracy</div>
                  <div className="text-tertiary font-bold text-sm">98.4%</div>
                </div>
                <div>
                  <div className="text-[10px] text-outline">Latency</div>
                  <div className="text-on-surface font-bold text-sm">95 ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-outline">Cost Rate</div>
                  <div className="text-secondary font-bold text-sm">$0.0043<span className="text-[9px] text-outline">/m</span></div>
                </div>
              </div>

              {/* Toggles */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Spectral Noise Suppression</span>
                  <input
                    type="checkbox"
                    checked={noiseSuppression}
                    onChange={(e) => setNoiseSuppression(e.target.checked)}
                    className="text-secondary focus:ring-secondary rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-on-surface-variant">Phoneme Lexicon Boost</span>
                    <span className="text-[10px] text-secondary ml-1 font-mono-code">(+18 terms)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={phonemeBoost}
                    onChange={(e) => setPhonemeBoost(e.target.checked)}
                    className="text-secondary focus:ring-secondary rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant">Word-Level Timestamps &amp; Diarization</span>
                  <input
                    type="checkbox"
                    checked={wordTimestamps}
                    onChange={(e) => setWordTimestamps(e.target.checked)}
                    className="text-secondary focus:ring-secondary rounded"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs text-outline font-mono-code">
              <span>Endpoint: wss://api.deepgram.com</span>
              <span className="text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Online
              </span>
            </div>
          </div>

          {/* 2. LLM Orchestration */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono-code text-primary uppercase tracking-wider font-semibold">
                    Layer 02 // Core Reasoning
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold mt-0.5">
                    LLM Orchestration
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-primary-container/20 border border-primary/40 text-primary text-xs font-mono-code">
                  140ms TTFT
                </span>
              </div>

              {/* Selector */}
              <div className="mt-3">
                <label className="block text-xs text-outline mb-1">Active Reasoning Engine</label>
                <div className="relative">
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option>Anthropic Claude 3.5 Sonnet (Hybrid RAG)</option>
                    <option>OpenAI GPT-4o Realtime Engine</option>
                    <option>Google Gemini 2.5 Flash</option>
                    <option>Meta Llama 3.3 70B (Self-hosted)</option>
                  </select>
                </div>
              </div>

              {/* Telemetry Readout */}
              <div className="grid grid-cols-3 gap-2 mt-3 p-2 rounded bg-surface-container-lowest border border-outline-variant/60 font-mono-code text-xs">
                <div>
                  <div className="text-[10px] text-outline">Context</div>
                  <div className="text-on-surface font-bold text-sm">200k tok</div>
                </div>
                <div>
                  <div className="text-[10px] text-outline">First Token</div>
                  <div className="text-tertiary font-bold text-sm">140 ms</div>
                </div>
                <div>
                  <div className="text-[10px] text-outline">Function Call</div>
                  <div className="text-secondary font-bold text-sm">Enabled</div>
                </div>
              </div>

              {/* Sliders */}
              <div className="mt-3 space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">System Prompt Directive</span>
                    <span className="text-secondary font-mono-code text-[11px]">v4.2-enterprise-banking</span>
                  </div>
                  <input
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 font-mono-code text-outline text-xs"
                    readOnly
                    type="text"
                    value="system-prompt: banking-verification-v4.2.1-strict.jinja2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-on-surface-variant">Temperature</span>
                    <span className="text-primary font-mono-code">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full accent-primary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs text-outline font-mono-code">
              <span>RAG Knowledgebase: 14.2k Docs</span>
              <span className="text-tertiary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Active
              </span>
            </div>
          </div>

          {/* 3. Voice Synthesis (TTS) */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono-code text-tertiary uppercase tracking-wider font-semibold">
                    Layer 03 // Output Voice
                  </span>
                  <h3 className="text-headline-sm font-headline-sm text-on-surface font-bold mt-0.5">
                    Voice Synthesis (TTS)
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-tertiary-container/30 border border-tertiary/40 text-tertiary text-xs font-mono-code">
                  85ms stream
                </span>
              </div>

              {/* Selector */}
              <div className="mt-3">
                <label className="block text-xs text-outline mb-1">Active Synthesis Engine</label>
                <div className="relative">
                  <select
                    value={ttsModel}
                    onChange={(e) => setTtsModel(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-secondary cursor-pointer"
                  >
                    <option>ElevenLabs Flash v2.5 (Aria - Conversational)</option>
                    <option>Cartesia Sonic (Sub-100ms ultra-low latency)</option>
                    <option>AWS Polly Neural Joanna</option>
                    <option>OpenAI TTS-1-HD</option>
                  </select>
                </div>
              </div>

              {/* Sliders */}
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-on-surface-variant">Voice Stability &amp; Cadence</span>
                    <span className="text-tertiary font-mono-code">{voiceStability}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={voiceStability}
                    onChange={(e) => setVoiceStability(parseInt(e.target.value))}
                    className="w-full accent-tertiary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-on-surface-variant">Clarity / Similarity Boost</span>
                    <span className="text-tertiary font-mono-code">{clarityBoost}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={clarityBoost}
                    onChange={(e) => setClarityBoost(parseInt(e.target.value))}
                    className="w-full accent-tertiary bg-surface-container-high h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="pt-1">
                  <button
                    onClick={handleAuditVoice}
                    className="w-full py-1.5 px-2 rounded bg-surface-container-high border border-outline-variant hover:border-secondary text-secondary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">volume_up</span>
                    <span>Audit Voice Streaming Audio</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-2 rounded bg-surface-container-lowest border border-outline-variant flex items-center justify-between text-xs font-mono-code">
              <span className="text-secondary">Opus 48kHz Codec</span>
              <span className="text-outline">Chunk Rate: 20ms Frame</span>
            </div>
          </div>
        </div>

        {/* Pipeline Telemetry Summary Bar */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-code">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">speed</span>
              <span className="text-outline">Combined Pipeline Latency:</span>
              <span className="font-bold text-tertiary">320 ms</span>
              <span className="text-[10px] text-outline">(ASR: 95ms + LLM: 140ms + TTS: 85ms)</span>
            </div>
            <div className="h-4 w-px bg-outline-variant hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">payments</span>
              <span className="text-outline">Cost per Turn:</span>
              <span className="font-bold text-on-surface">$0.0062</span>
            </div>
            <div className="h-4 w-px bg-outline-variant hidden md:block"></div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-base">verified</span>
              <span className="text-outline">Provider Uptime:</span>
              <span className="font-bold text-tertiary">99.98%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-outline">Buffer: 40ms</span>
            <span className="px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant text-secondary">
              SLA Tier 1
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 2: CRM & Helpdesk Ticketing Integrations */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">hub</span>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">
              CRM &amp; Helpdesk Ticketing Integrations
            </h2>
          </div>
          <span className="text-xs text-outline font-mono-code">
            Active Endpoints: 3 Connected, 1 Standby
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {crmIntegrations.map((crm) => (
            <div
              key={crm.id}
              className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant">
                    <span className="material-symbols-outlined text-lg">{crm.iconName}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-on-surface text-sm">{crm.name}</h4>
                    <span className="text-[10px] text-outline block -mt-0.5 font-mono-code">{crm.version}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleCrmSync(crm.id)}
                  className={`flex items-center gap-1 text-[11px] font-mono-code cursor-pointer ${
                    crm.status === 'Connected' ? 'text-tertiary' : 'text-outline'
                  }`}
                  title="Click to toggle sync status"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      crm.status === 'Connected' ? 'bg-tertiary animate-pulse' : 'bg-outline'
                    }`}
                  ></span>
                  {crm.status}
                </button>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-outline">Sync Mechanism:</span>
                  <span className="text-on-surface font-mono-code text-[11px]">{crm.syncMechanism}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Target Object:</span>
                  <span className="text-on-surface font-mono-code text-[11px]">{crm.targetObject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-outline">Last Handshake:</span>
                  <span className="text-secondary font-mono-code text-[11px]">{crm.lastHandshake}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-outline font-mono-code truncate max-w-[130px]">
                  {crm.slaPriorityRule}
                </span>
                <button
                  onClick={() => setSelectedMappingCrm(crm.id)}
                  className="text-secondary hover:underline font-medium text-xs"
                >
                  Edit Mappings
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Unified Sync Parameters Panel */}
        <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-outline">Auto-Ticket Creation Trigger:</span>
              <select
                value={autoTicketTrigger}
                onChange={(e) => setAutoTicketTrigger(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface"
              >
                <option>Create on Both (Containment &amp; Human Transfer)</option>
                <option>Create Only on Human Escalation</option>
                <option>Create Only on Successful Containment</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-outline">Transcript Attachment:</span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-xs text-on-surface border border-outline-variant font-mono-code">
                Full JSON + Redacted PII (PCI-DSS)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-tertiary font-mono-code">
            <span className="material-symbols-outlined text-sm">check_circle</span>
            <span>All Payloads Encrypted with AES-256</span>
          </div>
        </div>
      </section>

      {/* SECTION 3: Ticket Generation & Attribution Telemetry */}
      <section className="space-y-4">
        <div className="border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">query_stats</span>
            <h2 className="text-headline-sm font-headline-sm text-on-surface font-semibold">
              Ticket Generation &amp; Service Desk Attribution
            </h2>
          </div>
          <p className="text-xs text-outline">
            Real-time breakdown of ticketing provenance between autonomous Voice Bots vs Escalated Human Agents
          </p>
        </div>

        {/* 4 KPI Big Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-xs uppercase font-mono-code">
              <span>TOTAL TICKETS GENERATED</span>
              <span className="material-symbols-outlined text-base">confirmation_number</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono-code text-on-surface">8,420</div>
              <div className="flex items-center gap-1.5 text-xs text-tertiary mt-1">
                <span className="material-symbols-outlined text-xs">trending_up</span>
                <span className="font-mono-code">+14.2%</span>
                <span className="text-outline">vs yesterday</span>
              </div>
            </div>
            <div className="text-[11px] text-outline border-t border-outline-variant/60 pt-2 font-mono-code">
              Aggregated across Salesforce &amp; Zendesk
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-secondary text-xs uppercase font-mono-code font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                VOICE BOT AUTONOMOUS
              </span>
              <span className="px-1.5 py-0.5 rounded bg-secondary/10 border border-secondary/30 text-secondary text-[11px] font-bold">
                67.0%
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono-code text-secondary">5,640</div>
              <div className="text-xs text-on-surface-variant mt-1">
                Auto-resolved &amp; tagged without agent intervention
              </div>
            </div>
            <div className="text-[11px] text-outline border-t border-outline-variant/60 pt-2 flex justify-between font-mono-code">
              <span>Avg Handling: 54s</span>
              <span className="text-tertiary">CSAT: 4.8/5.0</span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-on-surface-variant text-xs uppercase font-mono-code font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                HUMAN AGENT ESCALATED
              </span>
              <span className="px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant text-primary text-[11px] font-bold">
                33.0%
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono-code text-primary">2,780</div>
              <div className="text-xs text-on-surface-variant mt-1">
                Warm-transferred with pre-filled context &amp; transcript
              </div>
            </div>
            <div className="text-[11px] text-outline border-t border-outline-variant/60 pt-2 flex justify-between font-mono-code">
              <span>Avg Handle: 6m 42s</span>
              <span className="text-on-surface">Transfer: 1.4s</span>
            </div>
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-tertiary text-xs uppercase font-mono-code font-semibold">
              <span>DEFLECTION COST SAVINGS</span>
              <span className="material-symbols-outlined text-base">savings</span>
            </div>
            <div className="my-2">
              <div className="text-2xl font-bold font-mono-code text-tertiary">$38,450</div>
              <div className="text-xs text-on-surface-variant mt-1">
                Estimated savings today ($6.80 human vs $0.22 bot ticket)
              </div>
            </div>
            <div className="text-[11px] text-outline border-t border-outline-variant/60 pt-2 flex justify-between font-mono-code">
              <span>Target: $42,000</span>
              <span className="text-tertiary">91.5% Achieved</span>
            </div>
          </div>
        </div>
      </section>

      {/* Mapping Edit Modal */}
      {selectedMappingCrm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded p-5 flex flex-col gap-3">
            <span className="font-bold text-sm text-on-surface">Configure CRM Field Mappings</span>
            <p className="text-xs text-outline">Map AetherDial telephony parameters to CRM destination fields:</p>
            <div className="space-y-2 text-xs font-mono-code">
              <div>
                <label className="text-[10px] text-outline block mb-0.5">Caller ID & Phone</label>
                <input defaultValue="Contact.Phone / Requester.Phone" className="w-full bg-surface-container p-2 rounded border border-outline-variant text-on-surface" />
              </div>
              <div>
                <label className="text-[10px] text-outline block mb-0.5">Call Recording Audio URL</label>
                <input defaultValue="Case.Attachment_Recording_Url__c" className="w-full bg-surface-container p-2 rounded border border-outline-variant text-on-surface" />
              </div>
              <div>
                <label className="text-[10px] text-outline block mb-0.5">AI Sentiment Score</label>
                <input defaultValue="Case.Sentiment_Score__c" className="w-full bg-surface-container p-2 rounded border border-outline-variant text-on-surface" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
              <button onClick={() => setSelectedMappingCrm(null)} className="px-3 py-1 bg-surface-container rounded border border-outline-variant text-xs">
                Cancel
              </button>
              <button
                onClick={() => {
                  addNotification('Field Mappings Saved', 'CRM field mapping schema validated and active.', 'success');
                  setSelectedMappingCrm(null);
                }}
                className="px-3 py-1 bg-secondary text-on-secondary font-bold rounded text-xs"
              >
                Save Mappings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
