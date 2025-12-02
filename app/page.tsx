'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import { 
  Calendar, ChevronDown, Filter, ArrowUpRight, ArrowDownRight,
  Bell, Globe, Server, Layers, Users, Palette, Sparkles
} from 'lucide-react';

/**
 * --- TYPESCRIPT INTERFACES ---
 */

interface RowData {
  date: string;
  displayDate: string;
  region: string;
  persona: string;
  inbox_provider: string;
  campaign_name: string;
  ttl_bucket: string;
  revenue_range: string;
  emails_sent: number;
  replies: number;
  positive_replies: number;
  meetings_booked: number;
  bounces: number;
  estimated_pipeline_value: number;
  planned_sent: number;
  planned_replies: number;
  planned_mqls: number;
  planned_sqls: number;
  planned_bounces: number;
  [key: string]: string | number;
}

interface AggregatedDay {
  date: string;
  displayDate: string;
  emails_sent: number;
  planned_sent: number;
  replies: number;
  planned_replies: number;
  positive_replies: number;
  planned_mqls: number;
  meetings_booked: number;
  planned_sqls: number;
  bounces: number;
  planned_bounces: number;
}

/**
 * --- RAW DATA SIMULATION ---
 */

const SEASONALITY: { [key: number]: number } = {
  0: 1.2, 1: 1.2, 2: 1.1, 3: 1.0, 4: 0.9, 
  5: 0.2, 6: 0.2, // Summer Slump (June/July) - 80% Drop
  7: 1.1, 8: 1.3, 9: 1.4, 10: 1.4, 11: 1.0
};

const SEGMENTS = {
  regions: ['US', 'UK', 'Ireland'],
  personas: ['Talent Acquisition', 'HR Director', 'Employer Branding'],
  inboxes: ['Google Workspace', 'Outlook 365', 'Azure', 'SMTP'],
  campaigns: ['Campaign A', 'Campaign B', 'Campaign C', 'Campaign D'],
  ttlBuckets: ['< 5 mins', '5-30 mins', '30-60 mins', '1-4 hours', '> 24 hours'],
  revenueRanges: ['< $1M', '$1M - $10M', '$10M - $50M', '$50M+']
};

const generateRawCSVData = (): RowData[] => {
  const rows: RowData[] = [];
  const anchorDate = new Date('2024-10-25T12:00:00'); 

  for (let i = 120; i >= 0; i--) {
    const currentDate = new Date(anchorDate);
    currentDate.setDate(currentDate.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];
    const month = currentDate.getMonth();
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    const seasonFactor = SEASONALITY[month] || 1.0;
    const numSegments = isWeekend ? 2 : 12;

    for (let j = 0; j < numSegments; j++) {
      const region = SEGMENTS.regions[Math.floor(Math.random() * SEGMENTS.regions.length)];
      const persona = SEGMENTS.personas[Math.floor(Math.random() * SEGMENTS.personas.length)];
      const inbox = SEGMENTS.inboxes[Math.floor(Math.random() * SEGMENTS.inboxes.length)];
      const campaign = SEGMENTS.campaigns[Math.floor(Math.random() * SEGMENTS.campaigns.length)];
      const revenue = SEGMENTS.revenueRanges[Math.floor(Math.random() * SEGMENTS.revenueRanges.length)];
      const ttlBucket = SEGMENTS.ttlBuckets[Math.floor(Math.random() * SEGMENTS.ttlBuckets.length)];

      const baseVol = 250; 
      const noise = 0.85 + Math.random() * 0.3; 
      
      const emailsSent = Math.floor(baseVol * seasonFactor * noise);
      const plannedSent = Math.floor(baseVol * seasonFactor);

      const replyRate = 0.018 + (Math.random() * 0.007); 
      const replies = Math.floor(emailsSent * replyRate);
      const plannedReplies = Math.floor(plannedSent * 0.02); 

      const positiveRate = 0.35;
      const positiveReplies = Math.floor(replies * positiveRate);
      const plannedMQLs = Math.floor(plannedReplies * 0.35);

      const meetingRate = 0.60;
      const meetingsBooked = Math.floor(positiveReplies * meetingRate);
      const plannedSQLs = Math.floor(plannedMQLs * 0.60);

      const bounceRate = inbox === 'SMTP' ? 0.03 : 0.012; 
      const bounces = Math.floor(emailsSent * bounceRate);
      const plannedBounces = Math.floor(plannedSent * 0.015);

      const estValue = meetingsBooked * (revenue === '$50M+' ? 50000 : 15000);

      rows.push({
        date: dateStr,
        displayDate: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        region,
        persona,
        inbox_provider: inbox,
        campaign_name: campaign,
        ttl_bucket: ttlBucket,
        revenue_range: revenue,
        emails_sent: emailsSent,
        replies: replies,
        positive_replies: positiveReplies, 
        meetings_booked: meetingsBooked,   
        bounces: bounces,
        estimated_pipeline_value: estValue,
        planned_sent: plannedSent,
        planned_replies: plannedReplies,
        planned_mqls: plannedMQLs,
        planned_sqls: plannedSQLs,
        planned_bounces: plannedBounces
      });
    }
  }
  return rows;
};

