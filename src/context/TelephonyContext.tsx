import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActiveCall,
  AgentState,
  CallLog,
  CampaignData,
  Contact,
  CrmIntegration,
  CrmPlatform,
  CrmSyncLog,
  DispositionType,
  LiveAgent,
  NavigationTab,
  QoSThresholdConfig,
  ScheduledFollowUp,
  SessionQoSTelemetry,
  TwilioConfig,
  TwilioDID,
  UserRole,
} from '../types/telephony';
import { audioEngine } from '../utils/audioEngine';
import { requestCallSummary } from '../services/aiSummaryService';
import {
  DEFAULT_QOS_THRESHOLDS,
  INITIAL_ACTIVE_CALL,
  INITIAL_AGENTS,
  INITIAL_CALL_LOGS,
  INITIAL_CAMPAIGNS,
  INITIAL_CONTACTS,
  INITIAL_CRM_INTEGRATIONS,
  INITIAL_CRM_SYNC_LOGS,
  INITIAL_DIDS,
  INITIAL_FOLLOW_UPS,
  INITIAL_TWILIO_CONFIG,
} from '../utils/mockData';

interface TelephonyContextType {
  // Navigation & Role
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  dialerRunState: 'RUNNING' | 'PAUSED';
  toggleDialerRunState: () => void;

  // Active Call & Softphone
  activeCall: ActiveCall | null;
  agentState: AgentState;
  setAgentState: (state: AgentState) => void;
  agentStateTime: number; // in seconds
  startCall: (contact: Partial<Contact>, direction?: 'inbound' | 'outbound') => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleRecording: () => void;
  setCallDisposition: (disposition: DispositionType) => void;
  updateCallNotes: (notes: string) => void;
  submitDispositionAndNext: (followUpTask?: { date: string; time: string; syncOutlook: boolean }) => void;
  isGeneratingSummary: boolean;
  generateActiveCallSummary: () => Promise<any>;
  generateSummaryForLog: (logId: string) => Promise<any>;

  // Incoming call state
  incomingCall: { contactName: string; contactNumber: string; company: string; campaign: string } | null;
  acceptIncomingCall: () => void;
  rejectIncomingCall: () => void;
  triggerSimulatedInbound: () => void;

  // Modals & Interactivity
  isKeypadOpen: boolean;
  setIsKeypadOpen: (open: boolean) => void;
  supervisorAction: { type: 'listen' | 'whisper' | 'barge'; agent: LiveAgent } | null;
  setSupervisorAction: (action: { type: 'listen' | 'whisper' | 'barge'; agent: LiveAgent } | null) => void;
  isEmergencyStopOpen: boolean;
  setIsEmergencyStopOpen: (open: boolean) => void;
  isCampaignSwitcherOpen: boolean;
  setIsCampaignSwitcherOpen: (open: boolean) => void;
  isBuyNumberOpen: boolean;
  setIsBuyNumberOpen: (open: boolean) => void;
  isScheduleReportOpen: boolean;
  setIsScheduleReportOpen: (open: boolean) => void;

  // Data Collections
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  uploadContactsBatch: (newContacts: Omit<Contact, 'id'>[]) => void;
  deleteContact: (id: string) => void;

  callLogs: CallLog[];
  addCallLog: (log: Omit<CallLog, 'id'>) => void;

  followUps: ScheduledFollowUp[];
  addFollowUp: (task: Omit<ScheduledFollowUp, 'id' | 'createdAt'>) => void;
  toggleFollowUpStatus: (id: string) => void;
  deleteFollowUp: (id: string) => void;

  agents: LiveAgent[];
  campaigns: CampaignData[];
  twilioConfig: TwilioConfig;
  updateTwilioConfig: (config: Partial<TwilioConfig>) => void;
  dids: TwilioDID[];
  addDid: (did: Omit<TwilioDID, 'id'>) => void;
  releaseDid: (id: string) => void;
  crmIntegrations: CrmIntegration[];
  toggleCrmSync: (id: string) => void;
  crmSyncLogs: CrmSyncLog[];
  retryCrmSync: (id: string) => Promise<void>;
  triggerManualCrmSync: (platform?: CrmPlatform) => Promise<void>;
  clearCrmSyncLogs: () => void;

  // Real-time Audio QoS & Jitter/Packet Loss Thresholds
  qosThresholds: QoSThresholdConfig;
  updateQoSThresholds: (newThresholds: Partial<QoSThresholdConfig>) => void;
  triggerNetworkQualitySpike: (agentId: string, metric?: 'jitter' | 'packet_loss' | 'both') => void;
  resolveNetworkSpike: (agentId: string) => void;
  applyQoSAutoMitigation: (agentId: string, action: 'boost_buffer' | 'switch_codec' | 'reroute_gateway') => void;

