import React, { useState, useMemo } from 'react';
import { useTelephony } from '../../context/TelephonyContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { CallLog } from '../../types/telephony';

export interface SentimentChartPoint {
  id?: string;
  callId?: string;
  timeLabel: string;
  shortTime: string;
  sentimentScore: number;
  movingAverage?: number;
  inboundScore?: number;
  outboundScore?: number;
  callCount?: number;
  callerName?: string;
  company?: string;
  agentName?: string;
  direction?: 'inbound' | 'outbound';
  outcome?: string;
  duration?: number;
  emotionLabel: string;
  emotionColor?: string;
  rawLog?: CallLog;
}

export const AnalyticsSlaView: React.FC = () => {
  const { setIsScheduleReportOpen, addNotification, callLogs } = useTelephony();

  const [dateRange, setDateRange] = useState('Last 30 Days: Oct 1 - Oct 30');
  const [directionFilter, setDirectionFilter] = useState<'blended' | 'inbound' | 'outbound'>('blended');
  const [searchCampaign, setSearchCampaign] = useState('');
  const [selectedScorecardRow, setSelectedScorecardRow] = useState<string | null>(null);

  // Recharts Sentiment Trend Chart State
  const [sentimentViewMode, setSentimentViewMode] = useState<'stream' | 'hourly'>('stream');
  const [sentimentDirFilter, setSentimentDirFilter] = useState<'all' | 'inbound' | 'outbound'>('all');
  const [showMovingAverage, setShowMovingAverage] = useState(true);
  const [showThresholdLines, setShowThresholdLines] = useState(true);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  // Prepare stream data (call-by-call chronological order)
  const streamData: SentimentChartPoint[] = useMemo(() => {
    const filtered = callLogs.filter((log) => {
      if (sentimentDirFilter === 'all') return true;
      return log.direction === sentimentDirFilter;
    });

    const sorted = [...filtered].reverse();

    return sorted.map((log, index, arr) => {
      let timeLabel = `Call #${index + 1}`;
      if (log.timestamp) {
        const timeMatch = log.timestamp.match(/(\d{1,2}:\d{2})/);
        if (timeMatch) {
          timeLabel = timeMatch[1];
        }
      }

      // 3-point rolling moving average
      const windowStart = Math.max(0, index - 2);
      const windowItems = arr.slice(windowStart, index + 1);
      const movingAvg = Math.round(
        windowItems.reduce((acc, curr) => acc + curr.sentimentScore, 0) / windowItems.length
      );

      let emotionLabel = 'Delighted';
      let emotionColor = '#4edea3';
      if (log.sentimentScore >= 80) {
        emotionLabel = 'Enthusiastic / Satisfied';
        emotionColor = '#4edea3';
      } else if (log.sentimentScore >= 65) {
        emotionLabel = 'Receptive / Engaged';
        emotionColor = '#4cd7f6';
      } else if (log.sentimentScore >= 50) {
        emotionLabel = 'Neutral / Inquisitive';
        emotionColor = '#f59e0b';
      } else {
        emotionLabel = 'Frustrated / Objection';
        emotionColor = '#ffb4ab';
      }

      return {
        id: log.id,
        callId: log.callId,
        timeLabel: `${timeLabel} (${log.callerName.split(' ')[0]})`,
        shortTime: timeLabel,
        sentimentScore: log.sentimentScore,
        movingAverage: movingAvg,
        callerName: log.callerName,
        company: log.company,
        agentName: log.agentName,
        direction: log.direction,
        outcome: log.outcome,
        duration: log.duration,
        emotionLabel,
        emotionColor,
        rawLog: log,
      };
    });
  }, [callLogs, sentimentDirFilter]);

  // Prepare hourly aggregated operational dataset
  const hourlyData: SentimentChartPoint[] = useMemo(() => {
    const hours = [
      { time: '08:00', inbound: 81, outbound: 76, baseline: 79, count: 42 },
      { time: '09:00', inbound: 85, outbound: 80, baseline: 83, count: 88 },
      { time: '10:00', inbound: 91, outbound: 84, baseline: 88, count: 140 },
      { time: '11:00', inbound: 88, outbound: 86, baseline: 87, count: 108 },
      { time: '12:00', inbound: 80, outbound: 77, baseline: 79, count: 70 },
      { time: '13:00', inbound: 84, outbound: 82, baseline: 83, count: 102 },
      { time: '14:00', inbound: 90, outbound: 85, baseline: 88, count: 152 },
      { time: '15:00', inbound: 86, outbound: 83, baseline: 85, count: 118 },
      { time: '16:00', inbound: 82, outbound: 80, baseline: 81, count: 86 },
      { time: '17:00', inbound: 79, outbound: 76, baseline: 78, count: 54 },
      { time: '18:00', inbound: 82, outbound: 78, baseline: 80, count: 30 },
    ];

    return hours.map((h, idx, arr) => {
      let score = h.baseline;
      if (sentimentDirFilter === 'inbound') score = h.inbound;
      if (sentimentDirFilter === 'outbound') score = h.outbound;

      const windowStart = Math.max(0, idx - 2);
      const windowItems = arr.slice(windowStart, idx + 1);
      const avg = Math.round(
        windowItems.reduce((acc, curr) => {
          let currScore = curr.baseline;
          if (sentimentDirFilter === 'inbound') currScore = curr.inbound;
          if (sentimentDirFilter === 'outbound') currScore = curr.outbound;
          return acc + currScore;
        }, 0) / windowItems.length
      );

      return {
        timeLabel: h.time,
        shortTime: h.time,
        sentimentScore: score,
        inboundScore: h.inbound,
        outboundScore: h.outbound,
        movingAverage: avg,
        callCount: h.count,
        emotionLabel: score >= 85 ? 'Enthusiastic' : score >= 75 ? 'Receptive' : 'Moderate',
        emotionColor: score >= 80 ? '#4edea3' : '#4cd7f6',
      };
    });
  }, [sentimentDirFilter]);

  const activeChartData: SentimentChartPoint[] = sentimentViewMode === 'stream' ? streamData : hourlyData;

  // Aggregate supervisor statistics
  const sentimentStats = useMemo(() => {
    const scores = streamData.map((d) => d.sentimentScore);
    if (!scores.length) return { avg: 84, positivePct: 83, alertCount: 0, highest: 94, lowest: 10 };

    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const positive = scores.filter((s) => s >= 75).length;
    const positivePct = Math.round((positive / scores.length) * 100);
    const alertCount = scores.filter((s) => s < 50).length;
    const highest = Math.max(...scores);
    const lowest = Math.min(...scores);

    return { avg, positivePct, alertCount, highest, lowest };
  }, [streamData]);

  const selectedCall = useMemo(() => {
    if (!selectedCallId) return null;
    return callLogs.find((c) => c.id === selectedCallId) || null;
  }, [selectedCallId, callLogs]);

  const scorecardData = [
    {
      id: 'CAM-IN-0104',
      name: 'Global Customer Care',
      type: 'Inbound ACD',
      attempted: '42,500',
      handled: '41,890',
      connectRate: '98.5%',
      avgWait: '0:14',
      aht: '4:32',
      transferRate: '3.2%',
      conversionRate: '22.4%',
      slaCompliance: '96.2% Met',
      slaStatus: 'met',
    },
    {
      id: 'CAM-IN-0219',
      name: 'Tier 2 Tech Escalations',
      type: 'Inbound Priority',
      attempted: '8,410',
      handled: '8,105',
      connectRate: '96.3%',
      avgWait: '1:42',
      aht: '8:15',
      transferRate: '11.8%',
      conversionRate: '18.1%',
      slaCompliance: '89.4% Warning',
      slaStatus: 'warning',
    },
    {
      id: 'CAM-OUT-4401',
      name: 'Q4 SaaS Renewals',
      type: 'Predictive',
      attempted: '18,200',
      handled: '8,100',
      connectRate: '44.5%',
      avgWait: '0:03',
      aht: '3:20',
      transferRate: '1.5%',
      conversionRate: '16.8%',
      slaCompliance: '94.8% Met',
      slaStatus: 'met',
    },
    {
      id: 'CAM-OUT-8902',
      name: 'Cold Win-Back Campaign',
      type: 'Progressive',
      attempted: '24,100',
      handled: '7,519',
      connectRate: '31.2%',
      avgWait: '0:02',
      aht: '2:55',
      transferRate: '0.8%',
      conversionRate: '8.4%',
      slaCompliance: '82.1% Breach',
      slaStatus: 'breach',
    },
  ];

  const filteredScorecard = scorecardData.filter(
    (row) =>
      row.name.toLowerCase().includes(searchCampaign.toLowerCase()) ||
      row.id.toLowerCase().includes(searchCampaign.toLowerCase()) ||
      row.type.toLowerCase().includes(searchCampaign.toLowerCase())
  );

  const handleExportPdfCsv = () => {
    const csvContent =
      'Campaign ID,Campaign Name,Type,Attempted,Handled,Connect %,Avg Wait,AHT,Transfer %,Conversion %,SLA Compliance\n' +
      scorecardData
        .map(
          (r) =>
            `"${r.id}","${r.name}","${r.type}","${r.attempted}","${r.handled}","${r.connectRate}","${r.avgWait}","${r.aht}","${r.transferRate}","${r.conversionRate}","${r.slaCompliance}"`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aetherdial_sla_scorecard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addNotification('Report Exported', 'SLA Scorecard successfully exported as CSV.', 'success');
  };

  return (
    <div className="flex-1 bg-surface-dim overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
      {/* Section 2: Report Filters Bar */}
      <section className="bg-surface-container-low border border-outline-variant rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-on-surface cursor-pointer hover:border-secondary transition-colors">
            <span className="material-symbols-outlined text-secondary text-lg">calendar_month</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-label-sm text-outline uppercase tracking-wider">Report Window</span>
              <span className="font-mono-code text-xs text-on-surface font-semibold">{dateRange}</span>
            </div>
            <span className="material-symbols-outlined text-outline text-base ml-1">expand_more</span>
          </div>

          {/* Campaign Filter */}
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-on-surface cursor-pointer hover:border-secondary transition-colors">
            <span className="material-symbols-outlined text-primary text-lg">tune</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-label-sm text-outline uppercase tracking-wider">Campaign Filter</span>
              <span className="text-xs text-on-surface font-semibold">All 12 Active Campaigns</span>
            </div>
            <span className="material-symbols-outlined text-outline text-base ml-1">expand_more</span>
          </div>

          {/* Direction Toggle */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-0.5 flex items-center">
            <button
              onClick={() => setDirectionFilter('blended')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                directionFilter === 'blended'
                  ? 'bg-surface-container-high text-secondary border border-secondary/40 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Blended
            </button>
            <button
              onClick={() => setDirectionFilter('inbound')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                directionFilter === 'inbound'
                  ? 'bg-surface-container-high text-secondary border border-secondary/40 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Inbound Only
            </button>
            <button
              onClick={() => setDirectionFilter('outbound')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                directionFilter === 'outbound'
                  ? 'bg-surface-container-high text-secondary border border-secondary/40 shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Outbound Only
            </button>
          </div>

          {/* Agent Pod Filter */}
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant rounded px-3 py-1.5 text-on-surface cursor-pointer hover:border-secondary transition-colors">
            <span className="material-symbols-outlined text-outline text-lg">groups</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-label-sm text-outline uppercase tracking-wider">Agent Pod</span>
              <span className="text-xs text-on-surface">Global Tier-1 &amp; Tier-2</span>
            </div>
            <span className="material-symbols-outlined text-outline text-base ml-1">expand_more</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdfCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-surface-container-high border border-outline-variant hover:bg-surface-bright text-on-surface rounded font-label-md text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-base text-secondary">file_download</span>
            <span>Export PDF / CSV</span>
          </button>
          <button
            onClick={() => setIsScheduleReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary/20 border border-primary/40 hover:bg-primary/30 text-primary rounded font-label-md text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-base">schedule_send</span>
            <span>Schedule Automated Report</span>
          </button>
        </div>
      </section>

      {/* Section 3: High-Impact KPI Comparison Summary (6 Telemetry Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1 */}
        <div className="bg-surface-container border border-outline-variant rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
            <span>Inbound SLA (80/20)</span>
            <span className="material-symbols-outlined text-tertiary text-base">verified</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">94.2%</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>+2.4%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Target: 90.0%</span>
            <span className="text-tertiary font-semibold font-mono-code">+4.2% Over Target</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-surface-container border border-outline-variant rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
            <span>First Call Resolution</span>
            <span className="material-symbols-outlined text-secondary text-base">task_alt</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">78.6%</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>+4.1%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Prev Cycle: 74.5%</span>
            <span className="text-on-surface font-mono-code font-semibold">1,840 Resolved</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-surface-container border border-outline-variant rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
            <span>Outbound Connect</span>
            <span className="material-symbols-outlined text-secondary text-base">ring_volume</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">42.8%</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>+7.8%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Benchmark: 35.0%</span>
            <span className="text-tertiary font-mono-code font-semibold">Predictive 4:1</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-surface-container border border-outline-variant rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
            <span>Lead-to-Sale Conv.</span>
            <span className="material-symbols-outlined text-primary text-base">monetization_on</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">14.6%</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_upward</span>+1.8%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Prior Month: 12.8%</span>
            <span className="text-secondary font-mono-code font-semibold">2,940 Closed</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div className="bg-surface-container border border-outline-variant rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
            <span>Blended AHT</span>
            <span className="material-symbols-outlined text-outline text-base">timer</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">4m 18s</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_downward</span>-14s
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-mono-code text-on-surface-variant">
            <span>IN: <strong className="text-on-surface">5m 12s</strong></span>
            <span>OUT: <strong className="text-on-surface">3m 45s</strong></span>
          </div>
        </div>

        {/* KPI 6 */}
        <div className="bg-surface-container border border-outline-variant rounded p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
            <span>Cost Per Contact</span>
            <span className="material-symbols-outlined text-tertiary text-base">savings</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono-code text-on-surface">$3.24</span>
            <span className="text-xs font-mono-code text-tertiary flex items-center font-bold">
              <span className="material-symbols-outlined text-xs">arrow_downward</span>-8.5%
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Target: &lt; $3.50</span>
            <span className="text-tertiary font-mono-code font-semibold">Efficiency Gain</span>
          </div>
        </div>
      </section>

      {/* Section 4: Visual Analytics Grids */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left: Call Volume & Connect Hourly Distribution Chart */}
        <div className="lg:col-span-8 bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">bar_chart</span>
              <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                Call Volume &amp; Connect Hourly Distribution
              </h3>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-surface-container text-outline border border-outline-variant">
                EST Zone
              </span>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-secondary"></span>
                <span className="text-on-surface-variant">Inbound Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary-container"></span>
                <span className="text-on-surface-variant">Outbound Volume</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-tertiary inline-block"></span>
                <span className="text-tertiary font-semibold">Connect Rate %</span>
              </div>
            </div>
          </div>

          {/* Stacked Bar & Connect Curve Visualization Container */}
          <div className="relative w-full h-56 pt-4 flex flex-col justify-between">
            {/* SVG Connect Curve Overlay */}
            <svg
              className="absolute inset-0 w-full h-44 pointer-events-none z-10 px-4"
              preserveAspectRatio="none"
              viewBox="0 0 1000 170"
            >
              <path
                d="M 40,130 Q 120,120 200,90 T 360,25 T 520,70 T 680,20 T 840,80 T 960,110"
                fill="none"
                stroke="#4edea3"
                strokeWidth="2.5"
              ></path>
              <circle cx="360" cy="25" fill="#4edea3" r="4.5" stroke="#0f131c" strokeWidth="2"></circle>
              <text fill="#4edea3" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="360" y="16">
                51.2% (10 AM)
              </text>
              <circle cx="680" cy="20" fill="#4edea3" r="4.5" stroke="#0f131c" strokeWidth="2"></circle>
              <text fill="#4edea3" fontFamily="Inter" fontSize="11" fontWeight="700" textAnchor="middle" x="680" y="12">
                54.8% (2 PM)
              </text>
            </svg>

            {/* Hourly Distribution Bars (08:00 to 18:00) */}
            <div className="grid grid-cols-11 gap-2 h-40 items-end z-0 px-2">
              {[
                { time: '08:00', inH: 22, outH: 18 },
                { time: '09:00', inH: 44, outH: 38 },
                { time: '10:00', inH: 72, outH: 68 },
                { time: '11:00', inH: 56, outH: 52 },
                { time: '12:00', inH: 38, outH: 32 },
                { time: '13:00', inH: 54, outH: 48 },
                { time: '14:00', inH: 78, outH: 74 },
                { time: '15:00', inH: 58, outH: 60 },
                { time: '16:00', inH: 44, outH: 42 },
                { time: '17:00', inH: 28, outH: 26 },
                { time: '18:00', inH: 16, outH: 14 },
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center h-full justify-end group cursor-pointer">
                  <div className="w-full flex flex-col items-center">
                    <div
                      className="w-full max-w-[28px] bg-primary-container group-hover:brightness-125 transition-all"
                      style={{ height: `${bar.outH}px` }}
                      title={`Outbound: ${bar.outH * 24} calls`}
                    ></div>
                    <div
                      className="w-full max-w-[28px] bg-secondary rounded-t group-hover:brightness-125 transition-all"
                      style={{ height: `${bar.inH}px` }}
                      title={`Inbound: ${bar.inH * 24} calls`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* X-Axis Labels */}
            <div className="grid grid-cols-11 gap-2 pt-2 border-t border-outline-variant/40 text-center font-mono-code text-[11px] text-outline">
              <span>08:00</span>
              <span>09:00</span>
              <span className="text-tertiary font-bold">10:00</span>
              <span>11:00</span>
              <span>12:00</span>
              <span>13:00</span>
              <span className="text-tertiary font-bold">14:00</span>
              <span>15:00</span>
              <span>16:00</span>
              <span>17:00</span>
              <span>18:00</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-outline pt-1">
            <span>Composite Aggregate: 93,210 Concurrent Minutes Analyzed</span>
            <span className="text-secondary font-mono-code">Dialer Auto-Scaling Pacing: Optimal</span>
          </div>
        </div>

        {/* Right: Disposition Breakdown Donut Chart */}
        <div className="lg:col-span-4 bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">pie_chart</span>
              <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                Disposition Breakdown
              </h3>
            </div>
            <span className="text-[11px] text-outline font-mono-code">100% Blended</span>
          </div>

          {/* Donut Graphic + Core Stats */}
          <div className="flex items-center justify-center gap-4 py-1">
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="none" r="14" stroke="#1c2028" strokeWidth="4.5"></circle>
                {/* Completed Sale (34%) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#4edea3"
                  strokeDasharray="29.9 58.1"
                  strokeDashoffset="0"
                  strokeWidth="4.5"
                ></circle>
                {/* Follow Up (26%) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#4cd7f6"
                  strokeDasharray="22.8 65.2"
                  strokeDashoffset="-29.9"
                  strokeWidth="4.5"
                ></circle>
                {/* Voicemail (22%) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#8083ff"
                  strokeDasharray="19.3 68.7"
                  strokeDashoffset="-52.7"
                  strokeWidth="4.5"
                ></circle>
                {/* Disqualified (12%) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#f59e0b"
                  strokeDasharray="10.5 77.5"
                  strokeDashoffset="-72.0"
                  strokeWidth="4.5"
                ></circle>
                {/* DNC (6%) */}
                <circle
                  cx="18"
                  cy="18"
                  fill="none"
                  r="14"
                  stroke="#ffb4ab"
                  strokeDasharray="5.3 82.7"
                  strokeDashoffset="-82.5"
                  strokeWidth="4.5"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase text-outline">Total</span>
                <span className="text-base font-mono-code font-bold text-on-surface">93.2k</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-xs">
              <span className="text-tertiary font-bold">Top Yield: Sales</span>
              <span className="text-on-surface-variant text-[11px]">Strong conversion velocity in Tier-1 Pods</span>
              <div className="mt-1 text-[11px] font-mono-code text-outline">
                Confidence: <span className="text-on-surface font-semibold">99.4%</span>
              </div>
            </div>
          </div>

          {/* Breakdown Legend */}
          <div className="flex flex-col gap-1.5 border-t border-outline-variant/40 pt-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary"></span>
                <span className="text-on-surface">Completed Sale</span>
              </div>
              <span className="font-mono-code font-semibold text-tertiary">34% (31,688)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span className="text-on-surface">Follow Up Scheduled</span>
              </div>
              <span className="font-mono-code font-semibold text-secondary">26% (24,232)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                <span className="text-on-surface">Voicemail Left</span>
              </div>
              <span className="font-mono-code font-semibold text-primary">22% (20,504)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                <span className="text-on-surface">Disqualified</span>
              </div>
              <span className="font-mono-code font-semibold text-[#f59e0b]">12% (11,184)</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span className="text-on-surface">DNC / Opt-out</span>
              </div>
              <span className="font-mono-code font-semibold text-error">6% (5,592)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4.5: Customer Sentiment & Emotional Trajectory Trend Chart (Recharts) */}
      <section className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3 shadow-xs">
        {/* Header & Controls Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-tertiary-container/30 border border-tertiary/40 flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined text-lg">timeline</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
                  Customer Sentiment &amp; Emotional Trajectory Over Time
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-code font-bold bg-tertiary-container/20 text-tertiary border border-tertiary/40">
                  RECHARTS TRENDLINE
                </span>
              </div>
              <span className="text-[11px] text-outline font-mono-code block">
                Continuous AI Speech Analytics &bull; Emotional Outcome Tracking for Supervisors
              </span>
            </div>
          </div>

          {/* Supervisor Controls Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded p-0.5 flex items-center">
              <button
                onClick={() => setSentimentViewMode('stream')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                  sentimentViewMode === 'stream'
                    ? 'bg-surface-container-high text-tertiary border border-tertiary/40 shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xs">graphic_eq</span>
                <span>Interaction Stream</span>
              </button>
              <button
                onClick={() => setSentimentViewMode('hourly')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center gap-1 ${
                  sentimentViewMode === 'hourly'
                    ? 'bg-surface-container-high text-tertiary border border-tertiary/40 shadow-xs'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-xs">schedule</span>
                <span>Hourly Composite</span>
              </button>
            </div>

            {/* Direction Filter */}
            <div className="flex items-center gap-1 bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-xs">
              <span className="text-outline text-[11px]">Direction:</span>
              <select
                value={sentimentDirFilter}
                onChange={(e) => setSentimentDirFilter(e.target.value as any)}
                className="bg-transparent text-on-surface font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="all" className="bg-surface-container-lowest">Blended (All)</option>
                <option value="inbound" className="bg-surface-container-lowest">Inbound Only</option>
                <option value="outbound" className="bg-surface-container-lowest">Outbound Only</option>
              </select>
            </div>

            {/* Toggles */}
            <button
              onClick={() => setShowMovingAverage(!showMovingAverage)}
              className={`px-2 py-1 rounded text-xs font-mono-code border transition-colors flex items-center gap-1 ${
                showMovingAverage
                  ? 'bg-[#8083ff]/15 text-[#8083ff] border-[#8083ff]/40 font-bold'
                  : 'bg-surface-container-lowest text-outline border-outline-variant'
              }`}
              title="Toggle Rolling Moving Average Trendline"
            >
              <span className="w-2.5 h-0.5 bg-[#8083ff] inline-block"></span>
              <span>MA-3 Trend</span>
            </button>

            <button
              onClick={() => setShowThresholdLines(!showThresholdLines)}
              className={`px-2 py-1 rounded text-xs font-mono-code border transition-colors flex items-center gap-1 ${
                showThresholdLines
                  ? 'bg-tertiary/15 text-tertiary border-tertiary/40 font-bold'
                  : 'bg-surface-container-lowest text-outline border-outline-variant'
              }`}
              title="Toggle SLA Target (75%) and Attention Alert (50%) lines"
            >
              <span className="material-symbols-outlined text-xs">straighten</span>
              <span>SLA Limits</span>
            </button>
          </div>
        </div>

        {/* Supervisor Emotional Outcome Telemetry KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-surface-container-lowest border border-outline-variant rounded p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono-code text-outline uppercase">AVG EMOTIONAL SCORE</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono-code text-tertiary">{sentimentStats.avg}%</span>
              <span className="text-[11px] font-mono-code text-tertiary font-bold flex items-center">
                <span className="material-symbols-outlined text-xs">arrow_upward</span>+4.2%
              </span>
            </div>
            <span className="text-[10px] text-outline font-mono-code">SLA Baseline: 75%</span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono-code text-outline uppercase">POSITIVE RATIO (≥75%)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono-code text-secondary">{sentimentStats.positivePct}%</span>
              <span className="text-[11px] font-mono-code text-secondary font-bold">Healthy</span>
            </div>
            <span className="text-[10px] text-outline font-mono-code">Delighted / Receptive</span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono-code text-outline uppercase">ATTENTION FLAGS (&lt;50%)</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className={`text-lg font-bold font-mono-code ${sentimentStats.alertCount > 0 ? 'text-error' : 'text-tertiary'}`}>
                {sentimentStats.alertCount} Alert{sentimentStats.alertCount !== 1 ? 's' : ''}
              </span>
              <span className="text-[11px] font-mono-code text-outline font-medium">Auto-Flagged</span>
            </div>
            <span className="text-[10px] text-outline font-mono-code">Spam or Frustration</span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-mono-code text-outline uppercase">PEAK RECORDED SCORE</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono-code text-tertiary">{sentimentStats.highest}%</span>
              <span className="text-[11px] font-mono-code text-tertiary font-semibold">David Kim</span>
            </div>
            <span className="text-[10px] text-outline font-mono-code">Biometric Verified</span>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded p-2.5 flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono-code text-outline uppercase">TREND DIRECTION</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono-code text-[#8083ff]">Ascending</span>
              <span className="material-symbols-outlined text-base text-[#8083ff]">trending_up</span>
            </div>
            <span className="text-[10px] text-outline font-mono-code">3-Point Rolling MA</span>
          </div>
        </div>

        {/* Legend & Instructions Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs font-mono-code text-outline px-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-tertiary inline-block"></span>
              <span className="w-2 h-2 rounded-full bg-tertiary inline-block"></span>
              <span className="text-on-surface">Call Sentiment Score</span>
            </div>
            {showMovingAverage && (
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-[#8083ff] inline-block border-b border-dashed border-[#8083ff]"></span>
                <span className="text-[#8083ff]">MA-3 Trendline</span>
              </div>
            )}
            {sentimentViewMode === 'hourly' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-secondary inline-block"></span>
                  <span className="text-secondary">Inbound Avg</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#f59e0b] inline-block"></span>
                  <span className="text-[#f59e0b]">Outbound Avg</span>
                </div>
              </>
            )}
            {showThresholdLines && (
              <>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-tertiary/60"></span>
                  <span className="text-tertiary text-[11px]">SLA Target 75%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-error/60"></span>
                  <span className="text-error text-[11px]">Warning 50%</span>
                </div>
              </>
            )}
          </div>
          <span className="text-[11px] text-outline">
            {sentimentViewMode === 'stream'
              ? 'Click any node to inspect emotional breakdown'
              : 'Aggregated across contact center hours'}
          </span>
        </div>

        {/* Recharts Line / Composed Chart Canvas */}
        <div className="w-full h-72 bg-surface-container-lowest/80 border border-outline-variant/60 rounded p-2 pt-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={activeChartData}
              margin={{ top: 12, right: 25, left: -10, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length && e.activePayload[0].payload.rawLog) {
                  setSelectedCallId(e.activePayload[0].payload.rawLog.id);
                }
              }}
            >
              <defs>
                <linearGradient id="sentimentAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4edea3" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#4edea3" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#252b3b" vertical={false} />

              <XAxis
                dataKey="timeLabel"
                stroke="#8a93a5"
                fontSize={10}
                tickLine={false}
                fontFamily="monospace"
              />

              <YAxis
                domain={[0, 100]}
                stroke="#8a93a5"
                fontSize={10}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                fontFamily="monospace"
                ticks={[0, 25, 50, 75, 100]}
              />

              <Tooltip
                content={({ active, payload }: any) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isStream = sentimentViewMode === 'stream';
                    return (
                      <div className="bg-surface-container-highest/95 backdrop-blur-md border border-outline-variant p-3 rounded shadow-xl text-xs max-w-xs z-50">
                        <div className="flex items-center justify-between border-b border-outline-variant/60 pb-1.5 mb-2 gap-2">
                          <span className="font-mono-code text-[11px] text-outline font-semibold">
                            {isStream ? data.callId || data.shortTime : `Time Window: ${data.timeLabel}`}
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono-code font-bold"
                            style={{
                              backgroundColor: `${data.emotionColor || '#4edea3'}20`,
                              color: data.emotionColor || '#4edea3',
                              border: `1px solid ${data.emotionColor || '#4edea3'}40`,
                            }}
                          >
                            {data.emotionLabel || 'Active'}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-on-surface-variant text-[11px]">Sentiment Score:</span>
                            <span className="font-mono-code font-bold text-sm text-tertiary">
                              {data.sentimentScore}%
                            </span>
                          </div>

                          {showMovingAverage && data.movingAverage !== undefined && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-outline">Rolling Trendline (MA-3):</span>
                              <span className="font-mono-code text-[#8083ff] font-semibold">
                                {data.movingAverage}%
                              </span>
                            </div>
                          )}

                          {isStream ? (
                            <>
                              <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-outline-variant/40">
                                <span className="text-outline">Caller / Account:</span>
                                <span className="font-semibold text-on-surface truncate max-w-[140px]">
                                  {data.callerName} ({data.company})
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-outline">Agent &amp; Direction:</span>
                                <span className="text-secondary font-mono-code">
                                  {data.agentName} &bull; {data.direction}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-outline">Disposition:</span>
                                <span className="text-on-surface font-mono-code">{data.outcome}</span>
                              </div>
                              {data.rawLog?.keyTakeaways?.[0] && (
                                <div className="pt-1.5 mt-1 border-t border-outline-variant/40 text-[10px] text-on-surface-variant line-clamp-2">
                                  <span className="text-tertiary font-bold">Takeaway: </span>
                                  {data.rawLog.keyTakeaways[0]}
                                </div>
                              )}
                              <div className="pt-1 text-[10px] text-secondary font-mono-code text-center">
                                Click node to open full inspection
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-outline-variant/40">
                              <span className="text-outline">Hourly Calls Analyzed:</span>
                              <span className="font-mono-code text-on-surface font-semibold">
                                {data.callCount} calls
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {showThresholdLines && (
                <>
                  <ReferenceLine
                    y={75}
                    stroke="#4edea3"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Target SLA Benchmark (75%)',
                      position: 'insideTopRight',
                      fill: '#4edea3',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                  />
                  <ReferenceLine
                    y={50}
                    stroke="#ffb4ab"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: 'Supervisor Alert (50%)',
                      position: 'insideBottomRight',
                      fill: '#ffb4ab',
                      fontSize: 10,
                      fontFamily: 'monospace',
                    }}
                  />
                </>
              )}

              <Area
                type="monotone"
                dataKey="sentimentScore"
                stroke="transparent"
                fill="url(#sentimentAreaGrad)"
              />

              <Line
                type="monotone"
                dataKey="sentimentScore"
                name="Sentiment Score"
                stroke="#4edea3"
                strokeWidth={2.5}
                dot={{ fill: '#4edea3', r: 4, stroke: '#0f131c', strokeWidth: 1.5 }}
                activeDot={{ r: 6, fill: '#4edea3', stroke: '#ffffff', strokeWidth: 2, cursor: 'pointer' }}
              />

              {showMovingAverage && (
                <Line
                  type="monotone"
                  dataKey="movingAverage"
                  name="Rolling Trendline (MA-3)"
                  stroke="#8083ff"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}

              {sentimentViewMode === 'hourly' && (
                <>
                  <Line
                    type="monotone"
                    dataKey="inboundScore"
                    name="Inbound Avg"
                    stroke="#4cd7f6"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={{ r: 3, fill: '#4cd7f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outboundScore"
                    name="Outbound Avg"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="2 2"
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Selected Call Drill-Down Card for Supervisor */}
        {selectedCall && (
          <div className="p-3.5 bg-surface-container rounded border border-tertiary/40 flex flex-col gap-2.5 transition-all">
            <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-base">psychology</span>
                <span className="font-bold text-xs text-on-surface">
                  Inspected Interaction Emotional Profile: {selectedCall.callId}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold ${
                    selectedCall.sentimentScore >= 75
                      ? 'bg-tertiary/15 text-tertiary border border-tertiary/40'
                      : selectedCall.sentimentScore >= 50
                      ? 'bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40'
                      : 'bg-error-container/40 text-error border border-error/40'
                  }`}
                >
                  {selectedCall.sentimentScore}% CSAT Score
                </span>
              </div>
              <button
                onClick={() => setSelectedCallId(null)}
                className="text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors"
                title="Close Inspection"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-code">
              <div>
                <span className="text-outline block text-[10px] uppercase">Customer / Company</span>
                <span className="font-bold text-on-surface">{selectedCall.callerName}</span>
                <span className="text-[10px] text-secondary truncate block">{selectedCall.company}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Agent &amp; Direction</span>
                <span className="text-on-surface font-semibold">{selectedCall.agentName}</span>
                <span className="text-[10px] text-outline uppercase block">{selectedCall.direction}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Outcome</span>
                <span className="text-tertiary font-bold">{selectedCall.outcome}</span>
                <span className="text-[10px] text-outline block">{selectedCall.timestamp}</span>
              </div>
              <div>
                <span className="text-outline block text-[10px] uppercase">Emotional State</span>
                <span className="text-on-surface font-bold">
                  {selectedCall.sentimentScore >= 80
                    ? 'Delighted / High Trust'
                    : selectedCall.sentimentScore >= 65
                    ? 'Receptive / Professional'
                    : selectedCall.sentimentScore >= 50
                    ? 'Hesitant / Evaluating'
                    : 'Critical / Frustrated'}
                </span>
                <span className="text-[10px] text-outline block">STIR/SHAKEN Verified</span>
              </div>
            </div>

            {/* AI Summary & Key Takeaways if available */}
            {selectedCall.summary && (
              <div className="p-2.5 rounded bg-surface-container-lowest border border-outline-variant text-xs">
                <span className="text-[10px] font-mono-code text-tertiary uppercase font-bold block mb-1">
                  AI Summary &amp; Emotional Driver
                </span>
                <p className="text-on-surface leading-relaxed text-[11px] mb-2">{selectedCall.summary}</p>
                {selectedCall.keyTakeaways && selectedCall.keyTakeaways.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-outline-variant/40">
                    <span className="text-[10px] text-outline font-mono-code uppercase block">
                      Bulleted Takeaways:
                    </span>
                    <ul className="space-y-0.5">
                      {selectedCall.keyTakeaways.slice(0, 3).map((takeaway, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-on-surface">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-1 shrink-0"></span>
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Supervisor Summary Footer */}
        <div className="flex flex-wrap items-center justify-between text-xs text-outline pt-1 border-t border-outline-variant/40">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-tertiary">check_circle</span>
            <span>
              <strong>{sentimentStats.positivePct}%</strong> of customer interactions maintained positive emotional valence above the 75% SLA threshold.
            </span>
          </span>
          <span className="font-mono-code text-[11px] text-secondary">
            Voice Sentiment Telemetry Engine &bull; Zero MOS Degradation
          </span>
        </div>
      </section>

      {/* Section 5: Campaign & Agent Performance Scorecard Table */}
      <section className="bg-surface-container-low border border-outline-variant rounded p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-lg">table_chart</span>
            <h3 className="text-headline-sm font-headline-sm font-bold text-on-surface">
              Campaign &amp; Agent Performance Scorecard
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-surface-container-high text-on-surface-variant border border-outline-variant">
              Historical Aggregates
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-outline text-sm">
                filter_list
              </span>
              <input
                type="text"
                value={searchCampaign}
                onChange={(e) => setSearchCampaign(e.target.value)}
                placeholder="Filter campaigns..."
                className="bg-surface-container-lowest border border-outline-variant rounded pl-7 pr-2.5 py-1 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
              />
            </div>
            <button
              onClick={handleExportPdfCsv}
              className="px-2.5 py-1 bg-surface-container-high border border-outline-variant text-on-surface rounded font-label-md text-xs hover:bg-surface-bright transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>CSV Dump</span>
            </button>
          </div>
        </div>

        {/* Scrollable High Density Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-container-lowest/60 text-[11px] font-label-sm text-outline uppercase tracking-wider font-mono-code">
                <th className="py-2.5 px-3">Campaign Name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3 text-right">Attempted</th>
                <th className="py-2.5 px-3 text-right">Handled</th>
                <th className="py-2.5 px-3 text-right">Connect %</th>
                <th className="py-2.5 px-3 text-right">Avg Wait</th>
                <th className="py-2.5 px-3 text-right">AHT</th>
                <th className="py-2.5 px-3 text-right">Transfer %</th>
                <th className="py-2.5 px-3 text-right">Conversion %</th>
                <th className="py-2.5 px-3 text-center">SLA Compliance</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 text-xs font-mono-code">
              {filteredScorecard.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedScorecardRow(row.id === selectedScorecardRow ? null : row.id)}
                  className="hover:bg-surface-container-high/50 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-3 font-sans font-medium text-on-surface flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        row.slaStatus === 'met'
                          ? 'bg-tertiary'
                          : row.slaStatus === 'warning'
                          ? 'bg-[#f59e0b]'
                          : 'bg-error'
                      }`}
                    ></span>
                    <div>
                      <div className="font-bold">{row.name}</div>
                      <div className="text-[10px] text-outline font-mono-code">ID: {row.id}</div>
                    </div>
                  </td>

                  <td className="py-3 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[11px] bg-secondary/10 text-secondary border border-secondary/30">
                      {row.type}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right text-on-surface-variant">{row.attempted}</td>
                  <td className="py-3 px-3 text-right font-semibold text-on-surface">{row.handled}</td>
                  <td className="py-3 px-3 text-right text-tertiary font-bold">{row.connectRate}</td>
                  <td className="py-3 px-3 text-right text-on-surface-variant">{row.avgWait}</td>
                  <td className="py-3 px-3 text-right text-on-surface">{row.aht}</td>
                  <td className="py-3 px-3 text-right text-on-surface-variant">{row.transferRate}</td>
                  <td className="py-3 px-3 text-right text-secondary font-semibold">{row.conversionRate}</td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 border ${
                        row.slaStatus === 'met'
                          ? 'bg-tertiary/15 text-tertiary border-tertiary/40'
                          : row.slaStatus === 'warning'
                          ? 'bg-[#f59e0b]/15 text-[#f59e0b] border-[#f59e0b]/40'
                          : 'bg-error-container/40 text-error border-error/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          row.slaStatus === 'met'
                            ? 'bg-tertiary'
                            : row.slaStatus === 'warning'
                            ? 'bg-[#f59e0b]'
                            : 'bg-error'
                        }`}
                      ></span>
                      {row.slaCompliance}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addNotification('Telemetry Inspect', `Inspecting packet logs for ${row.name} (${row.id}).`, 'info');
                      }}
                      className="p-1 text-on-surface-variant hover:text-secondary hover:bg-surface-container-highest rounded transition-colors"
                      title="Inspect Telemetry Logs"
                    >
                      <span className="material-symbols-outlined text-lg">troubleshoot</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-outline-variant/40 text-xs text-outline">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-on-surface font-mono-code">1 - {filteredScorecard.length}</strong> of{' '}
              <strong className="text-on-surface font-mono-code">{scorecardData.length}</strong> Active Campaigns
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono-code">
            <button className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-bold text-xs">1</button>
            <button className="px-2.5 py-1 rounded hover:bg-surface-container-high text-on-surface-variant text-xs">2</button>
            <button className="px-2.5 py-1 rounded hover:bg-surface-container-high text-on-surface-variant text-xs">3</button>
          </div>
        </div>
      </section>
    </div>
  );
};
