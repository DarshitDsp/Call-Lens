import React, { useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';

export const TrunkRoutingView: React.FC = () => {
  const {
    twilioConfig,
    updateTwilioConfig,
    dids,
    releaseDid,
    setIsBuyNumberOpen,
    addNotification,
  } = useTelephony();

  const [accountSid, setAccountSid] = useState(twilioConfig.accountSid);
  const [authToken, setAuthToken] = useState(twilioConfig.authToken);
  const [showSid, setShowSid] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(twilioConfig.edgeLocation);
  const [didSearch, setDidSearch] = useState('');
  const [codecs, setCodecs] = useState(twilioConfig.codecs);

  const edgePings = {
    Ashburn: 18.4,
    Oregon: 52.1,
    Frankfurt: 96.0,
    Tokyo: 145.2,
  };

  const filteredDids = dids.filter(
    (d) =>
      d.number.includes(didSearch) ||
      d.assignedCampaign.toLowerCase().includes(didSearch.toLowerCase()) ||
      d.friendlyName.toLowerCase().includes(didSearch.toLowerCase())
  );

  const handleTestHandshake = () => {
    addNotification('SIP Handshake Test', `OPTIONS ping sent to ${twilioConfig.terminationUri}. Response: 200 OK (${edgePings[selectedEdge]}ms RTT).`, 'success');
  };

  const handleSaveConfig = () => {
    updateTwilioConfig({
      accountSid,
      authToken,
      edgeLocation: selectedEdge,
      edgeLatencyMs: edgePings[selectedEdge],
      codecs,
    });
    addNotification('Configuration Saved', 'Twilio Elastic SIP Trunk settings saved to cluster.', 'success');
  };

  const handleRotateKey = () => {
    const newKey = `SK${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setAuthToken(newKey);
    addNotification('Twilio API Secret Rotated', 'New credential issued and validated.', 'info');
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-surface p-4 lg:p-6 space-y-5 custom-scrollbar">
      {/* BREADCRUMBS & CONTEXT HEADER */}
      <section className="flex flex-col gap-2">
        <nav className="flex items-center gap-2 text-xs font-mono-code text-outline">
          <span>Telephony Hub</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span>Carrier Infrastructure</span>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-secondary font-medium">Twilio Elastic SIP &amp; Telephony</span>
        </nav>

        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 border-b border-outline-variant pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
                Twilio Telephony &amp; SIP Trunk Configuration
              </h1>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-container/30 border border-tertiary/40 text-tertiary text-xs font-mono-code">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span>Twilio Connected: Production Trunk ({accountSid.slice(0, 7)}...{accountSid.slice(-4)})</span>
              </div>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 max-w-4xl">
              Manage Twilio Account SID credentials, Elastic SIP Trunks, Twilio Media Streams (WebSocket audio bridging for Voice AI), inbound DID pools, and carrier-grade voice codecs.
            </p>
          </div>

          {/* Top Action Bar Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestHandshake}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface rounded transition-colors"
            >
              <span className="material-symbols-outlined text-secondary text-sm">sync</span>
              <span>Test SIP Handshake</span>
            </button>
            <button
              onClick={handleSaveConfig}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-primary-container text-on-primary-container rounded hover:bg-primary-container/90 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">publish</span>
              <span>Save &amp; Deploy Configuration</span>
            </button>
          </div>
        </div>

        {/* QUICK TELEPHONY METRICS STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Metric 1 */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono-code text-outline uppercase">
              <span>ACTIVE TWILIO DIDS</span>
              <span className="material-symbols-outlined text-sm text-secondary">dialpad</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono-code text-on-surface">{dids.length} Numbers</span>
              <span className="text-xs font-mono-code text-on-surface-variant">US, UK, CA, DE</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-secondary h-full rounded-full" style={{ width: '96%' }}></div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono-code text-outline uppercase">
              <span>LIVE SIP SESSIONS / CHANNELS</span>
              <span className="material-symbols-outlined text-sm text-tertiary">call</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono-code text-on-surface">142 / 500</span>
              <span className="text-xs font-mono-code text-tertiary">28.4% Capacity</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '28.4%' }}></div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono-code text-outline uppercase">
              <span>RTT TO TWILIO EDGE ({selectedEdge.toUpperCase()})</span>
              <span className="material-symbols-outlined text-sm text-secondary">speed</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono-code text-on-surface">
                {edgePings[selectedEdge]} ms
              </span>
              <span className="text-xs font-mono-code text-tertiary font-semibold">Optimal</span>
            </div>
            <div className="w-full bg-surface-container-highest h-1 rounded-full mt-2 overflow-hidden">
              <div className="bg-tertiary h-full rounded-full" style={{ width: '18%' }}></div>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono-code text-outline uppercase">
              <span>TWILIO MEDIA STREAMS</span>
              <span className="material-symbols-outlined text-sm text-secondary">settings_ethernet</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs font-bold text-secondary font-mono-code">WebSocket Active</span>
              <span className="text-[11px] font-mono-code text-on-surface-variant">8kHz/16kHz PCM</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="w-2 h-2 rounded-full bg-tertiary"></span>
              <span className="text-xs text-on-surface-variant">Bi-directional Duplex Stream</span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONFIGURATION GRID (Bento Architecture) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* COLUMN 1: CREDENTIALS & ELASTIC SIP TRUNKING (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* 1. Twilio Authentication & Credential Vault */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">key</span>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Twilio Authentication &amp; Credential Vault
                </h2>
              </div>
              <span className="px-2 py-0.5 bg-surface-container text-tertiary border border-tertiary/30 rounded text-[11px] font-mono-code">
                Vault Encrypted
              </span>
            </div>

            <div className="space-y-3">
              {/* Account SID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono-code text-outline uppercase">TWILIO ACCOUNT SID</label>
                  <span className="text-xs font-mono-code text-tertiary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Validated
                  </span>
                </div>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5">
                  <input
                    type={showSid ? 'text' : 'password'}
                    value={accountSid}
                    onChange={(e) => setAccountSid(e.target.value)}
                    className="bg-transparent text-on-surface font-mono-code text-xs w-full focus:outline-none tracking-wide"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(accountSid);
                      addNotification('Account SID Copied', 'Copied to clipboard.', 'info');
                    }}
                    className="text-outline hover:text-on-surface p-1 transition-colors"
                    title="Copy Account SID"
                  >
                    <span className="material-symbols-outlined text-sm">content_copy</span>
                  </button>
                  <button
                    onClick={() => setShowSid(!showSid)}
                    className="text-outline hover:text-on-surface p-1 transition-colors"
                    title="Toggle Visibility"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showSid ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Auth Token / API Key SID */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono-code text-outline uppercase">
                    API KEY SECRET / AUTH TOKEN
                  </label>
                  <button
                    onClick={handleRotateKey}
                    className="text-[11px] text-secondary hover:underline flex items-center gap-1 font-mono-code"
                  >
                    <span className="material-symbols-outlined text-xs">restart_alt</span> Rotate Key
                  </button>
                </div>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="bg-transparent text-on-surface font-mono-code text-xs w-full focus:outline-none"
                  />
                  <span className="px-2 py-0.5 bg-surface-container-high text-tertiary text-[10px] font-mono-code rounded mr-2">
                    Active
                  </span>
                  <button
                    onClick={() => setShowToken(!showToken)}
                    className="text-outline hover:text-on-surface p-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showToken ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Twilio Edge Location Selector */}
              <div>
                <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">
                  TWILIO EDGE LOCATION (SIG / MEDIA ROUTING)
                </label>
                <div className="grid grid-cols-4 gap-1.5 mt-1 font-mono-code">
                  {(['Ashburn', 'Oregon', 'Frankfurt', 'Tokyo'] as const).map((loc) => {
                    const isSelected = selectedEdge === loc;
                    return (
                      <button
                        key={loc}
                        onClick={() => setSelectedEdge(loc)}
                        className={`p-1.5 border rounded text-center transition-all ${
                          isSelected
                            ? 'bg-surface-container-high border-secondary text-secondary'
                            : 'bg-surface-container-lowest border-outline-variant text-outline hover:text-on-surface'
                        }`}
                      >
                        <span className="block text-xs font-bold">{loc}</span>
                        <span className="text-[10px] text-tertiary">{edgePings[loc]} ms</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Failover Credential Toggle */}
              <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
                <div>
                  <span className="block text-on-surface font-medium">Secondary Failover Subaccount</span>
                  <span className="text-[11px] text-outline">Automated switch on 503 Carrier Trunk Failure</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="text-secondary focus:ring-secondary rounded"
                />
              </div>
            </div>
          </div>

          {/* 2. Elastic SIP Trunking & Signaling Setup */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">cable</span>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Elastic SIP Trunking &amp; Signaling Setup
                </h2>
              </div>
              <span className="text-xs font-mono-code text-secondary font-bold">TLS / SRTP v1.3</span>
            </div>

            <div className="space-y-3">
              {/* Termination URI */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono-code text-outline uppercase">
                    SIP TRUNK TERMINATION URI
                  </label>
                  <span className="text-xs font-mono-code text-tertiary">SRTP Enforced</span>
                </div>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 font-mono-code text-xs">
                  <span className="text-outline mr-1.5">sip:</span>
                  <input
                    type="text"
                    defaultValue={twilioConfig.terminationUri}
                    className="bg-transparent text-secondary w-full focus:outline-none"
                  />
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface text-[10px] rounded">
                    PORT 5061
                  </span>
                </div>
              </div>

              {/* Originating PBX URI */}
              <div>
                <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">
                  ORIGINATING SIP URI / PBX INBOUND
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 font-mono-code text-xs">
                  <input
                    type="text"
                    defaultValue={twilioConfig.originatingUri}
                    className="bg-transparent text-on-surface w-full focus:outline-none"
                  />
                  <span className="material-symbols-outlined text-tertiary text-sm">verified</span>
                </div>
              </div>

              {/* Voice Codec Prioritization list */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono-code text-outline uppercase">
                    VOICE CODEC NEGOTIATION PRIORITY
                  </label>
                  <span className="text-[10px] text-outline">Priority Order</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-outline-variant text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code font-bold text-on-surface">1. Opus (Wideband 48kHz HD)</span>
                      <span className="px-1.5 py-0.2 bg-secondary/10 border border-secondary/30 text-secondary text-[10px] rounded font-mono-code">
                        AI Optimized
                      </span>
                    </div>
                    <span className="text-[11px] font-mono-code text-outline">48 kbps</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-outline-variant text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code font-bold text-on-surface">2. G.711u (PCMU 8kHz)</span>
                      <span className="px-1.5 py-0.2 bg-surface-container-high text-on-surface-variant text-[10px] rounded font-mono-code">
                        PSTN Standard
                      </span>
                    </div>
                    <span className="text-[11px] font-mono-code text-outline">64 kbps</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-surface-container border border-outline-variant text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-code font-bold text-on-surface">3. G.729a (Low Bandwidth)</span>
                      <span className="px-1.5 py-0.2 bg-surface-container-high text-on-surface-variant text-[10px] rounded font-mono-code">
                        Fallback
                      </span>
                    </div>
                    <span className="text-[11px] font-mono-code text-outline">8 kbps</span>
                  </div>
                </div>
              </div>

              {/* Symmetric RTP & Attestation Mapping */}
              <div className="pt-2 border-t border-outline-variant/60 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-1.5 rounded bg-surface-container-lowest border border-outline-variant">
                  <span className="material-symbols-outlined text-tertiary text-sm">check_circle</span>
                  <span className="text-on-surface">Symmetric RTP NAT</span>
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded bg-surface-container-lowest border border-outline-variant">
                  <span className="material-symbols-outlined text-tertiary text-sm">verified_user</span>
                  <span className="text-on-surface truncate">STIR/SHAKEN A-Attest</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2 & 3: MEDIA STREAMS & TELEPHONY LOGS & DIDs (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* 3. Twilio Media Streams (Voice AI & Real-time Bot Audio Webhooks) */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">sensors</span>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Twilio Media Streams (Voice AI &amp; Bot Audio Bridging)
                </h2>
              </div>
              <span className="px-2 py-0.5 bg-secondary/15 border border-secondary/40 text-secondary rounded text-[10px] font-mono-code font-bold">
                v1.MediaStream WebSocket
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Inbound WebSocket URI */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-mono-code text-outline uppercase">
                    BI-DIRECTIONAL AUDIO FORKING WEBSOCKET ENDPOINT
                  </label>
                  <span className="text-[10px] font-mono-code text-tertiary">TLS 1.3 WSS Active</span>
                </div>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 font-mono-code">
                  <span className="text-secondary mr-2">wss://</span>
                  <input
                    type="text"
                    defaultValue={twilioConfig.mediaStreamWss}
                    className="bg-transparent text-on-surface w-full focus:outline-none"
                  />
                  <span className="material-symbols-outlined text-tertiary text-sm">bolt</span>
                </div>
              </div>

              {/* Audio Chunking */}
              <div className="p-2.5 bg-surface-container-lowest border border-outline-variant rounded">
                <span className="block text-[10px] font-mono-code text-outline uppercase mb-1">
                  REAL-TIME AUDIO CHUNKING
                </span>
                <div className="flex items-baseline justify-between font-mono-code">
                  <span className="font-bold text-on-surface">20ms Frame Buffer</span>
                  <span className="text-secondary">160 samples</span>
                </div>
                <p className="text-[11px] text-outline mt-1">mulaw 8kHz &amp; 16kHz linear PCM downsampling</p>
              </div>

              {/* Dual Channel Forking */}
              <div className="p-2.5 bg-surface-container-lowest border border-outline-variant rounded flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code text-outline uppercase">DUAL-CHANNEL FORKING</span>
                  <span className="px-1.5 py-0.2 bg-tertiary/10 text-tertiary text-[10px] rounded font-mono-code font-bold">
                    Enabled
                  </span>
                </div>
                <div className="text-[11px] font-mono-code text-on-surface-variant mt-1">
                  <div>Track 1: Inbound Customer Voice</div>
                  <div>Track 2: Outbound AI Bot / Agent TTS</div>
                </div>
              </div>

              {/* TwiML Voice Webhook URL */}
              <div className="md:col-span-2">
                <label className="text-[10px] font-mono-code text-outline uppercase block mb-1">
                  TWIML BIN &amp; VOICE INBOUND WEBHOOK URL
                </label>
                <div className="flex items-center bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1.5 font-mono-code">
                  <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface text-[10px] rounded mr-2">
                    HTTP POST
                  </span>
                  <input
                    type="text"
                    defaultValue={twilioConfig.twimlWebhookUrl}
                    className="bg-transparent text-on-surface w-full focus:outline-none"
                  />
                  <span className="text-tertiary text-[11px] mr-2">Fallback 200 OK</span>
                </div>
              </div>
            </div>

            {/* Redaction switch */}
            <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-base">lock</span>
                <div>
                  <span className="text-on-surface font-medium">Dual-Tone Multi-Frequency (DTMF) &amp; PCI-DSS Redaction</span>
                  <span className="block text-[11px] text-outline">
                    Mutes audio packet stream during sensitive payment/SSN cardholder data transmission
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="text-secondary focus:ring-secondary rounded"
              />
            </div>
          </div>

          {/* 5. Twilio Voice Diagnostic Telemetry & Error Log Stream */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">terminal</span>
                <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Twilio Voice Diagnostics &amp; Live Packet Telemetry
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono-code">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span className="text-on-surface-variant">Live Console</span>
              </div>
            </div>

            {/* Packet Health Widget Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest p-2.5 rounded border border-outline-variant text-xs font-mono-code">
              <div>
                <span className="text-outline block text-[10px]">NETWORK JITTER</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-bold text-on-surface">1.2</span>
                  <span className="text-outline">ms</span>
                </div>
                <span className="text-tertiary text-[10px]">Optimal (&lt;5ms)</span>
              </div>
              <div>
                <span className="text-outline block text-[10px]">PACKET LOSS</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-bold text-on-surface">0.01</span>
                  <span className="text-outline">%</span>
                </div>
                <span className="text-tertiary text-[10px]">0 frames dropped</span>
              </div>
              <div>
                <span className="text-outline block text-[10px]">MEAN OPINION SCORE (MOS)</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-base font-bold text-tertiary">4.38</span>
                  <span className="text-outline">/ 5.0</span>
                </div>
                <span className="text-tertiary text-[10px]">Carrier Grade HD</span>
              </div>
            </div>

            {/* Terminal Log Stream */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-2.5 font-mono-code text-[11px] space-y-1.5 max-h-32 overflow-y-auto">
              <div className="flex items-center gap-2 text-on-surface-variant p-0.5 rounded">
                <span className="text-outline">14:38:12</span>
                <span className="px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded text-[10px]">200 OK</span>
                <span className="text-on-surface truncate">INVITE sip:trunk@ashburn.pstn.twilio.com (SDP Codec: Opus/48000)</span>
                <span className="text-tertiary ml-auto shrink-0">16ms RTT</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant p-0.5 rounded">
                <span className="text-outline">14:35:40</span>
                <span className="px-1.5 py-0.2 bg-secondary/15 text-secondary rounded text-[10px]">WS CONN</span>
                <span className="text-on-surface truncate">Twilio MediaStream WebSocket Connected: StreamSid MZ8f910...</span>
                <span className="text-outline ml-auto shrink-0">Track: Dual</span>
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant p-0.5 rounded">
                <span className="text-outline">14:21:02</span>
                <span className="px-1.5 py-0.2 bg-tertiary/10 text-tertiary rounded text-[10px]">200 OK</span>
                <span className="text-on-surface truncate">STIR/SHAKEN Attestation Header: 'Identity: ...;alg=ES256' verified</span>
                <span className="text-tertiary ml-auto shrink-0">Level-A</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TWILIO PHONE NUMBERS (DID) & POOL INVENTORY MANAGER */}
      <section className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-outline-variant/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-base">pin</span>
            <div>
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                Twilio Phone Numbers (DID) &amp; Inbound Campaign Pool
              </h2>
              <span className="text-xs text-outline font-mono-code">
                Provisioned telecommunications assets mapped to automated queues and dynamic SIP routing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-2 text-outline text-sm">
                filter_list
              </span>
              <input
                value={didSearch}
                onChange={(e) => setDidSearch(e.target.value)}
                className="bg-surface-container-lowest border border-outline-variant text-on-surface placeholder:text-outline text-xs pl-8 pr-3 py-1 rounded focus:outline-none focus:border-secondary w-56 font-mono-code"
                placeholder="Filter by number or campaign..."
                type="text"
              />
            </div>
            <button
              onClick={() => addNotification('Twilio Console Sync', 'Synchronized DID catalog with Twilio carrier portal.', 'info')}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface rounded transition-colors"
            >
              <span className="material-symbols-outlined text-sm">cloud_download</span>
              <span>Import from Console</span>
            </button>
            <button
              onClick={() => setIsBuyNumberOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-secondary text-on-secondary font-bold rounded hover:bg-secondary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              <span>Buy Twilio Number</span>
            </button>
          </div>
        </div>

        {/* DID Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-outline-variant text-[11px] font-mono-code text-outline uppercase tracking-wider">
                <th className="py-2 px-3 font-semibold">PHONE NUMBER (DID)</th>
                <th className="py-2 px-3 font-semibold">TYPE</th>
                <th className="py-2 px-3 font-semibold">ASSIGNED CAMPAIGN / ACD</th>
                <th className="py-2 px-3 font-semibold">TWILIO FRIENDLY NAME</th>
                <th className="py-2 px-3 font-semibold">CAPABILITIES &amp; REPUTATION</th>
                <th className="py-2 px-3 font-semibold">STATUS</th>
                <th className="py-2 px-3 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 font-body-sm">
              {filteredDids.map((did) => (
                <tr key={did.id} className="hover:bg-surface-container-high/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono-code font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-sm">call</span>
                    {did.number}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-surface-container-high text-secondary rounded text-[11px] font-mono-code">
                      {did.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-on-surface">{did.assignedCampaign}</td>
                  <td className="py-2.5 px-3 text-outline truncate max-w-[180px]">{did.friendlyName}</td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono-code">
                      {did.capabilities.voice && (
                        <span className="px-1.5 py-0.2 bg-surface-container text-on-surface-variant rounded">Voice</span>
                      )}
                      {did.capabilities.sms && (
                        <span className="px-1.5 py-0.2 bg-surface-container text-on-surface-variant rounded">SMS</span>
                      )}
                      {did.capabilities.mediaStream && (
                        <span className="px-1.5 py-0.2 bg-secondary/15 text-secondary rounded">MediaStream</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-tertiary/10 text-tertiary rounded text-[10px] font-mono-code font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> {did.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-outline">
                      <button
                        onClick={() => releaseDid(did.id)}
                        className="p-1 hover:text-error hover:bg-surface-container rounded transition-colors"
                        title="Release Number"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