/**
 * --- COLORS & FONTS ---
 */
const COLORS = {
  purpleDark: '#1c024e',  // Dark Indigo (Cards)
  purpleLight: '#352c47', // Light Purple (App BG)
  green: '#077005',       // Success
  red: '#700805',         // Error
  white: '#fefefe'        // Text
};

const FONTS = {
  head: 'font-[family-name:var(--font-playfair-display),serif]',
  body: 'font-[family-name:var(--font-inter),sans-serif]',
};

/**
 * --- COMPONENTS ---
 */

interface ThemeConfig {
  appBg: string;
  cardBg: string;
  headerBg: string;
  borderColor: string;
  radius: string;
  drillText: string;
  isGlass: boolean;
  shadow: string;
}

const getTheme = (mode: 'ruadhan' | 'best'): ThemeConfig => {
  if (mode === 'best') {
    return {
      appBg: 'bg-[#352c47]',
      cardBg: 'bg-gradient-to-b from-[#1c024e] to-[#15013b]', // Subtle gradient
      headerBg: 'bg-[#1c024e]/90 backdrop-blur-md',
      borderColor: 'border-white/10',
      radius: 'rounded-2xl',
      drillText: 'text-indigo-200',
      isGlass: true,
      shadow: 'shadow-xl shadow-black/20'
    };
  }
  // Ruadhan Strict Mode
  return {
    appBg: 'bg-[#352c47]',
    cardBg: 'bg-[#1c024e]',
    headerBg: 'bg-[#1c024e]',
    borderColor: 'border-white/5',
    radius: 'rounded-lg', // "Apply some border radius"
    drillText: 'text-[#d8d4e3]', // Readable approximation of light purple
    isGlass: false,
    shadow: 'shadow-none'
  };
};

