import React from 'react';
import { SideNavBar } from './components/SideNavBar';
import { TopNavBar } from './components/TopNavBar';
import { BuyNumberModal } from './components/modals/BuyNumberModal';
import { CampaignSwitcherModal } from './components/modals/CampaignSwitcherModal';
import { EmergencyStopModal } from './components/modals/EmergencyStopModal';
import { IncomingCallModal } from './components/modals/IncomingCallModal';
import { KeypadModal } from './components/modals/KeypadModal';
import { ScheduleReportModal } from './components/modals/ScheduleReportModal';
import { SupervisorMonitorModal } from './components/modals/SupervisorMonitorModal';
import { AiModelsRoutingView } from './components/views/AiModelsRoutingView';
import { AnalyticsSlaView } from './components/views/AnalyticsSlaView';
import { AuditingLogsView } from './components/views/AuditingLogsView';
import { ContactsCampaignsView } from './components/views/ContactsCampaignsView';
import { LiveOperationsView } from './components/views/LiveOperationsView';
import { TrunkRoutingView } from './components/views/TrunkRoutingView';
import { VoiceAiBotOpsView } from './components/views/VoiceAiBotOpsView';
import { AgentTelephonyView } from './components/views/AgentTelephonyView';
import { TelephonyProvider, useTelephony } from './context/TelephonyContext';

const MainContent: React.FC = () => {
  const { activeTab } = useTelephony();

  return (
    <div className="flex-1 flex overflow-hidden min-w-0">
      <SideNavBar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {activeTab === 'operations' && <LiveOperationsView />}
        {activeTab === 'campaigns' && <ContactsCampaignsView />}
        {activeTab === 'agent_telephony' && <AgentTelephonyView />}
        {activeTab === 'voice_ai' && <VoiceAiBotOpsView />}
        {activeTab === 'ai_models' && <AiModelsRoutingView />}
        {activeTab === 'auditing' && <AuditingLogsView />}
        {activeTab === 'analytics' && <AnalyticsSlaView />}
        {activeTab === 'trunk_routing' && <TrunkRoutingView />}
      </main>

      {/* Global Telephony Modals */}
      <KeypadModal />
      <IncomingCallModal />
      <SupervisorMonitorModal />
      <EmergencyStopModal />
      <CampaignSwitcherModal />
      <BuyNumberModal />
      <ScheduleReportModal />
    </div>
  );
};

export default function App() {
  return (
    <TelephonyProvider>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-on-surface antialiased select-none font-body-md">
        <TopNavBar />
        <MainContent />
      </div>
    </TelephonyProvider>
  );
}
