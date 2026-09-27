import React, { useState, useMemo } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import { CallLog, CrmSyncLog, CrmPlatform, CrmSyncStatus, CrmSyncTrigger } from '../../types/telephony';
import { audioEngine } from '../../utils/audioEngine';

export const AuditingLogsView: React.FC = () => {
  const {
    callLogs,
    followUps,
    toggleFollowUpStatus,
    deleteFollowUp,
    addNotification,
    generateSummaryForLog,
    isGeneratingSummary,
    crmSyncLogs,
    retryCrmSync,
    triggerManualCrmSync,
    clearCrmSyncLogs,
    crmIntegrations,
  } = useTelephony();

  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'followups' | 'crm_sync'>('logs');
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [summaryFilter, setSummaryFilter] = useState<'All' | 'hasTakeaways'>('All');
  const [playingLogId, setPlayingLogId] = useState<string | null>(null);
  const [inspectLog, setInspectLog] = useState<CallLog | null>(null);
  const [copiedTakeaways, setCopiedTakeaways] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'takeaways' | 'transcript'>('takeaways');

  // CRM Integration Sync state
  const [crmSearch, setCrmSearch] = useState('');
  const [crmPlatformFilter, setCrmPlatformFilter] = useState<string>('All');
  const [crmStatusFilter, setCrmStatusFilter] = useState<string>('All');
  const [crmTriggerFilter, setCrmTriggerFilter] = useState<string>('All');
  const [inspectSyncLog, setInspectSyncLog] = useState<CrmSyncLog | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch =
      log.callId.toLowerCase().includes(search.toLowerCase()) ||
      log.callerName.toLowerCase().includes(search.toLowerCase()) ||
      log.company.toLowerCase().includes(search.toLowerCase()) ||
      log.callerPhone.includes(search) ||
      log.agentName.toLowerCase().includes(search.toLowerCase()) ||
      (log.keyTakeaways && log.keyTakeaways.some((t) => t.toLowerCase().includes(search.toLowerCase())));

    const matchesOutcome = outcomeFilter === 'All' || log.outcome === outcomeFilter;
    const matchesDirection = directionFilter === 'All' || log.direction === directionFilter;
    const matchesSummary = summaryFilter === 'All' || (summaryFilter === 'hasTakeaways' && log.keyTakeaways && log.keyTakeaways.length > 0);

    return matchesSearch && matchesOutcome && matchesDirection && matchesSummary;
  });

  const handleCopyTakeaways = (takeaways: string[]) => {
    const text = takeaways.map((t) => `• ${t}`).join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedTakeaways(true);
    setTimeout(() => setCopiedTakeaways(false), 2000);
    addNotification('Takeaways Copied', 'Bulleted takeaways copied to clipboard.', 'success');
  };

  const handleRegenerateSummary = async (logId: string) => {
    const result = await generateSummaryForLog(logId);
    if (result && inspectLog && inspectLog.id === logId) {
      setInspectLog((prev) =>
        prev
          ? {
              ...prev,
              summary: result.summary,
              keyTakeaways: result.keyTakeaways,
              actionItems: result.actionItems,
              sentimentAnalysis: result.sentimentAnalysis,
              aiGenerated: true,
              aiSummaryTimestamp: new Date().toLocaleString() + ' EST',
            }
          : null
      );
    }
  };

  const handlePlayRecording = (log: CallLog) => {
    if (playingLogId === log.id) {
      audioEngine.stopSpeaking();
      setPlayingLogId(null);
      return;
    }

    setPlayingLogId(log.id);
    addNotification('Playing Audio Recording', `Audio stream playback started for ${log.callId}.`, 'info');

    // Simulate playback of the audio transcription
    audioEngine.speakText(
      log.transcription || 'Call recording playback for customer consultation.',
      () => {
        setPlayingLogId(null);
      }
    );
  };

  const handleExportLogs = () => {
    const header = 'Call ID,Timestamp,Caller,Phone,Company,Direction,Agent,Campaign,Duration,Outcome,Sentiment\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.callId}","${l.timestamp}","${l.callerName}","${l.callerPhone}","${l.company}","${l.direction}","${l.agentName}","${l.campaign}","${l.duration}s","${l.outcome}","${l.sentimentScore}%"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aetherdial_call_auditing_logs_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addNotification('Logs Exported', `Downloaded ${filteredLogs.length} call records as CSV.`, 'success');
  };

  // Filtered CRM Sync Logs
  const filteredCrmLogs = useMemo(() => {
    return crmSyncLogs.filter((log) => {
      const matchesSearch =
        log.syncId.toLowerCase().includes(crmSearch.toLowerCase()) ||
        log.contactName.toLowerCase().includes(crmSearch.toLowerCase()) ||
        log.company.toLowerCase().includes(crmSearch.toLowerCase()) ||
        log.targetObject.toLowerCase().includes(crmSearch.toLowerCase()) ||
        (log.callId && log.callId.toLowerCase().includes(crmSearch.toLowerCase())) ||
        (log.errorCode && log.errorCode.toLowerCase().includes(crmSearch.toLowerCase())) ||
        (log.errorMessage && log.errorMessage.toLowerCase().includes(crmSearch.toLowerCase()));

      const matchesPlatform = crmPlatformFilter === 'All' || log.platform === crmPlatformFilter;
      const matchesStatus = crmStatusFilter === 'All' || log.status === crmStatusFilter;
      const matchesTrigger = crmTriggerFilter === 'All' || log.trigger === crmTriggerFilter;

      return matchesSearch && matchesPlatform && matchesStatus && matchesTrigger;
    });
  }, [crmSyncLogs, crmSearch, crmPlatformFilter, crmStatusFilter, crmTriggerFilter]);

  // CRM Sync Telemetry Stats
  const crmStats = useMemo(() => {
    const total = crmSyncLogs.length;
    const success = crmSyncLogs.filter((s) => s.status === 'SUCCESS').length;
    const failed = crmSyncLogs.filter((s) => s.status === 'FAILED').length;
    const retrying = crmSyncLogs.filter((s) => s.status === 'RETRYING').length;
    const inProgress = crmSyncLogs.filter((s) => s.status === 'IN_PROGRESS').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 100;
    const avgLatency =
      total > 0
        ? Math.round(crmSyncLogs.reduce((acc, s) => acc + (s.latencyMs || 0), 0) / total)
        : 140;

    return { total, success, failed, retrying, inProgress, successRate, avgLatency };
  }, [crmSyncLogs]);

  const handleManualSyncAll = async () => {
    setIsManualSyncing(true);
    await triggerManualCrmSync();
    setIsManualSyncing(false);
  };

  const handleRetryAllFailed = async () => {
    const failedLogs = crmSyncLogs.filter((s) => s.status === 'FAILED');
    if (!failedLogs.length) {
      addNotification('No Failed Syncs', 'All CRM synchronization queues are in nominal state.', 'info');
      return;
    }
    addNotification('Retrying Failed Syncs', `Re-attempting ${failedLogs.length} failed CRM transactions...`, 'info');
    for (const log of failedLogs) {
      await retryCrmSync(log.id);
    }
  };

  const handleExportCrmCsv = () => {
    const header =
      'Sync ID,Timestamp,Platform,Trigger,Target Object,Contact,Company,Status,HTTP Code,Latency (ms),Error Code\n';
    const rows = filteredCrmLogs
      .map(
        (s) =>
          `"${s.syncId}","${s.timestamp}","${s.platform}","${s.trigger}","${s.targetObject}","${s.contactName}","${s.company}","${s.status}","${s.httpStatusCode || ''}","${s.latencyMs}","${s.errorCode || ''}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aetherdial_crm_sync_audit_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    addNotification('CRM Sync Logs Exported', `Downloaded ${filteredCrmLogs.length} CRM synchronization records as CSV.`, 'success');
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto bg-surface space-y-5 custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-code text-outline mb-1">
            <span>Telephony Hub</span>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-secondary font-medium">Compliance &amp; Operational Auditing</span>
          </div>
          <h1 className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight">
            Auditing, Recording Vault &amp; CRM Sync Logs
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Cryptographically signed audio recordings, automated transcripts, FCC compliance audits, and real-time CRM integration synchronizations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sub-tab switcher */}
          <div className="bg-surface-container-low border border-outline-variant rounded p-0.5 flex items-center">
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeSubTab === 'logs'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Call Logs &amp; Recordings ({callLogs.length})
            </button>
            <button
              onClick={() => setActiveSubTab('followups')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeSubTab === 'followups'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Follow-up Tasks ({followUps.length})
            </button>
            <button
              onClick={() => setActiveSubTab('crm_sync')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeSubTab === 'crm_sync'
                  ? 'bg-secondary text-on-secondary shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-xs">sync_alt</span>
              <span>CRM Integration Sync ({crmSyncLogs.length})</span>
              {crmStats.failed > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-code font-bold bg-error text-on-error">
                  {crmStats.failed}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={activeSubTab === 'crm_sync' ? handleExportCrmCsv : handleExportLogs}
            className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-on-surface text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-primary text-sm">download</span>
            <span>{activeSubTab === 'crm_sync' ? 'Export CRM CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'logs' ? (
        <>
          {/* Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">RECORDINGS STORED</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-on-surface">{callLogs.length} Calls</span>
                <span className="text-xs font-mono-code text-tertiary">100% Encrypted</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">AES-256 Cloud Storage</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">COMPLIANCE RETENTION</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-tertiary">90 Days</span>
                <span className="text-xs font-mono-code text-tertiary">PCI-DSS Safe</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Auto-Purge DTMF Tones</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">AVERAGE CALL DURATION</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-on-surface">3m 12s</span>
                <span className="text-xs font-mono-code text-secondary">Target Met</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Opus 48kHz Codec</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">AI CALL SUMMARIES</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-tertiary">
                  {callLogs.filter((c) => c.keyTakeaways && c.keyTakeaways.length > 0).length} / {callLogs.length}
                </span>
                <span className="text-xs font-mono-code text-tertiary font-bold">100% Synced</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Bulleted Takeaways Active</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-64">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search Call ID, caller, agent, takeaways..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-8 pr-3 py-1 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-outline">Outcome:</span>
                <select
                  value={outcomeFilter}
                  onChange={(e) => setOutcomeFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none"
                >
                  <option value="All">All Outcomes</option>
                  <option value="Contract Sent">Contract Sent</option>
                  <option value="Interested / Demo">Interested / Demo</option>
                  <option value="Follow Up Required">Follow Up Required</option>
                  <option value="Completed Sale">Completed Sale</option>
                  <option value="Wrong Number / DNC">Wrong Number / DNC</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-outline">Direction:</span>
                <select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none"
                >
                  <option value="All">Inbound &amp; Outbound</option>
                  <option value="inbound">Inbound Only</option>
                  <option value="outbound">Outbound Only</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-outline">AI Takeaways:</span>
                <select
                  value={summaryFilter}
                  onChange={(e) => setSummaryFilter(e.target.value as any)}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2.5 py-1 text-xs text-on-surface focus:outline-none"
                >
                  <option value="All">All Calls</option>
                  <option value="hasTakeaways">With Bulleted Takeaways</option>
                </select>
              </div>
            </div>

            <span className="text-xs font-mono-code text-outline">
              Showing {filteredLogs.length} audit records
            </span>
          </div>

          {/* Call Logs Table */}
          <div className="overflow-x-auto rounded border border-outline-variant bg-surface-container-low">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-lowest text-[11px] font-mono-code text-outline uppercase tracking-wider">
                  <th className="py-2.5 px-3">Call ID &amp; Time</th>
                  <th className="py-2.5 px-3">Caller &amp; Company</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Agent / Handler</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Disposition Outcome</th>
                  <th className="py-2.5 px-3">AI Automated Takeaways</th>
                  <th className="py-2.5 px-3">Sentiment</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-body-sm">
                {filteredLogs.map((log) => {
                  const isPlaying = playingLogId === log.id;
                  const hasTakeaways = log.keyTakeaways && log.keyTakeaways.length > 0;
                  return (
                    <tr key={log.id} className="hover:bg-surface-container transition-colors">
                      <td className="py-2.5 px-3 font-mono-code">
                        <span className="text-on-surface font-bold">{log.callId}</span>
                        <div className="text-[10px] text-outline">{log.timestamp}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-on-surface">{log.callerName}</div>
                        <div className="text-[11px] text-outline font-mono-code">
                          {log.callerPhone} • <span className="text-secondary">{log.company}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono-code">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                            log.direction === 'inbound'
                              ? 'bg-secondary/15 text-secondary border border-secondary/30'
                              : 'bg-primary-container/20 text-primary border border-primary/30'
                          }`}
                        >
                          {log.direction}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-on-surface font-medium">{log.agentName}</td>

                      <td className="py-2.5 px-3 font-mono-code text-on-surface">{formatSecs(log.duration)}</td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                            log.outcome === 'Contract Sent' || log.outcome === 'Completed Sale'
                              ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                              : log.outcome === 'Interested / Demo'
                              ? 'bg-secondary/15 text-secondary border border-secondary/30'
                              : log.outcome === 'Wrong Number / DNC'
                              ? 'bg-error-container/40 text-error border border-error/40'
                              : 'bg-surface-container-highest text-on-surface-variant'
                          }`}
                        >
                          {log.outcome}
                        </span>
                      </td>

                      {/* AI Automated Takeaways Column */}
                      <td className="py-2.5 px-3 max-w-xs">
                        {hasTakeaways ? (
                          <div
                            onClick={() => {
                              setActiveModalTab('takeaways');
                              setInspectLog(log);
                            }}
                            className="cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary-container/20 text-tertiary border border-tertiary/40 group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors flex items-center gap-1">
                                <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                                <span>{log.keyTakeaways?.length} Bullet Takeaways</span>
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant line-clamp-1 mt-1 group-hover:text-on-surface">
                              • {log.keyTakeaways?.[0]}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRegenerateSummary(log.id)}
                            disabled={isGeneratingSummary}
                            className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high border border-outline-variant text-outline hover:text-primary text-[10px] font-medium flex items-center gap-1 transition-colors"
                          >
                            <span className="material-symbols-outlined text-xs">auto_awesome</span>
                            <span>Generate Takeaways</span>
                          </button>
                        )}
                      </td>

                      <td className="py-2.5 px-3 font-mono-code">
                        <span className="text-tertiary font-bold">{log.sentimentScore}%</span>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {log.hasAudio ? (
                            <button
                              onClick={() => handlePlayRecording(log)}
                              className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all ${
                                isPlaying
                                  ? 'bg-secondary text-on-secondary animate-pulse'
                                  : 'bg-surface-container-high hover:bg-surface-variant border border-outline-variant text-secondary'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm">
                                {isPlaying ? 'stop' : 'play_arrow'}
                              </span>
                              <span>{isPlaying ? 'Playing...' : 'Audio'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-outline font-mono-code">No Audio</span>
                          )}

                          <button
                            onClick={() => {
                              setActiveModalTab('takeaways');
                              setInspectLog(log);
                            }}
                            className="p-1 text-outline hover:text-on-surface hover:bg-surface-container rounded"
                            title="Inspect AI Takeaways & Interaction Log"
                          >
                            <span className="material-symbols-outlined text-base">description</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : activeSubTab === 'followups' ? (
        /* Follow-ups Tab */
        <div className="space-y-3">
          <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Automated Follow-Up Scheduling Queue</h3>
              <p className="text-xs text-outline">
                Appointments booked by agents in softphone console, synchronized with Outlook and Google Workspace.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-mono-code bg-secondary/15 text-secondary border border-secondary/30">
              {followUps.filter((f) => f.status === 'pending').length} Pending Tasks
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {followUps.map((fup) => (
              <div
                key={fup.id}
                className={`p-3.5 rounded border flex flex-col justify-between gap-3 transition-colors ${
                  fup.status === 'completed'
                    ? 'bg-surface-container-low/60 border-outline-variant/40 opacity-70'
                    : 'bg-surface-container-low border-outline-variant hover:border-secondary'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{fup.contactName}</h4>
                      <span className="text-xs text-secondary">{fup.contactCompany}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                        fup.status === 'completed'
                          ? 'bg-surface-container text-outline'
                          : 'bg-tertiary-container/30 text-tertiary border border-tertiary/40'
                      }`}
                    >
                      {fup.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs font-mono-code mt-2 pt-2 border-t border-outline-variant/40">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-sm text-secondary">calendar_month</span>
                      <span>{fup.scheduledDate} • {fup.scheduledTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-outline">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      <span>{fup.contactPhone}</span>
                    </div>
                  </div>

                  {fup.notes && (
                    <p className="text-xs text-on-surface-variant italic mt-2 bg-surface-container p-2 rounded border border-outline-variant/40">
                      "{fup.notes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-outline-variant/40 text-xs">
                  <span className="text-[10px] text-tertiary font-mono-code flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">sync</span>
                    Outlook Synced
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFollowUpStatus(fup.id)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                        fup.status === 'completed'
                          ? 'bg-surface-container text-outline'
                          : 'bg-tertiary text-on-tertiary'
                      }`}
                    >
                      {fup.status === 'completed' ? 'Reopen' : 'Mark Done'}
                    </button>
                    <button
                      onClick={() => deleteFollowUp(fup.id)}
                      className="p-1 text-outline hover:text-error rounded"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* CRM Integration Sync Tab */
        <div className="space-y-4">
          {/* CRM Telemetry Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">TOTAL CRM SYNCS</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-on-surface">{crmStats.total} Events</span>
                <span className="text-[10px] font-mono-code text-secondary font-bold">Real-time</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Bi-directional Telemetry</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">SUCCESS DELIVERY RATE</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-tertiary">{crmStats.successRate}%</span>
                <span className="text-xs font-mono-code text-tertiary font-bold">
                  {crmStats.success} / {crmStats.total}
                </span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">HTTP 200 &amp; 201 Acknowledged</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">SYNC ERRORS / FAILURES</span>
              <div className="flex items-baseline justify-between mt-1">
                <span
                  className={`text-xl font-bold font-mono-code ${
                    crmStats.failed > 0 ? 'text-error' : 'text-tertiary'
                  }`}
                >
                  {crmStats.failed} Error{crmStats.failed !== 1 ? 's' : ''}
                </span>
                {crmStats.failed > 0 ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-error-container/40 text-error border border-error/40">
                    Action Needed
                  </span>
                ) : (
                  <span className="text-[10px] font-mono-code text-tertiary">All Healthy</span>
                )}
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Rate Limits &amp; Expired OAuth</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between">
              <span className="text-[10px] font-mono-code text-outline uppercase">PENDING / RETRYING</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-[#f59e0b]">{crmStats.retrying} Queue</span>
                <span className="text-[10px] font-mono-code text-[#f59e0b]">Auto-Backoff</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">Exponential 3-attempt SLA</div>
            </div>

            <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-mono-code text-outline uppercase">AVG SYNC LATENCY</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-xl font-bold font-mono-code text-secondary">{crmStats.avgLatency}ms</span>
                <span className="text-[10px] font-mono-code text-secondary font-bold">Sub-200ms</span>
              </div>
              <div className="text-[10px] text-outline mt-1 font-mono-code">REST &amp; Webhook Target Met</div>
            </div>
          </div>

          {/* Connected CRM Platforms Health Strip */}
          <div className="p-3 bg-surface-container-low border border-outline-variant rounded flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-base">cloud_sync</span>
                <span className="font-bold text-xs text-on-surface">Connected CRM Platforms</span>
                <span className="text-[10px] font-mono-code text-outline">(Automated Sync Daemons)</span>
              </div>
              <span className="text-[11px] font-mono-code text-tertiary flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span>Webhook Listener Online</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
              {/* Salesforce */}
              <div className="p-2 rounded bg-surface-container border border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#38bdf8] text-base">cloud</span>
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">Salesforce Service Cloud</span>
                    <span className="text-[10px] text-outline font-mono-code">v61.0 • Webhook</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                  ONLINE
                </span>
              </div>

              {/* HubSpot */}
              <div className="p-2 rounded bg-surface-container border border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fb923c] text-base">hub</span>
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">HubSpot Enterprise</span>
                    <span className="text-[10px] text-outline font-mono-code">v3 REST • GraphQL</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                  ONLINE
                </span>
              </div>

              {/* Microsoft Dynamics */}
              <div className="p-2 rounded bg-surface-container border border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#a78bfa] text-base">dns</span>
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">Microsoft Dynamics 365</span>
                    <span className="text-[10px] text-outline font-mono-code">Azure Service Bus</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                  ONLINE
                </span>
              </div>

              {/* Zendesk */}
              <div className="p-2 rounded bg-surface-container border border-outline-variant/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4edea3] text-base">support</span>
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">Zendesk Enterprise</span>
                    <span className="text-[10px] text-outline font-mono-code">REST Push &amp; Poll</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                  ONLINE
                </span>
              </div>

              {/* ServiceNow */}
              <div className="p-2 rounded bg-surface-container border border-error/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-base">warning</span>
                  <div>
                    <span className="font-bold text-on-surface block text-[11px]">ServiceNow CSM</span>
                    <span className="text-[10px] text-error font-mono-code">OAuth Expired</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono-code font-bold bg-error-container/40 text-error border border-error/40">
                  ERROR
                </span>
              </div>
            </div>
          </div>

          {/* Filter and Action Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-container-low border border-outline-variant rounded">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-sm">
                  search
                </span>
                <input
                  type="text"
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  placeholder="Search Sync ID, contact, company, error code..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded pl-8 pr-3 py-1 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Platform Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-outline text-[11px]">Platform:</span>
                <select
                  value={crmPlatformFilter}
                  onChange={(e) => setCrmPlatformFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none"
                >
                  <option value="All">All CRMs</option>
                  <option value="Salesforce Service Cloud">Salesforce</option>
                  <option value="HubSpot CRM">HubSpot</option>
                  <option value="Microsoft Dynamics 365">Dynamics 365</option>
                  <option value="Zendesk Enterprise">Zendesk</option>
                  <option value="ServiceNow CSM">ServiceNow</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-outline text-[11px]">Status:</span>
                <select
                  value={crmStatusFilter}
                  onChange={(e) => setCrmStatusFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none"
                >
                  <option value="All">All Statuses</option>
                  <option value="SUCCESS">Success (200/201)</option>
                  <option value="FAILED">Failed / Errors</option>
                  <option value="RETRYING">Retrying</option>
                  <option value="IN_PROGRESS">In Progress</option>
                </select>
              </div>

              {/* Trigger Filter */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-outline text-[11px]">Trigger:</span>
                <select
                  value={crmTriggerFilter}
                  onChange={(e) => setCrmTriggerFilter(e.target.value)}
                  className="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs text-on-surface focus:outline-none"
                >
                  <option value="All">All Triggers</option>
                  <option value="AI Summary & Bulleted Takeaways">AI Takeaways Push</option>
                  <option value="Call Archival & Recording">Call &amp; Recording</option>
                  <option value="Disposition & Sentiment Update">Disposition &amp; Sentiment</option>
                  <option value="Follow-Up Task Injection">Follow-Up Task</option>
                  <option value="Voice Biometric Auth Verification">Biometric Auth</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSyncAll}
                disabled={isManualSyncing}
                className="px-3 py-1 bg-surface-container-high hover:bg-secondary hover:text-on-secondary border border-outline-variant text-secondary rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                title="Force automated telemetry synchronization"
              >
                <span
                  className={`material-symbols-outlined text-sm ${
                    isManualSyncing ? 'animate-spin' : ''
                  }`}
                >
                  sync
                </span>
                <span>{isManualSyncing ? 'Pushing Sync...' : 'Sync Now'}</span>
              </button>

              {crmStats.failed > 0 && (
                <button
                  onClick={handleRetryAllFailed}
                  className="px-3 py-1 bg-error-container/40 hover:bg-error hover:text-on-error border border-error/50 text-error rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Retry all failed transmissions"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Retry Failed ({crmStats.failed})</span>
                </button>
              )}

              <button
                onClick={clearCrmSyncLogs}
                className="p-1 hover:bg-surface-container rounded text-outline hover:text-error transition-colors"
                title="Clear Synchronization History"
              >
                <span className="material-symbols-outlined text-base">delete_sweep</span>
              </button>
            </div>
          </div>

          {/* CRM Synchronization Feed / Table */}
          <div className="bg-surface-container-low border border-outline-variant rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container text-outline font-mono-code text-[11px]">
                  <th className="py-2.5 px-3">Timestamp &amp; Sync ID</th>
                  <th className="py-2.5 px-3">Target CRM Platform</th>
                  <th className="py-2.5 px-3">Sync Event / Trigger</th>
                  <th className="py-2.5 px-3">Target Object &amp; Entity</th>
                  <th className="py-2.5 px-3">Delivery Status</th>
                  <th className="py-2.5 px-3">Latency</th>
                  <th className="py-2.5 px-3">Error Diagnostics / Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 font-body-sm">
                {filteredCrmLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-outline">
                      <span className="material-symbols-outlined text-3xl block mb-2 text-outline/60">
                        sync_disabled
                      </span>
                      <span>No CRM synchronization events found matching the selected filter criteria.</span>
                    </td>
                  </tr>
                ) : (
                  filteredCrmLogs.map((sync) => {
                    const isFailed = sync.status === 'FAILED';
                    const isRetrying = sync.status === 'RETRYING';
                    const isSuccess = sync.status === 'SUCCESS';

                    return (
                      <tr key={sync.id} className="hover:bg-surface-container transition-colors">
                        {/* Timestamp & Sync ID */}
                        <td className="py-2.5 px-3 font-mono-code">
                          <span className="font-bold text-on-surface block text-[11px]">{sync.syncId}</span>
                          <span className="text-[10px] text-outline block">{sync.timestamp}</span>
                        </td>

                        {/* Platform Badge */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {sync.platform.includes('Salesforce') && (
                              <span className="material-symbols-outlined text-[#38bdf8] text-sm">cloud</span>
                            )}
                            {sync.platform.includes('HubSpot') && (
                              <span className="material-symbols-outlined text-[#fb923c] text-sm">hub</span>
                            )}
                            {sync.platform.includes('Dynamics') && (
                              <span className="material-symbols-outlined text-[#a78bfa] text-sm">dns</span>
                            )}
                            {sync.platform.includes('Zendesk') && (
                              <span className="material-symbols-outlined text-[#4edea3] text-sm">support</span>
                            )}
                            {sync.platform.includes('ServiceNow') && (
                              <span className="material-symbols-outlined text-error text-sm">warning</span>
                            )}
                            <span className="font-semibold text-on-surface truncate max-w-[140px] block">
                              {sync.platform}
                            </span>
                          </div>
                        </td>

                        {/* Trigger */}
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold inline-block ${
                              sync.trigger.includes('AI Summary')
                                ? 'bg-tertiary-container/20 text-tertiary border border-tertiary/40'
                                : sync.trigger.includes('Recording')
                                ? 'bg-secondary-container/20 text-secondary border border-secondary/40'
                                : sync.trigger.includes('Biometric')
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                : 'bg-surface-container-high text-on-surface border border-outline-variant'
                            }`}
                          >
                            {sync.trigger}
                          </span>
                        </td>

                        {/* Target Object & Entity */}
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-on-surface block truncate max-w-xs">
                            {sync.targetObject}
                          </span>
                          <span className="text-[10px] text-outline font-mono-code block">
                            {sync.contactName} &bull; {sync.company}
                          </span>
                        </td>

                        {/* Delivery Status */}
                        <td className="py-2.5 px-3">
                          {isSuccess && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/40 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">check_circle</span>
                              <span>{sync.httpStatusCode || 200} OK</span>
                            </span>
                          )}
                          {isFailed && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-error-container/40 text-error border border-error/40 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs">error</span>
                              <span>{sync.httpStatusCode || 500} FAILED</span>
                            </span>
                          )}
                          {isRetrying && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                              <span>RETRYING ({sync.retryCount}/{sync.maxRetries})</span>
                            </span>
                          )}
                          {sync.status === 'IN_PROGRESS' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-secondary/15 text-secondary border border-secondary/40 flex items-center gap-1 w-fit">
                              <span className="material-symbols-outlined text-xs animate-spin">refresh</span>
                              <span>DISPATCHING</span>
                            </span>
                          )}
                        </td>

                        {/* Latency */}
                        <td className="py-2.5 px-3 font-mono-code">
                          <span
                            className={`text-[11px] font-semibold ${
                              sync.latencyMs < 200
                                ? 'text-tertiary'
                                : sync.latencyMs < 400
                                ? 'text-[#f59e0b]'
                                : 'text-error'
                            }`}
                          >
                            {sync.latencyMs}ms
                          </span>
                        </td>

                        {/* Error Diagnostics / Details */}
                        <td className="py-2.5 px-3 max-w-xs">
                          {isFailed ? (
                            <div className="space-y-0.5">
                              <span className="font-mono-code font-bold text-[10px] text-error block">
                                [{sync.errorCode || 'ERR_DOWNSTREAM_FAILURE'}]
                              </span>
                              <p className="text-[10px] text-error/80 line-clamp-1 truncate" title={sync.errorMessage}>
                                {sync.errorMessage}
                              </p>
                              {sync.nextRetryAt && (
                                <span className="text-[9px] font-mono-code text-[#f59e0b] block">
                                  Next: {sync.nextRetryAt}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-outline font-mono-code flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs text-tertiary">done</span>
                              <span>Payload verified &bull; {sync.payloadSummary?.fieldsSynced?.length || 4} fields</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isFailed && (
                              <button
                                onClick={() => retryCrmSync(sync.id)}
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-on-secondary hover:bg-secondary/90 flex items-center gap-1 shadow-xs transition-colors"
                                title="Retry webhook transmission now"
                              >
                                <span className="material-symbols-outlined text-xs">refresh</span>
                                <span>Retry</span>
                              </button>
                            )}

                            <button
                              onClick={() => setInspectSyncLog(sync)}
                              className="p-1 text-outline hover:text-on-surface hover:bg-surface-container rounded transition-colors"
                              title="Inspect Webhook Payload & Diagnostics"
                            >
                              <span className="material-symbols-outlined text-base">code</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Log & AI Summary Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded bg-tertiary-container/30 border border-tertiary/40 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">Interaction Log: {inspectLog.callId}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                      AI SUMMARIZED
                    </span>
                  </div>
                  <span className="text-xs font-mono-code text-outline block">{inspectLog.timestamp}</span>
                </div>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Call Metadata Pill Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs font-mono-code">
              <div>
                <span className="text-outline block text-[10px] uppercase">Caller / Contact</span>
                <span className="font-bold text-on-surface truncate block">{inspectLog.callerName}</span>
                <span className="text-[10px] text-outline truncate block">{inspectLog.callerPhone}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Account / Co.</span>
                <span className="text-secondary font-bold truncate block">{inspectLog.company}</span>
                <span className="text-[10px] text-outline truncate block">{inspectLog.campaign}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Duration &amp; Rep</span>
                <span className="text-on-surface font-bold block">{formatSecs(inspectLog.duration)}</span>
                <span className="text-[10px] text-outline truncate block">{inspectLog.agentName}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Disposition</span>
                <span className="text-tertiary font-bold block truncate">{inspectLog.outcome}</span>
                <span className="text-[10px] text-tertiary block font-bold">{inspectLog.sentimentScore}% Positive</span>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-outline-variant gap-2 text-xs">
              <button
                onClick={() => setActiveModalTab('takeaways')}
                className={`pb-2 px-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeModalTab === 'takeaways'
                    ? 'border-tertiary text-tertiary'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>AI Automated Takeaways</span>
                {inspectLog.keyTakeaways && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-tertiary/20 text-tertiary font-mono-code">
                    {inspectLog.keyTakeaways.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveModalTab('transcript')}
                className={`pb-2 px-1 font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
                  activeModalTab === 'transcript'
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Full Speech Transcript &amp; Audio</span>
              </button>
            </div>

            {/* Tab 1: AI Bulleted Takeaways */}
            {activeModalTab === 'takeaways' ? (
              <div className="space-y-3 text-xs">
                {/* Executive Summary */}
                <div className="p-3 rounded bg-surface-container border-l-4 border-tertiary border-t border-r border-b border-outline-variant">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono-code uppercase font-bold text-tertiary flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">summarize</span>
                      Executive Summary
                    </span>
                    <span className="text-[10px] text-outline font-mono-code">Gemini 3.8 Flash Synthesized</span>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">
                    {inspectLog.summary || 'Summary generated upon call completion and archived to interaction log.'}
                  </p>
                </div>

                {/* Bulleted Takeaways Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono-code uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-tertiary">format_list_bulleted</span>
                      Bulleted Key Takeaways
                    </span>
                    {inspectLog.keyTakeaways && inspectLog.keyTakeaways.length > 0 && (
                      <button
                        onClick={() => handleCopyTakeaways(inspectLog.keyTakeaways || [])}
                        className="text-[11px] text-secondary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-xs">
                          {copiedTakeaways ? 'check' : 'content_copy'}
                        </span>
                        <span>{copiedTakeaways ? 'Copied!' : 'Copy Takeaways'}</span>
                      </button>
                    )}
                  </div>

                  {inspectLog.keyTakeaways && inspectLog.keyTakeaways.length > 0 ? (
                    <div className="space-y-1.5 bg-surface-container-lowest p-3 rounded border border-outline-variant">
                      {inspectLog.keyTakeaways.map((takeaway, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-on-surface leading-normal">
                          <span className="w-2 h-2 rounded-full bg-tertiary mt-1 shrink-0 ring-2 ring-tertiary/20"></span>
                          <span className="flex-1">{takeaway}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant text-center">
                      <span className="text-outline">No takeaways generated yet.</span>
                      <button
                        onClick={() => handleRegenerateSummary(inspectLog.id)}
                        disabled={isGeneratingSummary}
                        className="ml-2 text-primary font-semibold hover:underline"
                      >
                        Generate now
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Items */}
                {inspectLog.actionItems && inspectLog.actionItems.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono-code uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs text-secondary">check_circle</span>
                      Assigned Action Items &amp; Next Steps
                    </span>
                    <div className="space-y-1.5 bg-surface-container-lowest p-3 rounded border border-outline-variant">
                      {inspectLog.actionItems.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-on-surface">
                          <span className="material-symbols-outlined text-secondary text-sm shrink-0 mt-0.5">
                            arrow_right_alt
                          </span>
                          <span className="flex-1 font-medium">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentiment & Tone Insights */}
                <div className="p-2.5 rounded bg-surface-container border border-outline-variant flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-base">psychology</span>
                    <div>
                      <span className="text-[10px] text-outline uppercase font-mono-code block">Customer Receptivity</span>
                      <span className="text-xs font-semibold text-on-surface">
                        {inspectLog.sentimentAnalysis || 'Positive and solution-oriented conversation'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded font-mono-code text-xs font-bold bg-tertiary/20 text-tertiary border border-tertiary/30">
                    {inspectLog.sentimentScore}% CSAT
                  </span>
                </div>
              </div>
            ) : (
              /* Tab 2: Full Speech Transcript & Audio */
              <div className="space-y-3 text-xs">
                {inspectLog.hasAudio && (
                  <div className="p-3 rounded bg-surface-container flex items-center justify-between border border-outline-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-lg">mic</span>
                      <div>
                        <span className="font-bold text-on-surface">Call Recording Audio</span>
                        <span className="text-[10px] text-outline font-mono-code block">Opus 48kHz HD Audio • Encrypted</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlayRecording(inspectLog)}
                      className="px-3 py-1 rounded bg-secondary text-on-secondary font-bold flex items-center gap-1 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {playingLogId === inspectLog.id ? 'stop' : 'play_arrow'}
                      </span>
                      <span>{playingLogId === inspectLog.id ? 'Stop Playback' : 'Play Audio'}</span>
                    </button>
                  </div>
                )}

                <div>
                  <span className="font-bold text-on-surface block mb-1">Full Speech-to-Text Transcription:</span>
                  <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant text-on-surface-variant leading-relaxed font-mono-code text-xs max-h-48 overflow-y-auto">
                    {inspectLog.transcription}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRegenerateSummary(inspectLog.id)}
                  disabled={isGeneratingSummary}
                  className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-variant rounded border border-outline-variant text-xs text-on-surface flex items-center gap-1 font-medium transition-colors disabled:opacity-50"
                >
                  <span className={`material-symbols-outlined text-xs ${isGeneratingSummary ? 'animate-spin' : ''}`}>
                    autorenew
                  </span>
                  <span>{isGeneratingSummary ? 'Regenerating...' : 'Regenerate with Gemini'}</span>
                </button>
                {inspectLog.keyTakeaways && (
                  <button
                    onClick={() => handleCopyTakeaways(inspectLog.keyTakeaways || [])}
                    className="px-2.5 py-1 bg-surface-container-high hover:bg-surface-variant rounded border border-outline-variant text-xs text-secondary flex items-center gap-1 font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">
                      {copiedTakeaways ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedTakeaways ? 'Copied' : 'Copy All Takeaways'}</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant text-xs text-on-surface font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect CRM Synchronization Event Modal */}
      {inspectSyncLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant rounded-lg p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center ${
                    inspectSyncLog.status === 'SUCCESS'
                      ? 'bg-tertiary-container/30 border border-tertiary/40 text-tertiary'
                      : inspectSyncLog.status === 'FAILED'
                      ? 'bg-error-container/40 border border-error/40 text-error'
                      : 'bg-[#f59e0b]/20 border border-[#f59e0b]/40 text-[#f59e0b]'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {inspectSyncLog.status === 'SUCCESS'
                      ? 'cloud_done'
                      : inspectSyncLog.status === 'FAILED'
                      ? 'cloud_off'
                      : 'sync'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">
                      CRM Sync Audit Record: {inspectSyncLog.syncId}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono-code font-bold ${
                        inspectSyncLog.status === 'SUCCESS'
                          ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                          : inspectSyncLog.status === 'FAILED'
                          ? 'bg-error-container/40 text-error border border-error/40'
                          : 'bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40'
                      }`}
                    >
                      {inspectSyncLog.status} ({inspectSyncLog.httpStatusCode || 200})
                    </span>
                  </div>
                  <span className="text-xs font-mono-code text-outline block">
                    {inspectSyncLog.platform} &bull; {inspectSyncLog.timestamp}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setInspectSyncLog(null)}
                className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Sync Metadata Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs font-mono-code">
              <div>
                <span className="text-outline block text-[10px] uppercase">Target Platform</span>
                <span className="font-bold text-on-surface truncate block">{inspectSyncLog.platform}</span>
                <span className="text-[10px] text-secondary truncate block">{inspectSyncLog.trigger}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Contact / Account</span>
                <span className="text-on-surface font-bold truncate block">{inspectSyncLog.contactName}</span>
                <span className="text-[10px] text-outline truncate block">{inspectSyncLog.company}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Target Object</span>
                <span className="text-secondary font-bold truncate block">{inspectSyncLog.targetObject}</span>
                <span className="text-[10px] text-outline truncate block">
                  {inspectSyncLog.callId || 'Call Session'}
                </span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Telemetry Latency</span>
                <span className="text-tertiary font-bold block">{inspectSyncLog.latencyMs}ms</span>
                <span className="text-[10px] text-outline block">
                  Retries: {inspectSyncLog.retryCount}/{inspectSyncLog.maxRetries}
                </span>
              </div>
            </div>

            {/* Error Diagnostics Banner (If Failed) */}
            {inspectSyncLog.status === 'FAILED' && (
              <div className="p-3 rounded bg-error-container/20 border border-error/50 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono-code font-bold text-xs text-error flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">error</span>
                    Downstream Error Code: [{inspectSyncLog.errorCode || 'ERR_DOWNSTREAM_FAILURE'}]
                  </span>
                  <span className="text-[10px] font-mono-code text-error font-bold">
                    HTTP {inspectSyncLog.httpStatusCode}
                  </span>
                </div>
                <p className="text-xs text-on-surface leading-relaxed font-mono-code bg-surface-container-lowest p-2 rounded border border-error/30">
                  {inspectSyncLog.errorMessage}
                </p>
                <div className="flex items-center justify-between text-[11px] text-outline pt-1 border-t border-error/20">
                  <span>
                    Remediation: {inspectSyncLog.errorCode?.includes('RATE_LIMIT')
                      ? 'Backoff in effect. Increase burst limit in Connected App settings.'
                      : 'OAuth bearer token expired. Re-authenticate client credentials in Trunk Routing.'}
                  </span>
                  {inspectSyncLog.nextRetryAt && (
                    <span className="text-[#f59e0b] font-mono-code">{inspectSyncLog.nextRetryAt}</span>
                  )}
                </div>
              </div>
            )}

            {/* Synced Schema Field Mappings */}
            {inspectSyncLog.payloadSummary && (
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono-code uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-secondary">schema</span>
                    Synced CRM Schema Fields ({inspectSyncLog.payloadSummary.fieldsSynced.length})
                  </span>
                  <span className="text-[10px] font-mono-code text-outline">
                    Record: {inspectSyncLog.payloadSummary.recordType}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 p-2.5 rounded bg-surface-container-lowest border border-outline-variant">
                  {inspectSyncLog.payloadSummary.fieldsSynced.map((field, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[10px] font-mono-code bg-surface-container border border-outline-variant text-on-surface"
                    >
                      {field}
                    </span>
                  ))}
                  {inspectSyncLog.payloadSummary.hasAiSummary && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                      ✦ AI Summary &amp; Takeaways Included
                    </span>
                  )}
                  {inspectSyncLog.payloadSummary.hasRecording && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-secondary/15 text-secondary border border-secondary/30">
                      HD Recording URL Included
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Raw Webhook JSON Payload Preview */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono-code uppercase font-bold text-outline tracking-wider flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-tertiary">data_object</span>
                  Webhook Transmission Payload (JSON)
                </span>
                <button
                  onClick={() => {
                    const json = JSON.stringify(
                      {
                        syncId: inspectSyncLog.syncId,
                        timestamp: inspectSyncLog.timestamp,
                        platform: inspectSyncLog.platform,
                        trigger: inspectSyncLog.trigger,
                        targetObject: inspectSyncLog.targetObject,
                        contact: {
                          name: inspectSyncLog.contactName,
                          company: inspectSyncLog.company,
                        },
                        telemetry: {
                          callId: inspectSyncLog.callId,
                          latencyMs: inspectSyncLog.latencyMs,
                          status: inspectSyncLog.status,
                          httpStatusCode: inspectSyncLog.httpStatusCode,
                        },
                        payloadSummary: inspectSyncLog.payloadSummary,
                      },
                      null,
                      2
                    );
                    navigator.clipboard?.writeText(json);
                    setCopiedPayload(true);
                    setTimeout(() => setCopiedPayload(false), 2000);
                    addNotification('Payload Copied', 'Webhook JSON copied to clipboard.', 'success');
                  }}
                  className="text-[11px] text-secondary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-xs">
                    {copiedPayload ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="p-3 rounded bg-[#0b0e14] border border-outline-variant font-mono-code text-[11px] text-on-surface-variant max-h-48 overflow-y-auto leading-relaxed">
                <pre className="text-secondary/90">
                  {JSON.stringify(
                    {
                      webhook_id: inspectSyncLog.syncId,
                      event_type: inspectSyncLog.trigger,
                      destination_crm: inspectSyncLog.platform,
                      target_object_id: inspectSyncLog.targetObject,
                      timestamp_utc: inspectSyncLog.timestamp,
                      contact: {
                        name: inspectSyncLog.contactName,
                        company: inspectSyncLog.company,
                      },
                      fields: inspectSyncLog.payloadSummary?.fieldsSynced || [],
                      sentiment_score: inspectSyncLog.payloadSummary?.sentimentScore,
                      disposition: inspectSyncLog.payloadSummary?.disposition,
                      has_ai_takeaways: inspectSyncLog.payloadSummary?.hasAiSummary,
                      has_audio_recording: inspectSyncLog.payloadSummary?.hasRecording,
                      delivery: {
                        http_status: inspectSyncLog.httpStatusCode,
                        latency_ms: inspectSyncLog.latencyMs,
                        retry_count: inspectSyncLog.retryCount,
                        status: inspectSyncLog.status,
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
              {inspectSyncLog.status === 'FAILED' ? (
                <button
                  onClick={async () => {
                    await retryCrmSync(inspectSyncLog.id);
                    setInspectSyncLog((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: 'SUCCESS',
                            httpStatusCode: 200,
                            errorMessage: undefined,
                            errorCode: undefined,
                            retryCount: prev.retryCount + 1,
                            nextRetryAt: undefined,
                            timestamp: new Date().toLocaleString() + ' EST',
                          }
                        : null
                    );
                  }}
                  className="px-3 py-1.5 bg-secondary text-on-secondary hover:bg-secondary/90 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  <span>Retry Webhook Transmission</span>
                </button>
              ) : (
                <span className="text-xs text-outline font-mono-code flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-tertiary">verified</span>
                  <span>Acknowledged by {inspectSyncLog.platform} API</span>
                </span>
              )}

              <button
                onClick={() => setInspectSyncLog(null)}
                className="px-4 py-1.5 bg-surface-container hover:bg-surface-container-high rounded border border-outline-variant text-xs text-on-surface font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
