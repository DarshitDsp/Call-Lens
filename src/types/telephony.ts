export type UserRole = 'supervisor' | 'agent' | 'admin' | 'compliance';

export type NavigationTab = 
  | 'operations'
  | 'campaigns'
  | 'agent_telephony'
  | 'voice_ai'
  | 'ai_models'
  | 'auditing'
  | 'analytics'
  | 'trunk_routing';

export type AgentState = 'ready' | 'talking' | 'wrapup' | 'break' | 'training';

export type CallDirection = 'inbound' | 'outbound';

export type CallStatus = 'idle' | 'dialing' | 'ringing' | 'connected' | 'on_hold' | 'ended';

export type DispositionType = 
  | 'Interested / Demo'
  | 'Contract Sent'
  | 'Follow Up Required'
  | 'Not Interested'
  | 'Wrong Number / DNC'
  | 'Completed Sale'
  | 'Voicemail Left'
  | 'Disqualified';

export interface ActiveCall {
  id: string;
  contactName: string;
  contactNumber: string;
  contactTitle?: string;
  company: string;
  arrValue: string;
  contractExpiryDays: number;
  email: string;
  timezone: string;
  assignedRep: string;
  direction: CallDirection;
  campaign: string;
  duration: number; // in seconds
  status: CallStatus;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  sentiment: {
    score: number; // e.g. 82
    label: 'Positive' | 'Neutral' | 'Agitated' | 'Critical';
    keywords: string[];
  };
  notes: string;
  selectedDisposition?: DispositionType;
  aiSummary?: {
    summary: string;
    keyTakeaways: string[];
    actionItems: string[];
    sentimentAnalysis?: string;
  };
  isGeneratingSummary?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  phone: string;
  email: string;
  company: string;
  arr: string;
  priority: 'VIP Enterprise' | 'Mid-Market' | 'Standard' | 'Cold';
  campaign: string;
  status: 'New' | 'Dialed' | 'Connected' | 'Follow-up' | 'Won' | 'DNC';
  timezone: string;
  contractExpiryDays: number;
  notes?: string;
}

export interface CallLog {
  id: string;
  callId: string;
  timestamp: string;
  callerName: string;
  callerPhone: string;
  company: string;
  direction: CallDirection;
  agentName: string;
  campaign: string;
  duration: number; // seconds
  outcome: DispositionType;
  recordingUrl?: string;
  hasAudio: boolean;
  transcription: string;
  sentimentScore: number;
  followUpDate?: string;
  cost: number;
  // AI-Powered Automated Call Summary & Bulleted Takeaways
  summary?: string;
  keyTakeaways?: string[];
  actionItems?: string[];
  sentimentAnalysis?: string;
  aiGenerated?: boolean;
  aiSummaryTimestamp?: string;
}

export interface ScheduledFollowUp {
  id: string;
  contactName: string;
  contactCompany: string;
  contactPhone: string;
  contactEmail: string;
  scheduledDate: string;
  scheduledTime: string;
  assignedAgent: string;
  campaign: string;
  notes: string;
  syncOutlook: boolean;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SessionQoSTelemetry {
  jitterMs: number;
  packetLossPercent: number;
  rttMs: number;
  mosScore: number; // 1.0 - 5.0
  codec: string;
  bitrateKbps: number;
  bufferLatencyMs: number;
  packetsLost: number;
  packetsTotal: number;
  history: Array<{ time: string; jitter: number; packetLoss: number; mos: number }>;
  warningType?: 'none' | 'jitter' | 'packet_loss' | 'both';
  severity?: 'normal' | 'warning' | 'critical';
  mitigationApplied?: string;
  edgeGateway: string;
}

export interface QoSThresholdConfig {
  jitterWarningMs: number;
  jitterCriticalMs: number;
  packetLossWarningPercent: number;
  packetLossCriticalPercent: number;
  mosWarningScore: number;
  autoRemediation: boolean;
  alertSound: boolean;
  visualHudEnabled: boolean;
}

export interface LiveAgent {
  id: string;
  name: string;
  avatarUrl: string;
  status: AgentState;
  durationInState: number; // seconds
  callerName?: string;
  campaign: string;
  skills: string[];
  priorityRank: number;
  gracePeriodLeft?: number;
  qos?: SessionQoSTelemetry;
}

export interface CampaignData {
  id: string;
  name: string;
  type: 'Inbound ACD' | 'Priority Inbound' | 'Predictive' | 'Progressive';
  status: 'STABLE' | 'OPTIMAL' | 'DIALING (OPTIMIZED)' | 'RUNNING' | 'PAUSED';
  queueSize: number;
  estWaitTime: string;
  serviceLevel: string;
  agentsLogged: number;
  agentsTalking: number;
  agentsReady: number;
  agentsWrap: number;
  connectRate: string;
  conversionRate?: string;
  dialed?: number;
  leadsLeft?: number;
  pacingRatio?: string;
  dropRate?: string;
}

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  edgeLocation: 'Ashburn' | 'Oregon' | 'Frankfurt' | 'Tokyo';
  terminationUri: string;
  originatingUri: string;
  codecs: string[];
  failoverSubaccount: boolean;
  mediaStreamWss: string;
  twimlWebhookUrl: string;
  dtmfRedaction: boolean;
  symmetricRtp: boolean;
  stirShaken: boolean;
  isConnected: boolean;
  edgeLatencyMs: number;
}

export interface TwilioDID {
  id: string;
  number: string;
  type: 'Toll-Free' | 'Local (SF)' | 'Local (NYC)' | 'Local (CHI)' | 'Intl (UK)';
  assignedCampaign: string;
  friendlyName: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mediaStream: boolean;
  };
  reputation: string;
  status: 'Active' | 'Reserved' | 'Routing';
}

export interface CrmIntegration {
  id: string;
  name: string;
  iconName: string;
  version: string;
  status: 'Connected' | 'Standby' | 'Error';
  syncMechanism: string;
  targetObject: string;
  lastHandshake: string;
  slaPriorityRule: string;
  autoCreateTrigger: string;
  transcriptAttachment: string;
  fieldMappings: {
    callerId: string;
    notes: string;
    recording: string;
    sentiment: string;
    disposition: string;
  };
}

export type CrmPlatform =
  | 'Salesforce Service Cloud'
  | 'HubSpot CRM'
  | 'Microsoft Dynamics 365'
  | 'Zendesk Enterprise'
  | 'ServiceNow CSM'
  | 'Zoho CRM';

export type CrmSyncStatus = 'SUCCESS' | 'FAILED' | 'RETRYING' | 'IN_PROGRESS';

export type CrmSyncTrigger =
  | 'Call Archival & Recording'
  | 'AI Summary & Bulleted Takeaways'
  | 'Disposition & Sentiment Update'
  | 'Follow-Up Task Injection'
  | 'Voice Biometric Auth Verification'
  | 'Real-Time Contact Enrichment';

export interface CrmSyncLog {
  id: string;
  syncId: string;
  timestamp: string;
  platform: CrmPlatform;
  trigger: CrmSyncTrigger;
  targetObject: string;
  contactName: string;
  company: string;
  callId?: string;
  status: CrmSyncStatus;
  httpStatusCode?: number;
  latencyMs: number;
  errorMessage?: string;
  errorCode?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
  payloadSummary?: {
    recordType: string;
    fieldsSynced: string[];
    sentimentScore?: number;
    disposition?: string;
    hasRecording: boolean;
    hasAiSummary: boolean;
  };
}