  // Notifications
  notifications: Array<{ id: string; title: string; message: string; time: string; type: 'info' | 'warning' | 'success' | 'error' }>;
  addNotification: (title: string, message: string, type?: 'info' | 'warning' | 'success' | 'error') => void;
  clearNotification: (id: string) => void;
}

const TelephonyContext = createContext<TelephonyContextType | undefined>(undefined);

export const TelephonyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<NavigationTab>('operations');
  const [userRole, setUserRole] = useState<UserRole>('supervisor');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [dialerRunState, setDialerRunState] = useState<'RUNNING' | 'PAUSED'>('RUNNING');

  // Agent State & Timer
  const [agentState, setAgentState] = useState<AgentState>('ready');
  const [agentStateTime, setAgentStateTime] = useState<number>(9912); // ~02:45:12

  // Active Call State & AI Summary State
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(INITIAL_ACTIVE_CALL);
  const [incomingCall, setIncomingCall] = useState<{ contactName: string; contactNumber: string; company: string; campaign: string } | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Modals
  const [isKeypadOpen, setIsKeypadOpen] = useState<boolean>(false);
  const [supervisorAction, setSupervisorAction] = useState<{ type: 'listen' | 'whisper' | 'barge'; agent: LiveAgent } | null>(null);
  const [isEmergencyStopOpen, setIsEmergencyStopOpen] = useState<boolean>(false);
  const [isCampaignSwitcherOpen, setIsCampaignSwitcherOpen] = useState<boolean>(false);
  const [isBuyNumberOpen, setIsBuyNumberOpen] = useState<boolean>(false);
  const [isScheduleReportOpen, setIsScheduleReportOpen] = useState<boolean>(false);

  // Collections with LocalStorage hydration
  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('aetherdial_contacts');
    return saved ? JSON.parse(saved) : INITIAL_CONTACTS;
  });

  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    const saved = localStorage.getItem('aetherdial_call_logs');
    return saved ? JSON.parse(saved) : INITIAL_CALL_LOGS;
  });

  const [followUps, setFollowUps] = useState<ScheduledFollowUp[]>(() => {
    const saved = localStorage.getItem('aetherdial_follow_ups');
    return saved ? JSON.parse(saved) : INITIAL_FOLLOW_UPS;
  });

  const [twilioConfig, setTwilioConfig] = useState<TwilioConfig>(() => {
    const saved = localStorage.getItem('aetherdial_twilio_config');
    return saved ? JSON.parse(saved) : INITIAL_TWILIO_CONFIG;
  });

  const [dids, setDids] = useState<TwilioDID[]>(INITIAL_DIDS);
  const [crmIntegrations, setCrmIntegrations] = useState<CrmIntegration[]>(INITIAL_CRM_INTEGRATIONS);
  const [crmSyncLogs, setCrmSyncLogs] = useState<CrmSyncLog[]>(() => {
    const saved = localStorage.getItem('aetherdial_crm_sync_logs');
    return saved ? JSON.parse(saved) : INITIAL_CRM_SYNC_LOGS;
  });
  const [agents, setAgents] = useState<LiveAgent[]>(INITIAL_AGENTS);
  const [campaigns] = useState<CampaignData[]>(INITIAL_CAMPAIGNS);
  const [qosThresholds, setQosThresholds] = useState<QoSThresholdConfig>(() => {
    const saved = localStorage.getItem('aetherdial_qos_thresholds');
    return saved ? JSON.parse(saved) : DEFAULT_QOS_THRESHOLDS;
  });

  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; message: string; time: string; type: 'info' | 'warning' | 'success' | 'error' }>>([
    {
      id: 'notif-1',
      title: 'SIP Concurrency Nominal',
      message: 'Twilio Ashburn edge load balanced across 142 channels (28.4% capacity).',
      time: 'Just now',
      type: 'info',
    },
    {
      id: 'notif-2',
      title: 'DocuSign Dispatched',
      message: 'Contract sent to Jonathan Vance at Apex Global Dataworks.',
      time: '3m ago',
      type: 'success',
    },
    {
      id: 'notif-3',
      title: 'STIR/SHAKEN Verified',
      message: '100% of outbound predictive calls signed with Level-A cryptographic certificates.',
      time: '12m ago',
      type: 'info',
    },
  ]);

  // Persist collections
  useEffect(() => {
    localStorage.setItem('aetherdial_contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('aetherdial_call_logs', JSON.stringify(callLogs));
  }, [callLogs]);

  useEffect(() => {
    localStorage.setItem('aetherdial_follow_ups', JSON.stringify(followUps));
  }, [followUps]);

  useEffect(() => {
    localStorage.setItem('aetherdial_twilio_config', JSON.stringify(twilioConfig));
  }, [twilioConfig]);

  useEffect(() => {
    localStorage.setItem('aetherdial_crm_sync_logs', JSON.stringify(crmSyncLogs));
  }, [crmSyncLogs]);

  useEffect(() => {
    localStorage.setItem('aetherdial_qos_thresholds', JSON.stringify(qosThresholds));
  }, [qosThresholds]);

  // Timer loop for active call, agent state stopwatch, & real-time QoS telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentStateTime((prev) => prev + 1);

      setActiveCall((prev) => {
        if (!prev) return null;
        if (prev.status === 'connected' && !prev.isOnHold) {
          return { ...prev, duration: prev.duration + 1 };
        }
        return prev;
      });

      // Update agent state durations and QoS telemetry
      setAgents((prev) =>
        prev.map((a) => {
          if (a.status === 'talking' || a.status === 'ready' || a.status === 'wrapup') {
            const nextDuration = a.durationInState + 1;
            let updatedQos = a.qos;

            if (a.status === 'talking' && updatedQos) {
              // Subtle natural packet fluctuation
              const jitterDelta = (Math.random() - 0.49) * 0.4;
              const lossDelta = (Math.random() - 0.49) * 0.03;
              const nextJitter = Math.max(3, parseFloat((updatedQos.jitterMs + jitterDelta).toFixed(1)));
              const nextLoss = Math.max(0.01, parseFloat((updatedQos.packetLossPercent + lossDelta).toFixed(2)));

              // Check thresholds
              const isJitterCrit = nextJitter >= qosThresholds.jitterCriticalMs;
              const isJitterWarn = nextJitter >= qosThresholds.jitterWarningMs;
              const isLossCrit = nextLoss >= qosThresholds.packetLossCriticalPercent;
              const isLossWarn = nextLoss >= qosThresholds.packetLossWarningPercent;

              let severity: 'normal' | 'warning' | 'critical' = 'normal';
              let warningType: 'none' | 'jitter' | 'packet_loss' | 'both' = 'none';

              if (isJitterCrit || isLossCrit) {
                severity = 'critical';
                warningType = (isJitterCrit || isJitterWarn) && (isLossCrit || isLossWarn) ? 'both' : isJitterCrit ? 'jitter' : 'packet_loss';
              } else if (isJitterWarn || isLossWarn) {
                severity = 'warning';
                warningType = isJitterWarn && isLossWarn ? 'both' : isJitterWarn ? 'jitter' : 'packet_loss';
              }

              // Realistic MOS Score calculation
              let computedMos = 4.45 - (nextJitter / 60) * 0.7 - (nextLoss / 2.5) * 0.9;
              computedMos = Math.max(1.8, Math.min(4.5, parseFloat(computedMos.toFixed(2))));

              // Append rolling history every 8 seconds
              let nextHistory = updatedQos.history;
              if (nextDuration % 8 === 0) {
                const nowStr = new Date().toTimeString().split(' ')[0];
                nextHistory = [
                  ...updatedQos.history.slice(-14),
                  { time: nowStr, jitter: nextJitter, packetLoss: nextLoss, mos: computedMos },
                ];
              }

              updatedQos = {
                ...updatedQos,
                jitterMs: nextJitter,
                packetLossPercent: nextLoss,
                mosScore: computedMos,
                severity,
                warningType,
                history: nextHistory,
              };
            }

            return { ...a, durationInState: nextDuration, qos: updatedQos };
          }
          return a;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [qosThresholds]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
      return next;
    });
  };

  const toggleDialerRunState = () => {
    setDialerRunState((prev) => {
      const next = prev === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      addNotification('Dialer Run State Changed', `Predictive dialer engine is now ${next}.`, next === 'RUNNING' ? 'success' : 'warning');
      return next;
    });
  };

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random()}`,
      title,
      message,
      time: 'Just now',
      type,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Call Management Handlers
  const startCall = (contact: Partial<Contact>, direction: 'inbound' | 'outbound' = 'outbound') => {
    audioEngine.stopRinging();
    audioEngine.startRinging();

    const newCall: ActiveCall = {
      id: `call-${Date.now()}`,
      contactName: contact.name || 'External Caller',
      contactNumber: contact.phone || '+1 (555) 019-8234',
      contactTitle: contact.title || 'Executive Decision Maker',
      company: contact.company || 'Enterprise Account',
      arrValue: contact.arr || '$100,000',
      contractExpiryDays: contact.contractExpiryDays || 60,
      email: contact.email || 'lead@enterprise.com',
      timezone: contact.timezone || 'America/New_York (EST)',
      assignedRep: 'Sarah Chen (You)',
      direction,
      campaign: contact.campaign || 'Q3 Enterprise Renewals (Outbound Connected)',
      duration: 0,
      status: 'ringing',
      isMuted: false,
      isOnHold: false,
      isRecording: true,
      sentiment: {
        score: 78,
        label: 'Positive',
        keywords: ['interested', 'pricing', 'infrastructure', 'timeline'],
      },
      notes: contact.notes || '',
    };

    setActiveCall(newCall);
    setAgentState('talking');
    setActiveTab('agent_telephony');

    // Simulate answer after 2.5 seconds
    setTimeout(() => {
      audioEngine.stopRinging();
      audioEngine.playConnectChime();
      setActiveCall((c) => (c ? { ...c, status: 'connected' } : null));
      addNotification('Call Connected', `Connected with ${newCall.contactName} (${newCall.contactNumber}).`, 'success');
    }, 2500);
  };

  const triggerAutomatedSummaryForLog = async (log: CallLog, notesText?: string, sentimentData?: any) => {
    setIsGeneratingSummary(true);
    try {
      const result = await requestCallSummary({
        callerName: log.callerName,
        callerPhone: log.callerPhone,
        company: log.company,
        direction: log.direction,
        duration: log.duration,
        outcome: log.outcome,
        campaign: log.campaign,
        transcription: log.transcription,
        notes: notesText || log.transcription,
        sentiment: sentimentData || { score: log.sentimentScore, label: 'Positive', keywords: [] },
        agentName: log.agentName,
      });

      setCallLogs((prev) =>
        prev.map((item) => {
          if (item.id === log.id) {
            return {
              ...item,
              summary: result.summary,
              keyTakeaways: result.keyTakeaways,
              actionItems: result.actionItems,
              sentimentAnalysis: result.sentimentAnalysis,
              aiGenerated: true,
              aiSummaryTimestamp: new Date().toLocaleString() + ' EST',
            };
          }
          return item;
        })
      );

      addNotification(
        'AI Call Summary Saved',
        `Automated takeaways generated (${result.keyTakeaways.length} points) and saved to interaction log for ${log.callerName}.`,
        'success'
      );
    } catch (err) {
      console.error('Error generating automated call summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const endCall = () => {
    audioEngine.stopRinging();
    audioEngine.playHangupTone();

    if (activeCall) {
      const callSnapshot = { ...activeCall };
      const preGenerated = callSnapshot.aiSummary;

      // Archive to Call Logs
      const completedLog: CallLog = {
        id: `call-log-${Date.now()}`,
        callId: `CALL-${Math.floor(10000 + Math.random() * 90000)}`,
        timestamp: new Date().toLocaleString() + ' EST',
        callerName: callSnapshot.contactName,
        callerPhone: callSnapshot.contactNumber,
        company: callSnapshot.company,
        direction: callSnapshot.direction,
        agentName: 'Sarah Chen',
        campaign: callSnapshot.campaign,
        duration: callSnapshot.duration || 14,
        outcome: callSnapshot.selectedDisposition || 'Follow Up Required',
        recordingUrl: callSnapshot.isRecording ? 'https://cdn.aetherdial.com/recordings/live-recording.mp3' : undefined,
        hasAudio: callSnapshot.isRecording,
        transcription: callSnapshot.notes || 'Call completed with client discussion on infrastructure capacity.',
        sentimentScore: callSnapshot.sentiment.score,
        cost: Number(((callSnapshot.duration || 10) * 0.0012).toFixed(2)),
        summary: preGenerated?.summary,
        keyTakeaways: preGenerated?.keyTakeaways,
        actionItems: preGenerated?.actionItems,
        sentimentAnalysis: preGenerated?.sentimentAnalysis,
        aiGenerated: !!preGenerated,
        aiSummaryTimestamp: preGenerated ? new Date().toLocaleString() + ' EST' : undefined,
      };

      setCallLogs((prev) => [completedLog, ...prev]);
      addNotification('Call Completed', `Archiving interaction log for ${callSnapshot.contactName}...`, 'info');

      // Automated CRM Integration Sync Event
      const autoSyncLog: CrmSyncLog = {
        id: `crm-sync-${Date.now()}`,
        syncId: `SYNC-SF-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString() + ' EST',
        platform: 'Salesforce Service Cloud',
        trigger: preGenerated ? 'AI Summary & Bulleted Takeaways' : 'Call Archival & Recording',
        targetObject: `Case #SF-${Math.floor(10000 + Math.random() * 90000)} (${callSnapshot.company || 'Account'})`,
        contactName: callSnapshot.contactName,
        company: callSnapshot.company,
        callId: completedLog.callId,
        status: 'SUCCESS',
        httpStatusCode: 201,
        latencyMs: Math.floor(115 + Math.random() * 55),
        retryCount: 0,
        maxRetries: 3,
        payloadSummary: {
          recordType: 'Case_Interaction_Telemetry__c',
          fieldsSynced: [
            'Case.SentimentScore__c',
            'Case.Disposition__c',
            'Call_Recording_URL__c',
            'AI_BulletedTakeaways__c',
          ],
          sentimentScore: callSnapshot.sentiment.score,
          disposition: callSnapshot.selectedDisposition || 'Follow Up Required',
          hasRecording: callSnapshot.isRecording,
          hasAiSummary: !!preGenerated,
        },
      };
      setCrmSyncLogs((prev) => [autoSyncLog, ...prev]);
      addNotification('CRM Synced', `Automated sync to Salesforce Service Cloud acknowledged (201 Created).`, 'success');

      // Trigger AI automated summary generation and save to interaction log
      if (!preGenerated) {
        triggerAutomatedSummaryForLog(completedLog, callSnapshot.notes, callSnapshot.sentiment);
      }
    }

    setActiveCall(null);
    setAgentState('wrapup');
  };

  const generateActiveCallSummary = async () => {
    if (!activeCall) return;
    setIsGeneratingSummary(true);
    addNotification('Synthesizing Live Audio', 'Gemini AI generating bulleted takeaways from active call speech...', 'info');
    try {
      const result = await requestCallSummary({
        callerName: activeCall.contactName,
        callerPhone: activeCall.contactNumber,
        company: activeCall.company,
        direction: activeCall.direction,
        duration: activeCall.duration,
        outcome: activeCall.selectedDisposition || 'Follow Up Required',
        campaign: activeCall.campaign,
        transcription: activeCall.notes || 'Live call speech capture.',
        notes: activeCall.notes,
        sentiment: activeCall.sentiment,
        agentName: activeCall.assignedRep,
      });

      setActiveCall((prev) =>
        prev
          ? {
              ...prev,
              aiSummary: {
                summary: result.summary,
                keyTakeaways: result.keyTakeaways,
                actionItems: result.actionItems,
                sentimentAnalysis: result.sentimentAnalysis,
              },
            }
          : null
      );

      addNotification(
        'AI Summary Generated',
        `Generated ${result.keyTakeaways.length} bulleted takeaways & action items.`,
        'success'
      );
      return result;
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const generateSummaryForLog = async (logId: string) => {
    const log = callLogs.find((l) => l.id === logId);
    if (!log) return;
    setIsGeneratingSummary(true);
    addNotification('Analyzing Interaction Log', `Generating AI takeaways for ${log.callId}...`, 'info');
    try {
      const result = await requestCallSummary({
        callerName: log.callerName,
        callerPhone: log.callerPhone,
        company: log.company,
        direction: log.direction,
        duration: log.duration,
        outcome: log.outcome,
        campaign: log.campaign,
        transcription: log.transcription,
        notes: log.transcription,
        sentiment: { score: log.sentimentScore, label: log.sentimentScore > 75 ? 'Positive' : 'Neutral', keywords: [] },
        agentName: log.agentName,
      });

      setCallLogs((prev) =>
        prev.map((item) => {
          if (item.id === logId) {
            return {
              ...item,
              summary: result.summary,
              keyTakeaways: result.keyTakeaways,
              actionItems: result.actionItems,
              sentimentAnalysis: result.sentimentAnalysis,
              aiGenerated: true,
              aiSummaryTimestamp: new Date().toLocaleString() + ' EST',
            };
          }
          return item;
        })
      );

      addNotification(
        'AI Summary Saved',
        `Generated ${result.keyTakeaways.length} bullet takeaways and updated interaction log for ${log.callerName}.`,
        'success'
      );
      return result;
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const toggleMute = () => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextMuted = !prev.isMuted;
      addNotification(nextMuted ? 'Microphone Muted' : 'Microphone Live', nextMuted ? 'Audio stream muted to customer.' : 'Customer can hear you.', 'info');
      return { ...prev, isMuted: nextMuted };
    });
  };

  const toggleHold = () => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextHold = !prev.isOnHold;
      addNotification(nextHold ? 'Call Placed on Hold' : 'Call Resumed', nextHold ? 'Hold music streaming to caller.' : 'Call unheld.', 'warning');
      return { ...prev, isOnHold: nextHold };
    });
  };

  const toggleRecording = () => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextRec = !prev.isRecording;
      addNotification(nextRec ? 'Audio Recording Started' : 'Audio Recording Paused', nextRec ? 'Encrypted PCI-DSS stream active.' : 'Recording paused.', 'info');
      return { ...prev, isRecording: nextRec };
    });
  };

  const setCallDisposition = (disposition: DispositionType) => {
    setActiveCall((prev) => (prev ? { ...prev, selectedDisposition: disposition } : null));
  };

  const updateCallNotes = (notes: string) => {
    setActiveCall((prev) => (prev ? { ...prev, notes } : null));
  };

  const submitDispositionAndNext = (followUpTask?: { date: string; time: string; syncOutlook: boolean }) => {
    if (activeCall) {
      if (followUpTask) {
        addFollowUp({
          contactName: activeCall.contactName,
          contactCompany: activeCall.company,
          contactPhone: activeCall.contactNumber,
          contactEmail: activeCall.email,
          scheduledDate: followUpTask.date,
          scheduledTime: followUpTask.time,
          assignedAgent: 'Sarah Chen',
          campaign: activeCall.campaign,
          notes: activeCall.notes,
          syncOutlook: followUpTask.syncOutlook,
          status: 'pending',
        });
      }

      endCall();
    }

    // Auto-prepare next contact from list
    const uncontacted = contacts.find((c) => c.status === 'New');
    if (uncontacted) {
      setTimeout(() => {
        addNotification('Dialer Auto-Preview', `Next contact in pacing queue: ${uncontacted.name} (${uncontacted.company})`, 'info');
      }, 1500);
    }
  };

  // Inbound Call Simulator
  const triggerSimulatedInbound = () => {
    const randomCaller = contacts[Math.floor(Math.random() * contacts.length)] || {
      name: 'Dr. Gregory House',
      phone: '+1 (609) 555-0144',
      company: 'Princeton Plainsboro Health',
      campaign: 'Tier 1 Customer Care & Support',
    };

    setIncomingCall({
      contactName: randomCaller.name,
      contactNumber: randomCaller.phone,
      company: randomCaller.company,
      campaign: randomCaller.campaign || 'Tier 1 Customer Care & Support',
    });

    audioEngine.startRinging();
  };

  const acceptIncomingCall = () => {
    if (!incomingCall) return;
    audioEngine.stopRinging();
    audioEngine.playConnectChime();

    const matchedContact = contacts.find((c) => c.phone === incomingCall.contactNumber) || {
      name: incomingCall.contactName,
      phone: incomingCall.contactNumber,
      company: incomingCall.company,
      campaign: incomingCall.campaign,
      arr: '$95,000',
      title: 'Enterprise Technical Lead',
      contractExpiryDays: 45,
      email: 'caller@enterprise.com',
      timezone: 'America/New_York (EST)',
    };

    startCall(matchedContact, 'inbound');
    setIncomingCall(null);
  };

  const rejectIncomingCall = () => {
    audioEngine.stopRinging();
    audioEngine.playHangupTone();
    setIncomingCall(null);
    addNotification('Call Routed to Voicemail', 'Inbound caller directed to IVR Voicemail queue.', 'info');
  };

  // Data helpers
  const addContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = { ...contact, id: `cnt-${Date.now()}` };
    setContacts((prev) => [newContact, ...prev]);
    addNotification('Contact Added', `Created record for ${contact.name} (${contact.company}).`, 'success');
  };

  const uploadContactsBatch = (newContacts: Omit<Contact, 'id'>[]) => {
    const fullContacts: Contact[] = newContacts.map((c, idx) => ({
      ...c,
      id: `cnt-${Date.now()}-${idx}`,
    }));
    setContacts((prev) => [...fullContacts, ...prev]);
    addNotification('Contacts Batch Imported', `Successfully loaded ${newContacts.length} contacts for outbound dialer.`, 'success');
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    addNotification('Contact Removed', 'Contact deleted from dialer queue.', 'info');
  };

  const addCallLog = (log: Omit<CallLog, 'id'>) => {
    const newLog: CallLog = { ...log, id: `call-log-${Date.now()}` };
    setCallLogs((prev) => [newLog, ...prev]);
  };

  const addFollowUp = (task: Omit<ScheduledFollowUp, 'id' | 'createdAt'>) => {
    const newTask: ScheduledFollowUp = {
      ...task,
      id: `fup-${Date.now()}`,
      createdAt: new Date().toLocaleString(),
    };
    setFollowUps((prev) => [newTask, ...prev]);
    addNotification('Follow-Up Scheduled', `Appointment with ${task.contactName} saved for ${task.scheduledDate} ${task.scheduledTime}.`, 'success');
  };

  const toggleFollowUpStatus = (id: string) => {
    setFollowUps((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const nextStatus = f.status === 'pending' ? 'completed' : 'pending';
          return { ...f, status: nextStatus };
        }
        return f;
      })
    );
  };

  const deleteFollowUp = (id: string) => {
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  };

  const updateTwilioConfig = (cfg: Partial<TwilioConfig>) => {
    setTwilioConfig((prev) => ({ ...prev, ...cfg }));
    addNotification('Twilio Config Updated', 'Trunk routing credentials and settings saved.', 'success');
  };

  const addDid = (did: Omit<TwilioDID, 'id'>) => {
    const newDid: TwilioDID = { ...did, id: `did-${Date.now()}` };
    setDids((prev) => [newDid, ...prev]);
    addNotification('Twilio Number Provisioned', `${did.number} assigned to ${did.assignedCampaign}.`, 'success');
  };

  const releaseDid = (id: string) => {
    setDids((prev) => prev.filter((d) => d.id !== id));
    addNotification('Number Released', 'DID de-provisioned from carrier routing pool.', 'info');
  };

  const toggleCrmSync = (id: string) => {
    setCrmIntegrations((prev) =>
      prev.map((crm) => {
        if (crm.id === id) {
          const nextStatus = crm.status === 'Connected' ? 'Standby' : 'Connected';
          addNotification(`${crm.name} Status`, `Integration is now ${nextStatus}.`, nextStatus === 'Connected' ? 'success' : 'warning');
          return { ...crm, status: nextStatus, lastHandshake: 'Just now' };
        }
        return crm;
      })
    );
  };

  const retryCrmSync = async (id: string) => {
    setCrmSyncLogs((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'RETRYING' as const } : item))
    );
    addNotification('Retrying CRM Webhook', `Re-attempting automated synchronization for sync event ${id}...`, 'info');

    await new Promise((r) => setTimeout(r, 1000));

    setCrmSyncLogs((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            status: 'SUCCESS' as const,
            httpStatusCode: 200,
            errorMessage: undefined,
            errorCode: undefined,
            retryCount: item.retryCount + 1,
            nextRetryAt: undefined,
            latencyMs: Math.floor(125 + Math.random() * 45),
            timestamp: new Date().toLocaleString() + ' EST',
          };
        }
        return item;
      })
    );

    addNotification('CRM Sync Succeeded', 'Webhook successfully acknowledged by target CRM platform (HTTP 200 OK).', 'success');
  };

  const triggerManualCrmSync = async (platform?: CrmPlatform) => {
    addNotification('Dispatching CRM Sync', `Triggering automated batch synchronization to ${platform || 'connected CRMs'}...`, 'info');
    await new Promise((r) => setTimeout(r, 900));

    const targetPlatform = platform || 'Salesforce Service Cloud';
    const newSyncEntry: CrmSyncLog = {
      id: `crm-sync-${Date.now()}`,
      syncId: `SYNC-${targetPlatform.startsWith('Salesforce') ? 'SF' : 'HS'}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString() + ' EST',
      platform: targetPlatform,
      trigger: 'Real-Time Contact Enrichment',
      targetObject: 'Contact & Account Registry',
      contactName: 'Batch Telemetry Sync',
      company: 'Enterprise Pipeline',
      status: 'SUCCESS',
      httpStatusCode: 200,
      latencyMs: Math.floor(130 + Math.random() * 50),
      retryCount: 0,
      maxRetries: 3,
      payloadSummary: {
        recordType: 'Batch_Sync_Payload',
        fieldsSynced: ['Phone', 'LastCallDate', 'SentimentAverage', 'DoNotCall', 'RecordingCount'],
        hasRecording: false,
        hasAiSummary: true,
      },
    };

    setCrmSyncLogs((prev) => [newSyncEntry, ...prev]);
    addNotification('CRM Sync Complete', `Batch synchronization successfully delivered to ${targetPlatform}.`, 'success');
  };

  const clearCrmSyncLogs = () => {
    setCrmSyncLogs([]);
    localStorage.removeItem('aetherdial_crm_sync_logs');
    addNotification('CRM Logs Cleared', 'All CRM synchronization log records have been reset.', 'info');
  };

  // Real-Time Audio QoS Methods
  const updateQoSThresholds = (newThresholds: Partial<QoSThresholdConfig>) => {
    setQosThresholds((prev) => {
      const updated = { ...prev, ...newThresholds };
      localStorage.setItem('aetherdial_qos_thresholds', JSON.stringify(updated));
      return updated;
    });
    addNotification('QoS Thresholds Updated', 'Real-time jitter & packet loss SLA thresholds reconfigured.', 'info');
  };

  const triggerNetworkQualitySpike = (agentId: string, metric: 'jitter' | 'packet_loss' | 'both' = 'both') => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId && a.qos) {
          const spikedJitter = metric === 'jitter' || metric === 'both' ? 54.8 : a.qos.jitterMs;
          const spikedLoss = metric === 'packet_loss' || metric === 'both' ? 4.95 : a.qos.packetLossPercent;
          return {
            ...a,
            qos: {
              ...a.qos,
              jitterMs: spikedJitter,
              packetLossPercent: spikedLoss,
              mosScore: 2.78,
              severity: 'critical',
              warningType: metric === 'both' ? 'both' : metric === 'jitter' ? 'jitter' : 'packet_loss',
            },
          };
        }
        return a;
      })
    );
    const targetAgent = agents.find((a) => a.id === agentId);
    addNotification(
      'VoIP Network Degradation Warning',
      `Degraded audio stream detected on active session for ${targetAgent?.name || 'Agent'}: Jitter / Packet loss exceeded safe operational thresholds.`,
      'warning'
    );
  };

  const resolveNetworkSpike = (agentId: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId && a.qos) {
          return {
            ...a,
            qos: {
              ...a.qos,
              jitterMs: 8.8,
              packetLossPercent: 0.09,
              mosScore: 4.45,
              severity: 'normal',
              warningType: 'none',
              mitigationApplied: 'Nominal SIP route restored',
            },
          };
        }
        return a;
      })
    );
    const targetAgent = agents.find((a) => a.id === agentId);
    addNotification(
      'VoIP Audio Quality Restored',
      `Audio QoS recovered to optimal status for ${targetAgent?.name || 'Agent'} (< 10ms jitter, 0.1% loss).`,
      'success'
    );
  };

  const applyQoSAutoMitigation = (
    agentId: string,
    action: 'boost_buffer' | 'switch_codec' | 'reroute_gateway'
  ) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === agentId && a.qos) {
          let updated = { ...a.qos };
          if (action === 'boost_buffer') {
            updated.bufferLatencyMs = Math.min(120, updated.bufferLatencyMs + 40);
            updated.jitterMs = Math.max(8, updated.jitterMs - 19);
            updated.mitigationApplied = `Jitter buffer expanded (+40ms to ${updated.bufferLatencyMs}ms)`;
          } else if (action === 'switch_codec') {
            updated.codec = updated.codec.includes('G.711u') ? 'Opus HD (48kHz)' : 'G.711u (8kHz Narrowband)';
            updated.packetLossPercent = Math.max(0.12, updated.packetLossPercent - 1.8);
            updated.mitigationApplied = `Adaptive codec switched to ${updated.codec}`;
          } else if (action === 'reroute_gateway') {
            updated.edgeGateway = updated.edgeGateway.includes('ashburn')
              ? 'us-east-ohio-02 (Secondary)'
              : 'us-east-ashburn-01 (Primary)';
            updated.jitterMs = Math.max(6, updated.jitterMs - 23);
            updated.packetLossPercent = Math.max(0.06, updated.packetLossPercent - 2.6);
            updated.mitigationApplied = `SIP trunk traffic rerouted to ${updated.edgeGateway}`;
          }
          // Re-evaluate severity
          if (updated.jitterMs < qosThresholds.jitterWarningMs && updated.packetLossPercent < qosThresholds.packetLossWarningPercent) {
            updated.severity = 'normal';
            updated.warningType = 'none';
            updated.mosScore = Math.min(4.45, updated.mosScore + 0.6);
          } else if (updated.jitterMs < qosThresholds.jitterCriticalMs && updated.packetLossPercent < qosThresholds.packetLossCriticalPercent) {
            updated.severity = 'warning';
          }
          return { ...a, qos: updated };
        }
        return a;
      })
    );
    const actionLabel =
      action === 'boost_buffer'
        ? 'Jitter buffer boosted'
        : action === 'switch_codec'
        ? 'Codec switched to adaptive rate'
        : 'Trunk rerouted to backup edge node';
    addNotification('QoS Mitigation Applied', `${actionLabel} on session. Stream stabilized.`, 'info');
  };

  return (
    <TelephonyContext.Provider
      value={{
        activeTab,
        setActiveTab,
        userRole,
        setUserRole,
        isDarkMode,
        toggleDarkMode,
        dialerRunState,
        toggleDialerRunState,

        activeCall,
        agentState,
        setAgentState,
        agentStateTime,
        startCall,
        endCall,
        toggleMute,
        toggleHold,
        toggleRecording,
        setCallDisposition,
        updateCallNotes,
        submitDispositionAndNext,
        isGeneratingSummary,
        generateActiveCallSummary,
        generateSummaryForLog,

        incomingCall,
        acceptIncomingCall,
        rejectIncomingCall,
        triggerSimulatedInbound,

        isKeypadOpen,
        setIsKeypadOpen,
        supervisorAction,
        setSupervisorAction,
        isEmergencyStopOpen,
        setIsEmergencyStopOpen,
        isCampaignSwitcherOpen,
        setIsCampaignSwitcherOpen,
        isBuyNumberOpen,
        setIsBuyNumberOpen,
        isScheduleReportOpen,
        setIsScheduleReportOpen,

        contacts,
        addContact,
        uploadContactsBatch,
        deleteContact,

        callLogs,
        addCallLog,

        followUps,
        addFollowUp,
        toggleFollowUpStatus,
        deleteFollowUp,

        agents,
        campaigns,
        twilioConfig,
        updateTwilioConfig,
        dids,
        addDid,
        releaseDid,
        crmIntegrations,
        toggleCrmSync,
        crmSyncLogs,
        retryCrmSync,
        triggerManualCrmSync,
        clearCrmSyncLogs,

        // Real-time QoS Telemetry
        qosThresholds,
        updateQoSThresholds,
        triggerNetworkQualitySpike,
        resolveNetworkSpike,
        applyQoSAutoMitigation,

        notifications,
        addNotification,
        clearNotification,
      }}
    >
      {children}
    </TelephonyContext.Provider>
  );
};

export const useTelephony = () => {
  const context = useContext(TelephonyContext);
  if (!context) {
    throw new Error('useTelephony must be used within a TelephonyProvider');
  }
  return context;
};
