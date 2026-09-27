import React, { useMemo, useState } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { LiveAgent, QoSThresholdConfig } from '../../types/telephony';

export const LiveOperationsView: React.FC = () => {
  const {
    agents,
    setSupervisorAction,
    setActiveTab,
    addNotification,
    userRole,
    qosThresholds,
    updateQoSThresholds,
    triggerNetworkQualitySpike,
    resolveNetworkSpike,
    applyQoSAutoMitigation,
  } = useTelephony();

  const [agentFilter, setAgentFilter] = useState<'all' | 'talking' | 'ready' | 'wrapup' | 'break'>('all');
  const [skillFilterModal, setSkillFilterModal] = useState(false);
  const [pacingModal, setPacingModal] = useState(false);
  const [surgeModal, setSurgeModal] = useState(false);
  const [pacingValue, setPacingValue] = useState(2.4);

  // Real-Time Audio QoS & Thresholds Monitor State
  const [qosThresholdModal, setQosThresholdModal] = useState<boolean>(false);
  const [inspectQoSAgent, setInspectQoSAgent] = useState<LiveAgent | null>(null);
  const [tempThresholds, setTempThresholds] = useState<QoSThresholdConfig>(qosThresholds);
  const [qosSessionFilter, setQosSessionFilter] = useState<'all' | 'degraded' | 'healthy'>('all');
  const [isAlertDismissed, setIsAlertDismissed] = useState<boolean>(false);

  // Active talking sessions with QoS telemetry
  const activeSessions = useMemo(() => {
    return agents.filter((a) => a.status === 'talking' && a.qos);
  }, [agents]);

  // Degraded sessions violating jitter or packet loss thresholds
  const degradedSessions = useMemo(() => {
    return activeSessions.filter(
      (a) => a.qos && (a.qos.severity === 'warning' || a.qos.severity === 'critical')
    );
  }, [activeSessions]);

  const criticalSessions = useMemo(() => {
    return activeSessions.filter((a) => a.qos?.severity === 'critical');
  }, [activeSessions]);

  // Network Averages
  const qosStats = useMemo(() => {
    const total = activeSessions.length;
    if (total === 0) {
      return { avgJitter: 0, avgPacketLoss: 0, avgMos: 4.4, complianceRate: 100 };
    }
    const sumJitter = activeSessions.reduce((acc, a) => acc + (a.qos?.jitterMs || 0), 0);
    const sumLoss = activeSessions.reduce((acc, a) => acc + (a.qos?.packetLossPercent || 0), 0);
    const sumMos = activeSessions.reduce((acc, a) => acc + (a.qos?.mosScore || 4.4), 0);
    const healthyCount = activeSessions.filter((a) => a.qos?.severity === 'normal').length;

    return {
      avgJitter: parseFloat((sumJitter / total).toFixed(1)),
      avgPacketLoss: parseFloat((sumLoss / total).toFixed(2)),
      avgMos: parseFloat((sumMos / total).toFixed(2)),
      complianceRate: Math.round((healthyCount / total) * 100),
    };
  }, [activeSessions]);

  const filteredQoSSessions = useMemo(() => {
    if (qosSessionFilter === 'degraded') {
      return degradedSessions;
    }
    if (qosSessionFilter === 'healthy') {
      return activeSessions.filter((a) => a.qos?.severity === 'normal');
    }
    return activeSessions;
  }, [activeSessions, degradedSessions, qosSessionFilter]);

  const filteredAgents = agents.filter((a) => {
    if (agentFilter === 'all') return true;
    return a.status === agentFilter;
  });

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIntercept = (type: 'listen' | 'whisper' | 'barge', agent: LiveAgent) => {
    if (userRole === 'agent') {
      addNotification('Permission Restricted', 'Floor intercept (Listen/Whisper/Barge) requires Supervisor or Admin privileges. Switch role in top header.', 'warning');
      return;
    }
    setSupervisorAction({ type, agent });
  };

  const handleAutoMitigateAll = () => {
    degradedSessions.forEach((agent) => {
      if (agent.qos?.warningType === 'jitter') {
        applyQoSAutoMitigation(agent.id, 'boost_buffer');
      } else if (agent.qos?.warningType === 'packet_loss') {
        applyQoSAutoMitigation(agent.id, 'switch_codec');
      } else {
        applyQoSAutoMitigation(agent.id, 'reroute_gateway');
      }
    });
    addNotification(
      'Automated SLA Remediation Dispatched',
      `Applied automated WebRTC buffer & gateway failover mitigations across ${degradedSessions.length} active sessions.`,
      'success'
    );
  };

  const handleSaveThresholds = () => {
    updateQoSThresholds(tempThresholds);
    setQosThresholdModal(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-surface-dim custom-scrollbar">
      {/* 2. Top Executive Telephony Pulse Bar */}
      <section className="w-full bg-surface-container-lowest border-b border-outline-variant p-3 lg:px-6 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Metric 1 */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase">
              <span>Total Active Calls</span>
              <span className="material-symbols-outlined text-secondary text-[16px]">call</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl lg:text-2xl font-bold font-mono-code text-on-surface">248</span>
              <span className="text-xs font-mono-code text-tertiary font-bold">+12/m</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1.5">
              <div className="bg-secondary h-full" style={{ width: '74%' }}></div>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase">
              <span>Inbound Waiting</span>
              <span className="material-symbols-outlined text-tertiary text-[16px]">ring_volume</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl lg:text-2xl font-bold font-mono-code text-on-surface">18</span>
              <span className="text-xs font-mono-code text-outline">Queue Depth</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1.5">
              <div className="bg-tertiary h-full" style={{ width: '35%' }}></div>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase">
              <span>Outbound Connected</span>
              <span className="material-symbols-outlined text-primary text-[16px]">phone_forwarded</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl lg:text-2xl font-bold font-mono-code text-on-surface">176</span>
              <span className="text-xs font-mono-code text-primary">Lines Live</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1.5">
              <div className="bg-primary h-full" style={{ width: '82%' }}></div>
            </div>
          </div>

          {/* Metric 4 */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase">
              <span>Abandonment Rate</span>
              <span className="material-symbols-outlined text-tertiary text-[16px]">phone_missed</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl lg:text-2xl font-bold font-mono-code text-tertiary">1.8%</span>
              <span className="text-xs font-mono-code text-outline">Target &lt;3%</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1.5">
              <div className="bg-tertiary h-full" style={{ width: '45%' }}></div>
            </div>
          </div>

          {/* Metric 5 */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase">
              <span>Avg Speed Answer</span>
              <span className="material-symbols-outlined text-secondary text-[16px]">speed</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl lg:text-2xl font-bold font-mono-code text-on-surface">
                14<span className="text-sm font-normal text-on-surface-variant">s</span>
              </span>
              <span className="text-xs font-mono-code text-tertiary">SLA Safe</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1.5">
              <div className="bg-secondary h-full" style={{ width: '28%' }}></div>
            </div>
          </div>

          {/* Metric 6 */}
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div className="flex items-center justify-between text-outline text-label-sm font-label-sm uppercase">
              <span>Agent Occupancy</span>
              <span className="material-symbols-outlined text-secondary text-[16px]">pie_chart</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl lg:text-2xl font-bold font-mono-code text-on-surface">88.4%</span>
              <span className="text-xs font-mono-code text-outline">Opt. 85-90%</span>
            </div>
            <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1.5">
              <div className="bg-secondary h-full" style={{ width: '88%' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* ⚠️ Real-Time Audio Quality SLA Warning Banner */}
      {degradedSessions.length > 0 && !isAlertDismissed && (
        <aside
          role="alert"
          aria-live="assertive"
          className="mx-3 lg:mx-6 mt-3 p-3.5 rounded-lg border border-error/50 bg-gradient-to-r from-error/15 via-surface-container-high to-surface-container-low shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-start md:items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-error/20 border border-error/40 flex items-center justify-center text-error shrink-0 animate-pulse">
              <span className="material-symbols-outlined text-xl">network_check</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-error text-on-error uppercase tracking-wider">
                  ⚠️ VoIP Stream Degradation Alert
                </span>
                <span className="text-xs font-mono-code text-error font-bold">
                  {degradedSessions.length} Active Session{degradedSessions.length > 1 ? 's' : ''} Exceeding Thresholds
                </span>
                {criticalSessions.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-error-container text-error border border-error animate-pulse">
                    {criticalSessions.length} CRITICAL
                  </span>
                )}
              </div>
              <p className="text-xs text-on-surface mt-1 leading-snug">
                Call jitter or packet loss has exceeded configured thresholds (Jitter &gt; {qosThresholds.jitterWarningMs}ms, Loss &gt; {qosThresholds.packetLossWarningPercent}%). Audio distortion or packet drops detected on active floor sessions.
              </p>
              {/* Degraded session pills */}
              <div className="flex flex-wrap gap-2 mt-2">
                {degradedSessions.map((agent) => (
                  <span
                    key={agent.id}
                    onClick={() => setInspectQoSAgent(agent)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-container-lowest border border-error/40 text-[11px] font-mono-code text-on-surface cursor-pointer hover:border-error hover:bg-surface-container transition-colors shadow-xs"
                    title="Click to inspect audio telemetry diagnostics"
                  >
                    <span className="font-bold text-error">{agent.name}</span>
                    <span className="text-outline">•</span>
                    <span className={agent.qos?.jitterMs && agent.qos.jitterMs >= qosThresholds.jitterWarningMs ? 'text-error font-bold' : 'text-outline'}>
                      Jitter: {agent.qos?.jitterMs}ms
                    </span>
                    <span className="text-outline">•</span>
                    <span className={agent.qos?.packetLossPercent && agent.qos.packetLossPercent >= qosThresholds.packetLossWarningPercent ? 'text-error font-bold' : 'text-outline'}>
                      Loss: {agent.qos?.packetLossPercent}%
                    </span>
                    <span className="text-outline">•</span>
                    <span className="text-secondary underline text-[10px] font-bold">Inspect Stream</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={handleAutoMitigateAll}
              className="px-3 py-1.5 rounded bg-error text-on-error hover:bg-error/90 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-sm">auto_fix_high</span>
              <span>Auto-Mitigate All ({degradedSessions.length})</span>
            </button>
            <button
              onClick={() => setIsAlertDismissed(true)}
              className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded transition-colors"
              title="Dismiss warning banner"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Operational Grid */}
      <div className="p-3 lg:p-6 space-y-6">
        {/* Section: Active Campaign Matrix */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">hub</span>
              <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight">
                Active Campaign Matrix
              </h2>
              <span className="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container-high border border-outline-variant text-outline">
                4 Active Queues
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSkillFilterModal(true)}
                className="px-2.5 py-1 rounded bg-surface-container border border-outline-variant text-on-surface-variant hover:text-on-surface text-label-sm font-label-sm flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">tune</span>
                Filter Skillgroups
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Inbound Card 1: Tier 1 Customer Care & Support */}
            <div className="p-4 rounded bg-surface-container-low border border-outline-variant hover:border-secondary transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-label-sm font-mono-code text-secondary bg-surface-container border border-secondary/30">
                      INBOUND ACD
                    </span>
                    <h3 className="text-body-lg font-headline-sm font-bold text-on-surface mt-1 leading-tight">
                      Tier 1 Customer Care &amp; Support
                    </h3>
                  </div>
                  <span className="flex items-center gap-1 text-tertiary text-label-sm font-label-sm bg-surface-container px-2 py-1 rounded border border-tertiary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary status-pulse"></span>
                    STABLE
                  </span>
                </div>

                {/* Telemetry Stats Grid */}
                <div className="grid grid-cols-2 gap-2 my-3 py-2 border-y border-outline-variant/60">
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Queue Size</div>
                    <div className="text-headline-sm font-mono-code font-bold text-on-surface">
                      14 <span className="text-body-sm font-normal text-outline">callers</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Est Wait Time</div>
                    <div className="text-headline-sm font-mono-code font-bold text-secondary">42s</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Service Level</div>
                    <div className="text-body-md font-mono-code font-bold text-tertiary">
                      92.4% <span className="text-label-sm font-normal text-outline">in 20s</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Agents Logged</div>
                    <div className="text-body-md font-mono-code font-bold text-on-surface">32</div>
                  </div>
                </div>

                {/* Agent Status Breakdown Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-label-sm font-mono-code text-outline mb-1">
                    <span>24 Talking</span>
                    <span>5 Ready</span>
                    <span>3 Wrap-up</span>
                  </div>
                  <div className="w-full h-2 rounded bg-surface-container overflow-hidden flex">
                    <div className="bg-tertiary h-full" style={{ width: '75%' }} title="24 Talking"></div>
                    <div className="bg-secondary h-full" style={{ width: '15.6%' }} title="5 Ready"></div>
                    <div className="bg-surface-variant h-full" style={{ width: '9.4%' }} title="3 Wrap-up"></div>
                  </div>
                </div>

                {/* Audio Spike Sparkline / Waveform Simulation */}
                <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant/40 mb-3">
                  <div className="flex justify-between items-center text-label-sm font-mono-code text-outline mb-1.5">
                    <span>Voice Stream Concurrency</span>
                    <span className="text-secondary">48.2 kHz SIP</span>
                  </div>
                  <div className="flex items-end h-8 gap-0.5">
                    {[2, 4, 6, 5, 7, 8, 4, 5, 3, 6, 7, 5, 6, 3, 2].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 ${h >= 7 ? 'bg-tertiary' : h >= 4 ? 'bg-secondary' : 'bg-outline-variant'}`}
                        style={{ height: `${h * 4}px` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setSkillFilterModal(true)}
                  className="flex-1 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  Adjust Skill Priority
                </button>
                <button
                  onClick={() => setSurgeModal(true)}
                  className="flex-1 py-1.5 px-2 rounded bg-surface-container hover:bg-secondary hover:text-on-secondary border border-secondary/40 text-label-sm font-label-md text-secondary transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">alt_route</span>
                  Surge Overflow Route
                </button>
              </div>
            </div>

            {/* Inbound Card 2: VIP Escalations & Retention */}
            <div className="p-4 rounded bg-surface-container-low border border-outline-variant hover:border-secondary transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-label-sm font-mono-code text-primary bg-surface-container border border-primary/30">
                      PRIORITY INBOUND
                    </span>
                    <h3 className="text-body-lg font-headline-sm font-bold text-on-surface mt-1 leading-tight">
                      VIP Escalations &amp; Retention
                    </h3>
                  </div>
                  <span className="flex items-center gap-1 text-tertiary text-label-sm font-label-sm bg-surface-container px-2 py-1 rounded border border-tertiary/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                    OPTIMAL
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 py-2 border-y border-outline-variant/60">
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Queue Size</div>
                    <div className="text-headline-sm font-mono-code font-bold text-on-surface">
                      2 <span className="text-body-sm font-normal text-outline">callers</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Service Level SLA</div>
                    <div className="text-headline-sm font-mono-code font-bold text-tertiary">98.1%</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Dedicated Agents</div>
                    <div className="text-body-md font-mono-code font-bold text-on-surface">12 Assigned</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Abandonments Today</div>
                    <div className="text-body-md font-mono-code font-bold text-tertiary">0 (Zero)</div>
                  </div>
                </div>

                <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/50 space-y-2 mb-3">
                  <div className="flex justify-between items-center text-label-sm font-mono-code">
                    <span className="text-outline">Caller 1: Enterprise Account</span>
                    <span className="text-tertiary">Wait: 00:08</span>
                  </div>
                  <div className="flex justify-between items-center text-label-sm font-mono-code">
                    <span className="text-outline">Caller 2: Partner Tier A</span>
                    <span className="text-secondary">Wait: 00:15</span>
                  </div>
                  <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden mt-1">
                    <div className="bg-tertiary h-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    const agent = agents.find((a) => a.skills.includes('Escalations')) || agents[0];
                    handleIntercept('listen', agent);
                  }}
                  className="w-full py-1.5 px-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">headset_mic</span>
                  Direct Supervisor Monitor
                </button>
              </div>
            </div>

            {/* Outbound Card 1: Q3 Enterprise SaaS Renewals */}
            <div className="p-4 rounded bg-surface-container-low border border-outline-variant hover:border-secondary transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-label-sm font-mono-code text-secondary bg-surface-container border border-secondary/30">
                      PREDICTIVE DIALER
                    </span>
                    <h3 className="text-body-lg font-headline-sm font-bold text-on-surface mt-1 leading-tight">
                      Q3 Enterprise SaaS Renewals
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-label-sm font-mono-code bg-tertiary/10 border border-tertiary/40 text-tertiary">
                    DIALING (OPTIMIZED)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 py-2 border-y border-outline-variant/60">
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Pacing Ratio</div>
                    <div className="text-headline-sm font-mono-code font-bold text-secondary">{pacingValue}x</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Connect Rate</div>
                    <div className="text-headline-sm font-mono-code font-bold text-on-surface">44.2%</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Dialed / Leads Left</div>
                    <div className="text-body-md font-mono-code font-bold text-on-surface">
                      3,420 <span className="text-label-sm font-normal text-outline">/ 1,840</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Drop Rate (FCC Safe)</div>
                    <div className="text-body-md font-mono-code font-bold text-tertiary">
                      1.1% <span className="text-label-sm font-normal text-outline">&lt;3%</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[18px]">group</span>
                    <span className="text-label-md font-label-md text-on-surface">18 Active Agents</span>
                  </div>
                  <span className="text-label-sm font-mono-code text-tertiary">Pacing Auto-Tuned</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setPacingModal(true)}
                  className="flex-1 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  Adjust Pacing
                </button>
                <button
                  onClick={() => addNotification('Queue Paused', 'Q3 SaaS Renewal pacing temporarily paused.', 'warning')}
                  className="py-1.5 px-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">pause</span>
                </button>
              </div>
            </div>

            {/* Outbound Card 2: Mortgage Pre-Approval Warm Leads */}
            <div className="p-4 rounded bg-surface-container-low border border-outline-variant hover:border-secondary transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-label-sm font-mono-code text-primary bg-surface-container border border-primary/30">
                      PROGRESSIVE / PREVIEW
                    </span>
                    <h3 className="text-body-lg font-headline-sm font-bold text-on-surface mt-1 leading-tight">
                      Mortgage Pre-Approval Warm Leads
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded text-label-sm font-mono-code bg-secondary/10 border border-secondary/40 text-secondary">
                    RUNNING
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 py-2 border-y border-outline-variant/60">
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Connect Rate</div>
                    <div className="text-headline-sm font-mono-code font-bold text-tertiary">58.7%</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Conversion Rate</div>
                    <div className="text-headline-sm font-mono-code font-bold text-secondary">18.2%</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Assigned Agents</div>
                    <div className="text-body-md font-mono-code font-bold text-on-surface">14 Live</div>
                  </div>
                  <div>
                    <div className="text-outline text-label-sm font-label-sm">Pacing Mode</div>
                    <div className="text-body-md font-mono-code font-bold text-outline">Preview (30s)</div>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant/40 mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[18px]">verified</span>
                    <span className="text-label-md font-label-md text-on-surface">High Intent Batch</span>
                  </div>
                  <span className="text-label-sm font-mono-code text-tertiary">38 Closed Today</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="flex-1 py-1.5 px-2 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                  Preview Queue List
                </button>
                <button
                  onClick={() => addNotification('Queue Paused', 'Mortgage Pre-Approval queue paused.', 'warning')}
                  className="py-1.5 px-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">pause</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Call Jitter & Packet Loss Quality Monitor */}
        <section className="p-4 rounded-lg bg-surface-container-low border border-outline-variant space-y-4 shadow-sm">
          {/* Section Header & Operational Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-outline-variant/60 pb-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-lg">graphic_eq</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight">
                    Real-Time VoIP Audio Quality &amp; Jitter / Packet Loss Monitor
                  </h2>
                  {degradedSessions.length > 0 ? (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-error-container text-error border border-error/40 flex items-center gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-xs">warning</span>
                      <span>{degradedSessions.length} SESSIONS DEGRADED</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                      <span>ALL SESSIONS SLA NOMINAL</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Sub-second RTP stream telemetry, jitter buffer metrics, packet loss detection, and visual threshold warnings for live sessions.
                </p>
              </div>
            </div>

            {/* Threshold & Simulation Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setTempThresholds(qosThresholds);
                  setQosThresholdModal(true);
                }}
                className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                title="Configure Jitter and Packet Loss SLA Alert Thresholds"
              >
                <span className="material-symbols-outlined text-sm text-secondary">tune</span>
                <span>Thresholds: Jitter &gt;{qosThresholds.jitterWarningMs}ms | Loss &gt;{qosThresholds.packetLossWarningPercent}%</span>
              </button>

              <button
                onClick={() => triggerNetworkQualitySpike('agent-5', 'jitter')}
                className="px-2.5 py-1.5 rounded bg-surface-container hover:bg-error-container/30 border border-error/30 text-error text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Simulate high jitter spike (+54.8ms) on Marcus Vance"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                <span>Simulate Jitter Spike</span>
              </button>

              <button
                onClick={() => triggerNetworkQualitySpike('agent-7', 'packet_loss')}
                className="px-2.5 py-1.5 rounded bg-surface-container hover:bg-error-container/30 border border-error/30 text-error text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Simulate severe packet loss (+4.95%) on Liam Gallagher"
              >
                <span className="material-symbols-outlined text-sm">wifi_off</span>
                <span>Simulate Packet Loss Spike</span>
              </button>

              <button
                onClick={() => {
                  activeSessions.forEach((a) => resolveNetworkSpike(a.id));
                  setIsAlertDismissed(false);
                }}
                className="px-2.5 py-1.5 rounded bg-tertiary/10 hover:bg-tertiary hover:text-on-tertiary border border-tertiary/40 text-tertiary text-xs font-semibold flex items-center gap-1 transition-all"
                title="Reset all active sessions to nominal low-jitter & zero-loss state"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Normalize All</span>
              </button>
            </div>
          </div>

          {/* QoS Telemetry Pulse Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* 1. Active VoIP Streams */}
            <div className="p-3 bg-surface-container border border-outline-variant/60 rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase tracking-wider">
                ACTIVE RTP AUDIO STREAMS
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-on-surface">
                  {activeSessions.length} Streams
                </span>
                <span className="text-[10px] font-mono-code text-secondary font-bold">Live Floor</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Opus 48kHz HD &bull; SIP RTP</div>
            </div>

            {/* 2. Network Average Jitter */}
            <div className="p-3 bg-surface-container border border-outline-variant/60 rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase tracking-wider">
                AVG CALL JITTER
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl font-bold font-mono-code ${
                    qosStats.avgJitter >= qosThresholds.jitterCriticalMs
                      ? 'text-error'
                      : qosStats.avgJitter >= qosThresholds.jitterWarningMs
                      ? 'text-[#f59e0b]'
                      : 'text-tertiary'
                  }`}
                >
                  {qosStats.avgJitter} ms
                </span>
                <span
                  className={`text-[10px] font-mono-code font-bold ${
                    qosStats.avgJitter >= qosThresholds.jitterWarningMs ? 'text-error' : 'text-tertiary'
                  }`}
                >
                  {qosStats.avgJitter >= qosThresholds.jitterWarningMs ? 'ELEVATED' : 'NOMINAL'}
                </span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full ${
                    qosStats.avgJitter >= qosThresholds.jitterWarningMs ? 'bg-error' : 'bg-tertiary'
                  }`}
                  style={{ width: `${Math.min(100, (qosStats.avgJitter / qosThresholds.jitterCriticalMs) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-mono-code text-outline mt-1">
                <span>Threshold: &lt;{qosThresholds.jitterWarningMs}ms</span>
                <span>Crit: &gt;{qosThresholds.jitterCriticalMs}ms</span>
              </div>
            </div>

            {/* 3. Network Average Packet Loss */}
            <div className="p-3 bg-surface-container border border-outline-variant/60 rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase tracking-wider">
                AVG PACKET LOSS
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl font-bold font-mono-code ${
                    qosStats.avgPacketLoss >= qosThresholds.packetLossCriticalPercent
                      ? 'text-error'
                      : qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent
                      ? 'text-[#f59e0b]'
                      : 'text-tertiary'
                  }`}
                >
                  {qosStats.avgPacketLoss}%
                </span>
                <span
                  className={`text-[10px] font-mono-code font-bold ${
                    qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent ? 'text-error' : 'text-tertiary'
                  }`}
                >
                  {qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent ? 'DROPOUT RISK' : 'OPTIMAL'}
                </span>
              </div>
              <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-1.5">
                <div
                  className={`h-full ${
                    qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent ? 'bg-error' : 'bg-tertiary'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (qosStats.avgPacketLoss / qosThresholds.packetLossCriticalPercent) * 100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] font-mono-code text-outline mt-1">
                <span>Threshold: &lt;{qosThresholds.packetLossWarningPercent}%</span>
                <span>Crit: &gt;{qosThresholds.packetLossCriticalPercent}%</span>
              </div>
            </div>

            {/* 4. Mean Opinion Score (MOS) */}
            <div className="p-3 bg-surface-container border border-outline-variant/60 rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase tracking-wider">
                VOICE FIDELITY (MOS)
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl font-bold font-mono-code ${
                    qosStats.avgMos >= 4.0 ? 'text-secondary' : qosStats.avgMos >= 3.5 ? 'text-[#f59e0b]' : 'text-error'
                  }`}
                >
                  {qosStats.avgMos}
                  <span className="text-xs font-normal text-outline"> / 5.0</span>
                </span>
                <span className="text-[10px] font-mono-code text-secondary">
                  {qosStats.avgMos >= 4.2 ? 'Pristine HD' : qosStats.avgMos >= 3.8 ? 'Good' : 'Degraded'}
                </span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">ITU-T P.800 Algorithmic Scale</div>
            </div>

            {/* 5. Audio SLA Compliance */}
            <div className="p-3 bg-surface-container border border-outline-variant/60 rounded flex flex-col justify-between sm:col-span-2 xl:col-span-1">
              <span className="text-[10px] font-mono-code text-outline uppercase tracking-wider">
                AUDIO SLA CONFORMANCE
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl font-bold font-mono-code ${
                    qosStats.complianceRate >= 90 ? 'text-tertiary' : 'text-[#f59e0b]'
                  }`}
                >
                  {qosStats.complianceRate}%
                </span>
                <span className="text-[10px] font-mono-code text-outline">
                  {degradedSessions.length === 0 ? '0 SLA Violations' : `${degradedSessions.length} Warnings Active`}
                </span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Carrier Trunk Guarantee Target: 98%</div>
            </div>
          </div>

          {/* Subtab Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setQosSessionFilter('all')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  qosSessionFilter === 'all'
                    ? 'bg-secondary text-on-secondary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All Active Sessions ({activeSessions.length})
              </button>
              <button
                onClick={() => setQosSessionFilter('degraded')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  qosSessionFilter === 'degraded'
                    ? 'bg-error text-on-error shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xs">warning</span>
                <span>Degraded Sessions ({degradedSessions.length})</span>
              </button>
              <button
                onClick={() => setQosSessionFilter('healthy')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                  qosSessionFilter === 'healthy'
                    ? 'bg-tertiary text-on-tertiary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                SLA Optimal ({activeSessions.length - degradedSessions.length})
              </button>
            </div>

            <span className="text-[11px] font-mono-code text-outline">
              Polling Edge Gateway Every 1,000ms &bull; WebRTC Real-Time RTP
            </span>
          </div>

          {/* Active Audio Streams Table */}
          <div className="overflow-x-auto rounded border border-outline-variant/60 bg-surface-container-lowest">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container text-outline font-mono-code text-[11px] uppercase">
                  <th className="py-2.5 px-3">Live Agent &amp; Call Session</th>
                  <th className="py-2.5 px-3">Call Jitter (ms)</th>
                  <th className="py-2.5 px-3">Packet Loss (%)</th>
                  <th className="py-2.5 px-3">Voice Quality (MOS)</th>
                  <th className="py-2.5 px-3">Codec &amp; Edge Gateway</th>
                  <th className="py-2.5 px-3">Threshold Warning State</th>
                  <th className="py-2.5 px-3 text-right">QoS Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-body-sm">
                {filteredQoSSessions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-outline">
                      <span className="material-symbols-outlined text-2xl block mb-1 text-outline/60">
                        mic_none
                      </span>
                      <span>No active talking sessions match the selected filter.</span>
                    </td>
                  </tr>
                ) : (
                  filteredQoSSessions.map((agent) => {
                    const qos = agent.qos;
                    if (!qos) return null;

                    const isJitterDegraded = qos.jitterMs >= qosThresholds.jitterWarningMs;
                    const isJitterCrit = qos.jitterMs >= qosThresholds.jitterCriticalMs;
                    const isLossDegraded = qos.packetLossPercent >= qosThresholds.packetLossWarningPercent;
                    const isLossCrit = qos.packetLossPercent >= qosThresholds.packetLossCriticalPercent;
                    const isCrit = qos.severity === 'critical';
                    const isWarn = qos.severity === 'warning';

                    return (
                      <tr
                        key={agent.id}
                        className={`transition-colors ${
                          isCrit
                            ? 'bg-error/5 hover:bg-error/10 border-l-4 border-l-error'
                            : isWarn
                            ? 'bg-[#f59e0b]/5 hover:bg-[#f59e0b]/10 border-l-4 border-l-[#f59e0b]'
                            : 'hover:bg-surface-container'
                        }`}
                      >
                        {/* Agent & Participant */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-outline-variant shrink-0">
                              <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-tertiary border border-surface"></span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-on-surface text-xs">{agent.name}</span>
                                <span className="text-[10px] font-mono-code text-tertiary">
                                  ({formatTimer(agent.durationInState)})
                                </span>
                              </div>
                              <span className="text-[10px] text-outline block truncate max-w-[180px]">
                                {agent.callerName ? `Caller: ${agent.callerName}` : agent.campaign}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Call Jitter (ms) */}
                        <td className="py-2.5 px-3 font-mono-code">
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`font-bold text-sm ${
                                  isJitterCrit
                                    ? 'text-error font-extrabold'
                                    : isJitterDegraded
                                    ? 'text-[#f59e0b]'
                                    : 'text-tertiary'
                                }`}
                              >
                                {qos.jitterMs} ms
                              </span>
                              <span className="text-[9px] text-outline">
                                SLA &lt;{qosThresholds.jitterWarningMs}ms
                              </span>
                            </div>
                            <div className="w-28 bg-surface-container h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isJitterCrit ? 'bg-error' : isJitterDegraded ? 'bg-[#f59e0b]' : 'bg-tertiary'
                                }`}
                                style={{
                                  width: `${Math.min(100, (qos.jitterMs / qosThresholds.jitterCriticalMs) * 100)}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* Packet Loss (%) */}
                        <td className="py-2.5 px-3 font-mono-code">
                          <div className="space-y-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`font-bold text-sm ${
                                  isLossCrit
                                    ? 'text-error font-extrabold'
                                    : isLossDegraded
                                    ? 'text-[#f59e0b]'
                                    : 'text-tertiary'
                                }`}
                              >
                                {qos.packetLossPercent}%
                              </span>
                              <span className="text-[9px] text-outline">
                                SLA &lt;{qosThresholds.packetLossWarningPercent}%
                              </span>
                            </div>
                            <div className="w-28 bg-surface-container h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  isLossCrit ? 'bg-error' : isLossDegraded ? 'bg-[#f59e0b]' : 'bg-tertiary'
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (qos.packetLossPercent / qosThresholds.packetLossCriticalPercent) * 100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>

                        {/* MOS Voice Score */}
                        <td className="py-2.5 px-3 font-mono-code">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold text-xs ${
                                qos.mosScore >= 4.0
                                  ? 'text-secondary'
                                  : qos.mosScore >= 3.4
                                  ? 'text-[#f59e0b]'
                                  : 'text-error'
                              }`}
                            >
                              {qos.mosScore}
                            </span>
                            <span className="text-[10px] text-outline">
                              {qos.mosScore >= 4.2
                                ? 'Pristine'
                                : qos.mosScore >= 3.6
                                ? 'Acceptable'
                                : 'Distorted'}
                            </span>
                          </div>
                        </td>

                        {/* Codec & Edge Gateway */}
                        <td className="py-2.5 px-3 font-mono-code">
                          <span className="text-[11px] font-bold text-on-surface block truncate max-w-[130px]">
                            {qos.codec}
                          </span>
                          <span className="text-[10px] text-outline block truncate max-w-[130px]">
                            {qos.edgeGateway} &bull; {qos.bufferLatencyMs}ms buf
                          </span>
                        </td>

                        {/* Warning Status Badge */}
                        <td className="py-2.5 px-3">
                          {isCrit ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-error text-on-error border border-error animate-pulse flex items-center gap-1 w-fit shadow-xs">
                              <span className="material-symbols-outlined text-xs">error</span>
                              <span>CRITICAL SLA VIOLATION</span>
                            </span>
                          ) : isWarn ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">warning</span>
                              <span>
                                {qos.warningType === 'jitter'
                                  ? 'HIGH JITTER (>25ms)'
                                  : qos.warningType === 'packet_loss'
                                  ? 'PACKET LOSS (>2%)'
                                  : 'ELEVATED JITTER & LOSS'}
                              </span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              <span>SLA MET (OPTIMAL)</span>
                            </span>
                          )}
                          {qos.mitigationApplied && (
                            <span className="text-[9px] font-mono-code text-secondary block mt-0.5 truncate max-w-[170px]">
                              {qos.mitigationApplied}
                            </span>
                          )}
                        </td>

                        {/* Quick Remediation Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setInspectQoSAgent(agent)}
                              className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-[11px] font-semibold text-on-surface flex items-center gap-1 transition-colors"
                              title="Inspect Live Audio Waveform & RTP Diagnostics"
                            >
                              <span className="material-symbols-outlined text-xs text-secondary">analytics</span>
                              <span>Diagnostics</span>
                            </button>

                            {(isWarn || isCrit) && (
                              <button
                                onClick={() => applyQoSAutoMitigation(agent.id, 'boost_buffer')}
                                className="px-2 py-1 rounded bg-secondary text-on-secondary hover:bg-secondary/90 text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs"
                                title="Expand WebRTC jitter buffer by +40ms"
                              >
                                <span className="material-symbols-outlined text-xs">speed</span>
                                <span>Boost Buffer</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Live Agent Grid & Trunk Health Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Live Agent Floor Map / List (Takes 2 Columns on Desktop) */}
          <div className="xl:col-span-2 p-4 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
                  <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight">
                    Live Agent Floor Telemetry
                  </h3>
                  <span className="text-label-sm font-mono-code text-outline">
                    ({filteredAgents.length} Active Nodes Monitored)
                  </span>
                </div>

                {/* Agent Filter Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setAgentFilter('all')}
                    className={`px-2 py-0.5 rounded text-label-sm font-mono-code border transition-colors ${
                      agentFilter === 'all'
                        ? 'bg-surface-container-high border-outline text-on-surface'
                        : 'bg-surface-container border-transparent text-outline'
                    }`}
                  >
                    All (46)
                  </button>
                  <button
                    onClick={() => setAgentFilter('talking')}
                    className={`px-2 py-0.5 rounded text-label-sm font-mono-code border transition-colors ${
                      agentFilter === 'talking'
                        ? 'bg-tertiary/20 border-tertiary text-tertiary'
                        : 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                    }`}
                  >
                    Talking (28)
                  </button>
                  <button
                    onClick={() => setAgentFilter('ready')}
                    className={`px-2 py-0.5 rounded text-label-sm font-mono-code border transition-colors ${
                      agentFilter === 'ready'
                        ? 'bg-secondary/20 border-secondary text-secondary'
                        : 'bg-secondary/10 border-secondary/30 text-secondary'
                    }`}
                  >
                    Ready (11)
                  </button>
                  <button
                    onClick={() => setAgentFilter('wrapup')}
                    className={`px-2 py-0.5 rounded text-label-sm font-mono-code border transition-colors ${
                      agentFilter === 'wrapup'
                        ? 'bg-surface-container-highest border-outline text-on-surface'
                        : 'bg-surface-variant text-outline'
                    }`}
                  >
                    Wrap (5)
                  </button>
                  <button
                    onClick={() => setAgentFilter('break')}
                    className={`px-2 py-0.5 rounded text-label-sm font-mono-code border transition-colors ${
                      agentFilter === 'break'
                        ? 'bg-surface-container-highest border-outline text-on-surface'
                        : 'bg-surface-container-lowest text-outline'
                    }`}
                  >
                    Break (2)
                  </button>
                </div>
              </div>

              {/* Agent Rows */}
              <div className="space-y-2.5">
                {filteredAgents.map((agent) => {
                  const hasQos = agent.status === 'talking' && !!agent.qos;
                  const isCritQos = hasQos && agent.qos?.severity === 'critical';
                  const isWarnQos = hasQos && agent.qos?.severity === 'warning';

                  return (
                    <div
                      key={agent.id}
                      className={`p-2.5 rounded border flex flex-wrap items-center justify-between gap-3 transition-all ${
                        isCritQos
                          ? 'bg-error/10 border-error shadow-sm ring-1 ring-error/50'
                          : isWarnQos
                          ? 'bg-[#f59e0b]/10 border-[#f59e0b] shadow-xs'
                          : 'bg-surface-container border-outline-variant/60 hover:border-outline-variant'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 rounded bg-surface-container-high overflow-hidden border border-outline-variant shrink-0">
                          <img src={agent.avatarUrl} alt={agent.name} className="w-full h-full object-cover" />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-container ${
                              agent.status === 'talking'
                                ? 'bg-tertiary'
                                : agent.status === 'ready'
                                ? 'bg-secondary'
                                : agent.status === 'wrapup'
                                ? 'bg-surface-variant'
                                : 'bg-outline'
                            }`}
                          ></span>
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-body-md font-bold text-on-surface">{agent.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code border ${
                                agent.status === 'talking'
                                  ? 'bg-tertiary/15 text-tertiary border-tertiary/30'
                                  : agent.status === 'ready'
                                  ? 'bg-secondary/15 text-secondary border-secondary/30'
                                  : 'bg-surface-variant text-on-surface border-outline-variant'
                              }`}
                            >
                              {agent.status.toUpperCase()}
                            </span>
                            <span className="text-label-sm font-mono-code text-tertiary">
                              {formatTimer(agent.durationInState)}
                            </span>

                            {/* Live VoIP Audio QoS Metric & Warning Badge */}
                            {hasQos && agent.qos && (
                              <button
                                onClick={() => setInspectQoSAgent(agent)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold flex items-center gap-1 transition-all ${
                                  isCritQos
                                    ? 'bg-error text-on-error animate-pulse shadow-xs'
                                    : isWarnQos
                                    ? 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 hover:bg-[#f59e0b]/30'
                                    : 'bg-surface-container-high text-tertiary border border-tertiary/30 hover:bg-tertiary/20'
                                }`}
                                title="Click to inspect real-time call jitter and packet loss diagnostics"
                              >
                                <span className="material-symbols-outlined text-[12px]">
                                  {isCritQos ? 'error' : isWarnQos ? 'warning' : 'graphic_eq'}
                                </span>
                                <span>
                                  {isCritQos
                                    ? `CRITICAL QOS: ${agent.qos.jitterMs}ms / ${agent.qos.packetLossPercent}%`
                                    : isWarnQos
                                    ? `${agent.qos.warningType === 'jitter' ? `HIGH JITTER: ${agent.qos.jitterMs}ms` : agent.qos.warningType === 'packet_loss' ? `HIGH LOSS: ${agent.qos.packetLossPercent}%` : `DEGRADED: ${agent.qos.jitterMs}ms`}`
                                    : `QoS: ${agent.qos.jitterMs}ms • ${agent.qos.packetLossPercent}%`}
                                </span>
                              </button>
                            )}
                          </div>
                          <div className="text-label-sm text-outline flex items-center gap-1.5 mt-0.5">
                            {agent.callerName && (
                              <>
                                <span className="text-on-surface-variant">Caller: {agent.callerName}</span>
                                <span>•</span>
                              </>
                            )}
                            <span className="text-secondary font-mono-code truncate max-w-xs">{agent.campaign}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {agent.status === 'talking' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleIntercept('listen', agent)}
                            className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-label-sm font-label-md text-on-surface flex items-center gap-1 transition-colors"
                            title="Listen without participant awareness"
                          >
                            <span className="material-symbols-outlined text-[14px]">headphones</span>
                            <span>Listen</span>
                          </button>
                          <button
                            onClick={() => handleIntercept('whisper', agent)}
                            className="px-2 py-1 rounded bg-surface-container-high hover:bg-secondary hover:text-on-secondary border border-outline-variant text-label-sm font-label-md text-secondary flex items-center gap-1 transition-colors"
                            title="Audio injected to agent only"
                          >
                            <span className="material-symbols-outlined text-[14px]">record_voice_over</span>
                            <span>Whisper</span>
                          </button>
                          <button
                            onClick={() => handleIntercept('barge', agent)}
                            className="px-2 py-1 rounded bg-error-container/20 hover:bg-error-container text-error border border-error/30 text-label-sm font-label-md flex items-center gap-1 transition-colors"
                            title="Join active 3-way conference"
                          >
                            <span className="material-symbols-outlined text-[14px]">call_merge</span>
                            <span>Barge</span>
                          </button>
                          <button
                            onClick={() => setInspectQoSAgent(agent)}
                            className={`px-2 py-1 rounded border text-label-sm font-label-md flex items-center gap-1 transition-colors ${
                              isCritQos
                                ? 'bg-error text-on-error border-error animate-pulse'
                                : isWarnQos
                                ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40 hover:bg-[#f59e0b]/30'
                                : 'bg-surface-container-high hover:bg-surface-container-highest border-outline-variant text-on-surface'
                            }`}
                            title="Inspect WebRTC jitter & packet loss diagnostics"
                          >
                            <span className="material-symbols-outlined text-[14px]">analytics</span>
                            <span>QoS</span>
                          </button>
                        </div>
                      ) : agent.status === 'ready' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm font-mono-code text-outline">
                          Routing Priority: #{agent.priorityRank}
                        </span>
                        <button
                          onClick={() => addNotification('Agent Route Config', `Prioritizing ${agent.name} for VIP Escalations.`, 'info')}
                          className="p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface"
                        >
                          <span className="material-symbols-outlined text-[16px]">more_vert</span>
                        </button>
                      </div>
                    ) : agent.status === 'wrapup' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm font-mono-code text-outline">
                          Grace Period: {agent.gracePeriodLeft || 15}s
                        </span>
                        <button
                          onClick={() => addNotification('Wrap Extended', `Added +30s wrap-up grace period to ${agent.name}.`, 'info')}
                          className="px-2 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-label-sm font-label-md text-on-surface transition-colors"
                        >
                          Extend Wrap
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-label-sm font-mono-code text-tertiary">Adherent</span>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Floor Pagination & Aggregate Status */}
            <div className="mt-4 pt-3 border-t border-outline-variant/60 flex items-center justify-between text-label-sm font-label-sm text-outline">
              <span>Showing {filteredAgents.length} of 46 Live Logged-in Agents</span>
              <div className="flex gap-1">
                <button className="px-2 py-1 rounded bg-surface-container border border-outline-variant hover:text-on-surface">
                  ← Prev
                </button>
                <button className="px-2 py-1 rounded bg-surface-container-high border border-secondary text-secondary">
                  1
                </button>
                <button className="px-2 py-1 rounded bg-surface-container border border-outline-variant hover:text-on-surface">
                  2
                </button>
                <button className="px-2 py-1 rounded bg-surface-container border border-outline-variant hover:text-on-surface">
                  Next →
                </button>
              </div>
            </div>
          </div>

          {/* SIP Trunk & Telephony Gateway mini-telemetry widget */}
          <div className="p-4 rounded bg-surface-container-low border border-outline-variant flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">router</span>
                  <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight">
                    SIP Trunk &amp; Gateway
                  </h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-label-sm font-mono-code ${
                    degradedSessions.length > 0
                      ? 'bg-error-container text-error border border-error/40 animate-pulse'
                      : 'bg-tertiary/10 border border-tertiary/40 text-tertiary'
                  }`}
                >
                  {degradedSessions.length > 0 ? `${degradedSessions.length} QoS ALERTS` : 'WebRTC HEALTHY'}
                </span>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="space-y-3">
                {/* Metric Row 1 */}
                <div className="p-2.5 rounded bg-surface-container border border-outline-variant/50">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-outline">Carrier Latency (RTT)</span>
                    <span className="text-mono-code text-tertiary font-bold">18 ms</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-tertiary h-full" style={{ width: '18%' }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono-code text-outline mt-1">
                    <span>Edge: us-east-aws</span>
                    <span>Threshold: &lt;100ms</span>
                  </div>
                </div>

                {/* Metric Row 2 */}
                <div className="p-2.5 rounded bg-surface-container border border-outline-variant/50">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-outline">Live Floor Audio Jitter</span>
                    <span
                      className={`text-mono-code font-bold ${
                        qosStats.avgJitter >= qosThresholds.jitterWarningMs ? 'text-error' : 'text-secondary'
                      }`}
                    >
                      {qosStats.avgJitter} ms
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${
                        qosStats.avgJitter >= qosThresholds.jitterWarningMs ? 'bg-error' : 'bg-secondary'
                      }`}
                      style={{
                        width: `${Math.min(100, (qosStats.avgJitter / qosThresholds.jitterCriticalMs) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono-code text-outline mt-1">
                    <span>Opus Codec 48kHz</span>
                    <span>
                      {qosStats.avgJitter >= qosThresholds.jitterWarningMs ? 'Threshold Exceeded' : 'Stable'}
                    </span>
                  </div>
                </div>

                {/* Metric Row 3 */}
                <div className="p-2.5 rounded bg-surface-container border border-outline-variant/50">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-outline">Floor Packet Loss Rate</span>
                    <span
                      className={`text-mono-code font-bold ${
                        qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent
                          ? 'text-error'
                          : 'text-tertiary'
                      }`}
                    >
                      {qosStats.avgPacketLoss}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full ${
                        qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent ? 'bg-error' : 'bg-tertiary'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          (qosStats.avgPacketLoss / qosThresholds.packetLossCriticalPercent) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono-code text-outline mt-1">
                    <span>MOS {qosStats.avgMos}</span>
                    <span>
                      {qosStats.avgPacketLoss >= qosThresholds.packetLossWarningPercent
                        ? 'Loss Degradation'
                        : 'Zero Dropout'}
                    </span>
                  </div>
                </div>

                {/* Gateway Status Breakdown */}
                <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/60 space-y-2">
                  <div className="text-label-sm font-mono-code text-outline uppercase tracking-wider">
                    WebRTC Active Cluster Nodes
                  </div>
                  <div className="flex items-center justify-between text-label-sm font-mono-code">
                    <span className="text-on-surface">Gateway node-east-01</span>
                    <span className="text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> 99.98% UP
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-label-sm font-mono-code">
                    <span className="text-on-surface">Gateway node-east-02</span>
                    <span className="text-tertiary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> 100% UP
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-label-sm font-mono-code">
                    <span className="text-on-surface">SIP Trunk Carrier Tier-1</span>
                    <span className="text-secondary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> 1,200/2,000 Channels
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnostics Action */}
            <div className="pt-3">
              <button
                onClick={() => {
                  addNotification('Diagnostics Initiated', 'Running full SIP trunk latency & packet echo benchmark across all nodes.', 'info');
                  setActiveTab('trunk_routing');
                }}
                className="w-full py-2 px-3 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-label-sm font-label-md text-on-surface flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary">query_stats</span>
                Run Full SIP Trunk Diagnostics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Adjust Pacing Modal */}
      {pacingModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <span className="font-bold text-sm text-on-surface">Predictive Dialer Pacing Ratio</span>
            <p className="text-xs text-outline">
              Adjust lines dialed per ready agent. Recommended FCC safe range: 1.5x - 3.0x.
            </p>
            <div className="flex items-center justify-between font-mono-code">
              <span className="text-secondary font-bold text-lg">{pacingValue}x</span>
              <span className="text-xs text-outline">Drop Rate: 1.1%</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={pacingValue}
              onChange={(e) => setPacingValue(parseFloat(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPacingModal(false)}
                className="px-3 py-1 bg-surface-container rounded border border-outline-variant text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addNotification('Pacing Updated', `Q3 SaaS dialer pacing set to ${pacingValue}x.`, 'success');
                  setPacingModal(false);
                }}
                className="px-3 py-1 bg-secondary text-on-secondary rounded font-bold text-xs"
              >
                Save Pacing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Surge Overflow Modal */}
      {surgeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <span className="font-bold text-sm text-on-surface">Surge Overflow Route Trigger</span>
            <p className="text-xs text-outline">
              Reroute excess inbound calls to conversational Voice AI bot cluster or secondary backup tier.
            </p>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded bg-surface-container border border-outline-variant cursor-pointer">
                <input type="radio" name="surge" defaultChecked className="text-secondary" />
                <span>Route to Voice AI Bot (Containment Mode)</span>
              </label>
              <label className="flex items-center gap-2 p-2 rounded bg-surface-container border border-outline-variant cursor-pointer">
                <input type="radio" name="surge" className="text-secondary" />
                <span>Reroute to Partner BPO Queue</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSurgeModal(false)}
                className="px-3 py-1 bg-surface-container rounded border border-outline-variant text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addNotification('Surge Route Activated', 'Inbound overflow routed to AI Bot Cluster.', 'success');
                  setSurgeModal(false);
                }}
                className="px-3 py-1 bg-tertiary text-on-tertiary rounded font-bold text-xs"
              >
                Apply Surge Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Skillgroups Modal */}
      {skillFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
            <span className="font-bold text-sm text-on-surface">Filter Skillgroups</span>
            <div className="space-y-1.5 text-xs">
              {['Tier 1 Support', 'VIP Retain', 'Technical Escalations', 'SaaS Contracts', 'Mortgage Lending'].map((s) => (
                <label key={s} className="flex items-center gap-2 p-2 rounded bg-surface-container cursor-pointer">
                  <input type="checkbox" defaultChecked className="text-secondary" />
                  <span>{s}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSkillFilterModal(false)}
                className="px-3 py-1 bg-surface-container rounded border border-outline-variant text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  addNotification('Skill Filter Applied', 'Matrix filtered to selected queues.', 'info');
                  setSkillFilterModal(false);
                }}
                className="px-3 py-1 bg-secondary text-on-secondary rounded font-bold text-xs"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QoS SLA Thresholds Configuration Modal */}
      {qosThresholdModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-base">tune</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Real-Time Audio QoS &amp; Degradation SLA Thresholds
                  </h3>
                  <span className="text-[11px] font-mono-code text-outline">
                    Configures visual warning triggers for live jitter, packet loss &amp; voice fidelity (MOS).
                  </span>
                </div>
              </div>
              <button
                onClick={() => setQosThresholdModal(false)}
                className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Quick SLA Profile Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono-code uppercase font-bold text-outline tracking-wider">
                Quick SLA Presets
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    setTempThresholds({
                      ...tempThresholds,
                      jitterWarningMs: 20,
                      jitterCriticalMs: 35,
                      packetLossWarningPercent: 1.5,
                      packetLossCriticalPercent: 3.0,
                      mosWarningScore: 4.0,
                    })
                  }
                  className="p-2 rounded bg-surface-container border border-outline-variant hover:border-secondary text-left transition-colors"
                >
                  <span className="font-bold text-on-surface block text-[11px]">Strict Enterprise</span>
                  <span className="text-[10px] text-outline font-mono-code block">20ms / 1.5% loss</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTempThresholds({
                      ...tempThresholds,
                      jitterWarningMs: 25,
                      jitterCriticalMs: 45,
                      packetLossWarningPercent: 2.0,
                      packetLossCriticalPercent: 4.5,
                      mosWarningScore: 3.8,
                    })
                  }
                  className="p-2 rounded bg-surface-container border border-secondary/50 text-left transition-colors ring-1 ring-secondary/30"
                >
                  <span className="font-bold text-secondary block text-[11px]">VoIP Standard (Recommended)</span>
                  <span className="text-[10px] text-outline font-mono-code block">25ms / 2.0% loss</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setTempThresholds({
                      ...tempThresholds,
                      jitterWarningMs: 40,
                      jitterCriticalMs: 65,
                      packetLossWarningPercent: 3.5,
                      packetLossCriticalPercent: 6.0,
                      mosWarningScore: 3.5,
                    })
                  }
                  className="p-2 rounded bg-surface-container border border-outline-variant hover:border-secondary text-left transition-colors"
                >
                  <span className="font-bold text-on-surface block text-[11px]">Remote / Cellular</span>
                  <span className="text-[10px] text-outline font-mono-code block">40ms / 3.5% loss</span>
                </button>
              </div>
            </div>

            {/* Threshold Sliders */}
            <div className="space-y-4 pt-1">
              {/* Jitter Warning Threshold */}
              <div className="p-3 rounded bg-surface-container border border-outline-variant/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#f59e0b] text-sm">warning</span>
                    <span className="font-bold text-on-surface">Jitter Warning Threshold</span>
                  </div>
                  <span className="font-mono-code font-bold text-sm text-[#f59e0b]">
                    {tempThresholds.jitterWarningMs} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={tempThresholds.jitterWarningMs}
                  onChange={(e) =>
                    setTempThresholds({ ...tempThresholds, jitterWarningMs: parseInt(e.target.value) })
                  }
                  className="w-full accent-[#f59e0b]"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-outline">
                  <span>10ms (Ultra-tight)</span>
                  <span>Triggers AMBER visual warning badge on agent floor</span>
                  <span>60ms (Relaxed)</span>
                </div>
              </div>

              {/* Jitter Critical Threshold */}
              <div className="p-3 rounded bg-surface-container border border-outline-variant/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-sm">error</span>
                    <span className="font-bold text-on-surface">Jitter Critical Threshold</span>
                  </div>
                  <span className="font-mono-code font-bold text-sm text-error">
                    {tempThresholds.jitterCriticalMs} ms
                  </span>
                </div>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="5"
                  value={tempThresholds.jitterCriticalMs}
                  onChange={(e) =>
                    setTempThresholds({ ...tempThresholds, jitterCriticalMs: parseInt(e.target.value) })
                  }
                  className="w-full accent-error"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-outline">
                  <span>25ms</span>
                  <span>Triggers RED flashing critical banner &amp; supervisor alert</span>
                  <span>100ms</span>
                </div>
              </div>

              {/* Packet Loss Warning Threshold */}
              <div className="p-3 rounded bg-surface-container border border-outline-variant/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#f59e0b] text-sm">wifi_off</span>
                    <span className="font-bold text-on-surface">Packet Loss Warning Threshold</span>
                  </div>
                  <span className="font-mono-code font-bold text-sm text-[#f59e0b]">
                    {tempThresholds.packetLossWarningPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="6.0"
                  step="0.5"
                  value={tempThresholds.packetLossWarningPercent}
                  onChange={(e) =>
                    setTempThresholds({ ...tempThresholds, packetLossWarningPercent: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#f59e0b]"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-outline">
                  <span>0.5% (High Precision)</span>
                  <span>Triggers packet loss warning badge</span>
                  <span>6.0%</span>
                </div>
              </div>

              {/* Packet Loss Critical Threshold */}
              <div className="p-3 rounded bg-surface-container border border-outline-variant/60 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-error text-sm">signal_cellular_connected_no_internet_4_bar</span>
                    <span className="font-bold text-on-surface">Packet Loss Critical Threshold</span>
                  </div>
                  <span className="font-mono-code font-bold text-sm text-error">
                    {tempThresholds.packetLossCriticalPercent}%
                  </span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="12.0"
                  step="0.5"
                  value={tempThresholds.packetLossCriticalPercent}
                  onChange={(e) =>
                    setTempThresholds({ ...tempThresholds, packetLossCriticalPercent: parseFloat(e.target.value) })
                  }
                  className="w-full accent-error"
                />
                <div className="flex justify-between text-[10px] font-mono-code text-outline">
                  <span>1.5%</span>
                  <span>High risk of unintelligible voice clipping</span>
                  <span>12.0%</span>
                </div>
              </div>

              {/* Automation & HUD Toggles */}
              <div className="space-y-2 text-xs pt-1">
                <label className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer">
                  <div>
                    <span className="font-bold text-on-surface block">Automated QoS Buffer Remediation</span>
                    <span className="text-[10px] text-outline font-mono-code">
                      Automatically expands WebRTC jitter buffer (+40ms) when session exceeds threshold.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempThresholds.autoRemediation}
                    onChange={(e) => setTempThresholds({ ...tempThresholds, autoRemediation: e.target.checked })}
                    className="accent-secondary w-4 h-4 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-outline-variant cursor-pointer">
                  <div>
                    <span className="font-bold text-on-surface block">Prominent Floor Alert Banner</span>
                    <span className="text-[10px] text-outline font-mono-code">
                      Shows high-visibility warning banner at top of monitor when calls degrade.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={tempThresholds.visualHudEnabled}
                    onChange={(e) => setTempThresholds({ ...tempThresholds, visualHudEnabled: e.target.checked })}
                    className="accent-secondary w-4 h-4 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
              <button
                type="button"
                onClick={() =>
                  setTempThresholds({
                    jitterWarningMs: 25,
                    jitterCriticalMs: 45,
                    packetLossWarningPercent: 2.0,
                    packetLossCriticalPercent: 4.5,
                    mosWarningScore: 3.8,
                    autoRemediation: true,
                    alertSound: true,
                    visualHudEnabled: true,
                  })
                }
                className="text-xs text-outline hover:text-on-surface"
              >
                Reset to Defaults
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setQosThresholdModal(false)}
                  className="px-3 py-1.5 bg-surface-container rounded border border-outline-variant text-xs text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveThresholds}
                  className="px-4 py-1.5 bg-secondary text-on-secondary rounded font-bold text-xs shadow-xs hover:bg-secondary/90"
                >
                  Save SLA Thresholds
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VoIP Audio Stream Diagnostics & Remediation Modal */}
      {inspectQoSAgent && inspectQoSAgent.qos && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col gap-4 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-outline-variant shrink-0">
                  <img
                    src={inspectQoSAgent.avatarUrl}
                    alt={inspectQoSAgent.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary border-2 border-surface"></span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">{inspectQoSAgent.name}</h3>
                    <span className="text-xs font-mono-code text-tertiary">
                      ({formatTimer(inspectQoSAgent.durationInState)})
                    </span>
                    {inspectQoSAgent.qos.severity === 'critical' ? (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono-code font-bold bg-error text-on-error animate-pulse">
                        CRITICAL SLA VIOLATION
                      </span>
                    ) : inspectQoSAgent.qos.severity === 'warning' ? (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono-code font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40">
                        DEGRADED STREAM WARNING
                      </span>
                    ) : (
                      <span className="px-2 py-0.2 rounded text-[10px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                        STREAM HEALTHY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-mono-code text-outline block">
                    Participant: {inspectQoSAgent.callerName || 'Unknown Contact'} &bull; {inspectQoSAgent.campaign}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectQoSAgent(null)}
                className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Real-Time Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 font-mono-code">
                <span className="text-[10px] text-outline uppercase block">Call Jitter</span>
                <span
                  className={`text-lg font-bold ${
                    inspectQoSAgent.qos.jitterMs >= qosThresholds.jitterCriticalMs
                      ? 'text-error'
                      : inspectQoSAgent.qos.jitterMs >= qosThresholds.jitterWarningMs
                      ? 'text-[#f59e0b]'
                      : 'text-tertiary'
                  }`}
                >
                  {inspectQoSAgent.qos.jitterMs} ms
                </span>
                <span className="text-[9px] text-outline block">
                  Threshold: &lt;{qosThresholds.jitterWarningMs}ms
                </span>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 font-mono-code">
                <span className="text-[10px] text-outline uppercase block">Packet Loss Rate</span>
                <span
                  className={`text-lg font-bold ${
                    inspectQoSAgent.qos.packetLossPercent >= qosThresholds.packetLossCriticalPercent
                      ? 'text-error'
                      : inspectQoSAgent.qos.packetLossPercent >= qosThresholds.packetLossWarningPercent
                      ? 'text-[#f59e0b]'
                      : 'text-tertiary'
                  }`}
                >
                  {inspectQoSAgent.qos.packetLossPercent}%
                </span>
                <span className="text-[9px] text-outline block">
                  Threshold: &lt;{qosThresholds.packetLossWarningPercent}%
                </span>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 font-mono-code">
                <span className="text-[10px] text-outline uppercase block">Voice Fidelity (MOS)</span>
                <span
                  className={`text-lg font-bold ${
                    inspectQoSAgent.qos.mosScore >= 4.0
                      ? 'text-secondary'
                      : inspectQoSAgent.qos.mosScore >= 3.5
                      ? 'text-[#f59e0b]'
                      : 'text-error'
                  }`}
                >
                  {inspectQoSAgent.qos.mosScore} / 5.0
                </span>
                <span className="text-[9px] text-outline block">Opus 48kHz HD</span>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 font-mono-code">
                <span className="text-[10px] text-outline uppercase block">Carrier RTT Latency</span>
                <span className="text-lg font-bold text-on-surface">{inspectQoSAgent.qos.rttMs} ms</span>
                <span className="text-[9px] text-outline block">Edge: {inspectQoSAgent.qos.edgeGateway}</span>
              </div>
            </div>

            {/* Historical Telemetry Sparkline Trend (Last 15 ticks) */}
            <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-mono-code text-[11px] font-bold text-on-surface">
                  <span className="material-symbols-outlined text-sm text-secondary">show_chart</span>
                  <span>VoIP Stream Stability History (Rolling Readings)</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono-code text-outline">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
                    <span>Jitter (ms)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    <span>Packet Loss (%)</span>
                  </span>
                </div>
              </div>

              <div className="h-20 flex items-end gap-1.5 pt-2 border-b border-outline-variant/40">
                {inspectQoSAgent.qos.history.map((pt, idx) => {
                  const jitterHeight = Math.min(100, Math.max(15, (pt.jitter / 60) * 100));
                  const lossHeight = Math.min(100, Math.max(8, (pt.packetLoss / 5) * 100));

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full gap-0.5 group relative"
                    >
                      <div className="flex items-end gap-0.5 w-full justify-center h-full">
                        {/* Jitter Bar */}
                        <div
                          className={`w-1.5 rounded-t transition-all ${
                            pt.jitter >= qosThresholds.jitterWarningMs ? 'bg-[#f59e0b]' : 'bg-tertiary'
                          }`}
                          style={{ height: `${jitterHeight}%` }}
                        ></div>
                        {/* Packet Loss Bar */}
                        <div
                          className={`w-1.5 rounded-t transition-all ${
                            pt.packetLoss >= qosThresholds.packetLossWarningPercent ? 'bg-error' : 'bg-secondary'
                          }`}
                          style={{ height: `${lossHeight}%` }}
                        ></div>
                      </div>
                      <span className="text-[8px] font-mono-code text-outline hidden group-hover:block absolute -top-5 bg-surface-container px-1 rounded shadow-xs whitespace-nowrap z-10">
                        {pt.time}: {pt.jitter}ms / {pt.packetLoss}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] font-mono-code text-outline">
                <span>-60s Initial Handshake</span>
                <span>Active Real-Time Stream (1,000ms cadence)</span>
                <span>Current Time</span>
              </div>
            </div>

            {/* Technical Stream Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-code">
              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 space-y-1">
                <span className="text-[10px] text-outline uppercase block">WebRTC Session Parameters</span>
                <div className="flex justify-between text-[11px]">
                  <span className="text-outline">Active Codec:</span>
                  <span className="text-on-surface font-bold">{inspectQoSAgent.qos.codec}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-outline">Bitrate:</span>
                  <span className="text-on-surface font-bold">{inspectQoSAgent.qos.bitrateKbps} kbps (Variable)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-outline">Jitter Buffer Depth:</span>
                  <span className="text-secondary font-bold">{inspectQoSAgent.qos.bufferLatencyMs} ms</span>
                </div>
              </div>

              <div className="p-2.5 rounded bg-surface-container border border-outline-variant/60 space-y-1">
                <span className="text-[10px] text-outline uppercase block">Packet Flow Statistics</span>
                <div className="flex justify-between text-[11px]">
                  <span className="text-outline">Total Packets Rx:</span>
                  <span className="text-on-surface font-bold">{inspectQoSAgent.qos.packetsTotal}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-outline">Packets Dropped:</span>
                  <span className={inspectQoSAgent.qos.packetsLost > 20 ? 'text-error font-bold' : 'text-on-surface'}>
                    {inspectQoSAgent.qos.packetsLost}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-outline">Active Mitigation:</span>
                  <span className="text-tertiary font-bold truncate max-w-[150px]">
                    {inspectQoSAgent.qos.mitigationApplied || 'None Required (Nominal)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Remediation Controls */}
            <div className="p-3 rounded bg-surface-container border border-secondary/30 space-y-2">
              <span className="text-[10px] font-mono-code uppercase font-bold text-secondary tracking-wider block">
                Immediate Stream Remediation Actions
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyQoSAutoMitigation(inspectQoSAgent.id, 'boost_buffer')}
                  className="py-1.5 px-2 rounded bg-surface-container-high hover:bg-secondary hover:text-on-secondary border border-outline-variant text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">speed</span>
                  <span>Expand Buffer (+40ms)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyQoSAutoMitigation(inspectQoSAgent.id, 'switch_codec')}
                  className="py-1.5 px-2 rounded bg-surface-container-high hover:bg-secondary hover:text-on-secondary border border-outline-variant text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">swap_horiz</span>
                  <span>Switch Codec (Adaptive)</span>
                </button>

                <button
                  type="button"
                  onClick={() => applyQoSAutoMitigation(inspectQoSAgent.id, 'reroute_gateway')}
                  className="py-1.5 px-2 rounded bg-surface-container-high hover:bg-secondary hover:text-on-secondary border border-outline-variant text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">alt_route</span>
                  <span>Reroute Gateway Node</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1 border-t border-outline-variant text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => triggerNetworkQualitySpike(inspectQoSAgent.id, 'both')}
                  className="px-2 py-1 rounded bg-surface-container border border-error/30 text-error hover:bg-error-container/30 text-[11px] font-mono-code transition-colors"
                >
                  Test Jitter Spike on Session
                </button>
                <button
                  type="button"
                  onClick={() => resolveNetworkSpike(inspectQoSAgent.id)}
                  className="px-2 py-1 rounded bg-surface-container border border-tertiary/30 text-tertiary hover:bg-tertiary/20 text-[11px] font-mono-code transition-colors"
                >
                  Restore Nominal Route
                </button>
              </div>

              <button
                type="button"
                onClick={() => setInspectQoSAgent(null)}
                className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant text-xs font-semibold text-on-surface"
              >
                Close Diagnostics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