interface StatCardProps {
  title: string;
  value: string | undefined;
  subValue: string | undefined;
  trend: string;
  isActive: boolean;
  onClick: () => void;
  bgColor?: string; 
  theme: ThemeConfig;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, isActive, onClick, bgColor, theme }) => {
  // Use Theme Card BG unless overridden by specific color (Green/Red)
  const cardBackground = bgColor 
    ? bgColor 
    : (theme.isGlass ? theme.cardBg : 'bg-[#1c024e]'); // Explicit hex for Ruadhan mode to be safe
  
  // Clean classes for background
  const bgClass = bgColor ? '' : theme.cardBg;
  const bgStyle = bgColor ? { backgroundColor: bgColor } : {};

  return (
    <button 
      onClick={onClick}
      className={`
        relative overflow-hidden p-6 text-left w-full group ${theme.radius} ${theme.shadow}
        transition-all duration-300 border ${theme.borderColor}
        ${isActive ? 'ring-2 ring-white z-10 scale-[1.02]' : 'hover:border-white/20'}
        ${bgClass}
      `}
      style={bgStyle}
    >
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70 font-playfair">{title}</p>
        {trend && (
          <span className="flex items-center text-[10px] font-inter font-bold px-2 py-0.5 rounded-full bg-white/10 text-white">
            {parseFloat(trend) > 0 ? <ArrowUpRight size={10} className="mr-1"/> : <ArrowDownRight size={10} className="mr-1"/>}
            {Math.abs(parseFloat(trend))}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight text-white font-playfair">{value}</h3>
        <div className="flex items-center mt-2 gap-2">
           <span className="text-[10px] font-medium uppercase tracking-wide text-white/50 font-inter">Goal</span>
           <span className="text-xs font-semibold text-white/90 font-inter">{subValue}</span>
        </div>
      </div>
    </button>
  );
};

interface DrillDownItem {
  name: string;
  value: number;
}

interface DrillDownTableProps {
  title: string;
  icon: React.ElementType;
  data: DrillDownItem[];
  total: number;
  theme: ThemeConfig;
}

const DrillDownTable: React.FC<DrillDownTableProps> = ({ title, icon: Icon, data, total, theme }) => (
  <div className={`flex flex-col h-full overflow-hidden border ${theme.borderColor} ${theme.radius} ${theme.cardBg} ${theme.shadow}`}>
    <div className={`px-5 py-4 border-b ${theme.borderColor} flex items-center justify-between bg-black/10`}>
      <h4 className="font-bold flex items-center gap-2 text-sm font-playfair tracking-wide text-white">
        <Icon size={16} className="text-white/70" /> {title}
      </h4>
    </div>
    <div className="p-5 flex-1 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-white/20">
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between text-xs mb-1.5">
              {/* This is the "Light Purple" text instruction */}
              <span className={`font-medium font-inter ${theme.drillText}`}>{item.name}</span>
              <div className="text-right">
                <span className="font-mono font-bold text-white font-inter">{item.value.toLocaleString()}</span>
                <span className="ml-1 text-[10px] text-white/50 font-inter">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
            <div className="w-full h-1 overflow-hidden bg-white/10 rounded-full">
              <div 
                className="h-full opacity-80 group-hover:opacity-100 transition-all duration-500 bg-white rounded-full" 
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 shadow-2xl border border-white/10 text-xs font-inter backdrop-blur-xl bg-[#1c024e]/90 rounded-lg">
        <p className="font-bold mb-2 border-b border-white/10 pb-1 text-white/70">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-4 mb-1 justify-between">
            <span className="capitalize font-medium text-white/70">{entry.name}:</span>
            <span className="font-mono font-bold text-white">{entry.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SalesDashboard() {
  const [activeMetric, setActiveMetric] = useState<string>('meetings_booked'); 
  const [rawData, setRawData] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [designMode, setDesignMode] = useState<'ruadhan' | 'best'>('ruadhan');

  const theme = useMemo(() => getTheme(designMode), [designMode]);
  
  // Initialize Raw Data
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      const data = generateRawCSVData();
      setRawData(data);
      setIsLoading(false);
    }, 600);
  }, []);

  /**
   * --- AGGREGATION ENGINE ---
   */

  const chartData = useMemo(() => {
    if (!rawData.length) return [];
    
    const dateMap = new Map<string, AggregatedDay>();
    
    rawData.forEach(row => {
      if (!dateMap.has(row.date)) {
        dateMap.set(row.date, {
          date: row.date,
          displayDate: row.displayDate,
          emails_sent: 0, planned_sent: 0,
          replies: 0, planned_replies: 0,
          positive_replies: 0, planned_mqls: 0,
          meetings_booked: 0, planned_sqls: 0,
          bounces: 0, planned_bounces: 0
        });
      }
      const day = dateMap.get(row.date)!;
      day.emails_sent += row.emails_sent;
      day.planned_sent += row.planned_sent;
      day.replies += row.replies;
      day.planned_replies += row.planned_replies;
      day.positive_replies += row.positive_replies;
      day.planned_mqls += row.planned_mqls;
      day.meetings_booked += row.meetings_booked;
      day.planned_sqls += row.planned_sqls;
      day.bounces += row.bounces;
      day.planned_bounces += row.planned_bounces;
    });

    return Array.from(dateMap.values()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rawData]);

  const chartMax = useMemo(() => {
    if (!chartData.length) return 0;
    const config = { actual: activeMetric, planned: `planned_${activeMetric.split('_')[0] === 'positive' ? 'mqls' : activeMetric === 'meetings_booked' ? 'sqls' : 'sent'}` };
    // @ts-ignore
    return Math.max(...chartData.map(d => Math.max(d[activeMetric] || 0, d[config.planned] || 0))) * 1.1;
  }, [chartData, activeMetric]);

  const totals = useMemo(() => {
    return rawData.reduce((acc, row) => ({
      emails_sent: (acc.emails_sent || 0) + row.emails_sent,
      planned_sent: (acc.planned_sent || 0) + row.planned_sent,
      replies: (acc.replies || 0) + row.replies,
      planned_replies: (acc.planned_replies || 0) + row.planned_replies,
      positive_replies: (acc.positive_replies || 0) + row.positive_replies,
      planned_mqls: (acc.planned_mqls || 0) + row.planned_mqls,
      meetings_booked: (acc.meetings_booked || 0) + row.meetings_booked,
      planned_sqls: (acc.planned_sqls || 0) + row.planned_sqls,
      bounces: (acc.bounces || 0) + row.bounces,
      planned_bounces: (acc.planned_bounces || 0) + row.planned_bounces,
    }), {} as Partial<AggregatedDay>);
  }, [rawData]);

  const getGroupedData = (field: string) => {
    const groups: { [key: string]: number } = {};
    let total = 0;
    
    rawData.forEach(row => {
      const key = row[field] as string;
      const value = row[activeMetric] as number;
      groups[key] = (groups[key] || 0) + value;
      total += value;
    });

    return {
      data: Object.entries(groups)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value),
      total
    };
  };

  const inboxStats = useMemo(() => getGroupedData('inbox_provider'), [rawData, activeMetric]);
  const regionStats = useMemo(() => getGroupedData('region'), [rawData, activeMetric]);
  const personaStats = useMemo(() => getGroupedData('persona'), [rawData, activeMetric]);
  const campaignStats = useMemo(() => getGroupedData('campaign_name'), [rawData, activeMetric]);

  const getChartConfig = () => {
    const baseColor = COLORS.white;
    switch (activeMetric) {
      case 'emails_sent': return { actual: 'emails_sent', planned: 'planned_sent', color: baseColor, label: 'Emails Sent' };
      case 'replies': return { actual: 'replies', planned: 'planned_replies', color: baseColor, label: 'Replies' };
      case 'positive_replies': return { actual: 'positive_replies', planned: 'planned_mqls', color: baseColor, label: 'MQLs (Positive)' };
      case 'meetings_booked': return { actual: 'meetings_booked', planned: 'planned_sqls', color: baseColor, label: 'SQLs (Meetings)' };
      case 'bounces': return { actual: 'bounces', planned: 'planned_bounces', color: baseColor, label: 'Bounces' };
      default: return { actual: 'emails_sent', planned: 'planned_sent', color: baseColor, label: 'Emails Sent' };
    }
  };

  const config = getChartConfig();

  return (
    <>
      {/* Inject Fonts directly */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className={`min-h-screen transition-colors duration-500 pb-20 font-inter ${theme.appBg}`}>
        
        {/* --- HEADER --- */}
        <header className={`sticky top-0 z-50 transition-all duration-500 border-b ${theme.borderColor} ${theme.headerBg}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src="/logo.png" 
                    alt="GTMA Logo" 
                    className="h-10 w-auto object-contain transition-all duration-300"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    onError={(e) => { e.currentTarget.style.display='none'; }} 
                  />
                  <span className="text-xl text-white tracking-wide font-playfair">
                    Attribution Analytics Joinrs.com x The GTMA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 border ${theme.borderColor} px-4 py-2 text-sm cursor-pointer hover:bg-white/5 transition-colors ${theme.cardBg} ${theme.radius}`}>
                <Calendar size={14} className="text-white"/>
                <span className="font-semibold text-xs text-white font-inter">Last 120 Days</span>
                <ChevronDown size={14} className="text-white/50"/>
              </div>
              <button className="h-9 w-9 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
                <Bell size={18} />
              </button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: COLORS.white, borderTopColor: 'transparent' }}></div>
            <p className="text-sm font-medium text-white/50 animate-pulse font-inter">Syncing data for Joiners...</p>
          </div>
        ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {/* --- KPI SCORECARDS --- */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8 ${designMode === 'ruadhan' ? '' : 'gap-4'}`}>
            <StatCard 
              title="Emails Sent" 
              value={totals.emails_sent?.toLocaleString()} 
              subValue={totals.planned_sent?.toLocaleString()}
              trend={((totals.emails_sent! - totals.planned_sent!) / totals.planned_sent! * 100).toFixed(1)}
              isActive={activeMetric === 'emails_sent'}
              onClick={() => setActiveMetric('emails_sent')}
              theme={theme}
            />
            <StatCard 
              title="Replied" 
              value={totals.replies?.toLocaleString()} 
              subValue={totals.planned_replies?.toLocaleString()}
              trend={((totals.replies! - totals.planned_replies!) / totals.planned_replies! * 100).toFixed(1)}
              isActive={activeMetric === 'replies'}
              onClick={() => setActiveMetric('replies')}
              theme={theme}
            />
            <StatCard 
              title="MQLs (Positive)" 
              value={totals.positive_replies?.toLocaleString()} 
              subValue={totals.planned_mqls?.toLocaleString()}
              trend={((totals.positive_replies! - totals.planned_mqls!) / totals.planned_mqls! * 100).toFixed(1)}
              isActive={activeMetric === 'positive_replies'}
              onClick={() => setActiveMetric('positive_replies')}
              theme={theme}
            />
            <StatCard 
              title="SQLs (Meetings)" 
              value={totals.meetings_booked?.toLocaleString()} 
              subValue={totals.planned_sqls?.toLocaleString()}
              trend={((totals.meetings_booked! - totals.planned_sqls!) / totals.planned_sqls! * 100).toFixed(1)}
              isActive={activeMetric === 'meetings_booked'}
              onClick={() => setActiveMetric('meetings_booked')}
              bgColor={COLORS.green} 
              theme={theme}
            />
            <StatCard 
              title="Bounces" 
              value={totals.bounces?.toLocaleString()} 
              subValue={totals.planned_bounces?.toLocaleString()}
              trend="-1.5" 
              isActive={activeMetric === 'bounces'}
              onClick={() => setActiveMetric('bounces')}
              bgColor={COLORS.red} 
              theme={theme}
            />
          </div>

          <div className="grid grid-cols-1 gap-8 mb-8">
            
            {/* --- MAIN CHART --- */}
            <div className={`w-full p-8 transition-all duration-500 border ${theme.borderColor} ${theme.cardBg} ${theme.radius} ${theme.shadow}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2 text-white font-playfair">
                    Campaign Velocity: {config.label}
                  </h2>
                  <p className="text-sm mt-1 font-medium text-white/50 font-inter">Comparing Actual Results vs. Strategic Plan</p>
                </div>
                <div className={`flex items-center gap-6 text-xs font-medium px-4 py-2 border ${theme.borderColor} bg-white/5 ${theme.radius}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 border-t-2 border-dashed opacity-40 border-white"></span>
                    <span className="text-white/70 font-inter">Goal</span>
                  </div>
                  <div className="h-4 w-px bg-white/10"></div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-white"></span>
                    <span className="text-white font-inter">Actual</span>
                  </div>
                </div>
              </div>

              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke="rgba(254,254,254,0.05)" 
                    />

                    {/* Faint Horizontal Reference Lines - 3/4 Lines */}
                    <ReferenceLine y={chartMax * 0.25} stroke="rgba(254,254,254,0.1)" strokeDasharray="3 3" />
                    <ReferenceLine y={chartMax * 0.50} stroke="rgba(254,254,254,0.1)" strokeDasharray="3 3" />
                    <ReferenceLine y={chartMax * 0.75} stroke="rgba(254,254,254,0.1)" strokeDasharray="3 3" />

                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fill: 'rgba(254,254,254,0.5)', fontSize: 11, fontWeight: 500, fontFamily: 'Inter' }} 
                      axisLine={false} 
                      tickLine={false} 
                      minTickGap={60}
                      dy={10}
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(254,254,254,0.5)', fontSize: 11, fontWeight: 500, fontFamily: 'Inter' }} 
                      axisLine={false} 
                      tickLine={false}
                      tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                      dx={-10}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Line 
                      type="monotone" 
                      dataKey={config.planned} 
                      stroke={config.color} 
                      strokeDasharray="4 4" 
                      strokeWidth={2}
                      dot={false}
                      opacity={0.4}
                      name="Goal"
                      activeDot={false}
                      isAnimationActive={true}
                    />
                    
                    <Area 
                      type="monotone" 
                      dataKey={config.actual} 
                      stroke={config.color} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorMain)" 
                      name="Actual"
                      animationDuration={1500}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 px-1 text-white/50 font-inter">
            <Filter size={12} /> Data Attribution: <span className="text-white">{config.label}</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DrillDownTable 
              title="Inbox Provider" 
              icon={Server} 
              data={inboxStats.data} 
              total={inboxStats.total}
              theme={theme}
            />
            <DrillDownTable 
              title="Region" 
              icon={Globe} 
              data={regionStats.data} 
              total={regionStats.total}
              theme={theme}
            />
            <DrillDownTable 
              title="Persona" 
              icon={Users} 
              data={personaStats.data} 
              total={personaStats.total}
              theme={theme}
            />
            <DrillDownTable 
              title="Campaign" 
              icon={Layers} 
              data={campaignStats.data} 
              total={campaignStats.total}
              theme={theme}
            />
          </div>

        </main>
        )}

        {/* --- DESIGN ENGINE TOGGLE --- */}
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setDesignMode(prev => prev === 'ruadhan' ? 'best' : 'ruadhan')}
            className="group flex items-center gap-2 px-4 py-2 bg-white text-[#1c024e] font-bold rounded-full shadow-lg hover:scale-105 transition-all"
          >
            {designMode === 'ruadhan' ? (
              <>
                <Palette size={16} /> 
                <span>Switch to Best Design</span>
              </>
            ) : (
              <>
                <Sparkles size={16} /> 
                <span>Switch to Ruadhán's Design</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}