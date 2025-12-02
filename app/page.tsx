'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart
} from 'recharts';
import { 
  Mail, MessageSquare, Target, Trophy, XOctagon, 
  Calendar, ChevronDown, Filter, ArrowUpRight, ArrowDownRight,
  Zap, Users, Bell, Globe, Server, Layers,
  Palette, Moon, Sun, Monitor, Layout
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
 * --- THEME ENGINE ---
 */

type ThemeMode = 'light' | 'dark';
type DesignSystem = 'enterprise' | 'modern' | 'minimal';

interface ThemeConfig {
  bg: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  accent: string;
  accentLight: string;
  chartMain: string;
  chartPlannedOpacity: number;
  chartStrokeWidth: number;
  chartType: 'monotone' | 'basis' | 'step' | 'linear' | 'natural';
  radius: string;
  shadow: string;
  headerBg: string;
  logoFilter: string;
  fontFamily: string;
  filter: string; // CSS Filter for glows
}

const getTheme = (mode: ThemeMode, design: DesignSystem): ThemeConfig => {
  const isDark = mode === 'dark';

  // --- DESIGN SYSTEM DEFAULTS ---
  let theme: Partial<ThemeConfig> = {};

  switch(design) {
    case 'modern': // "Neon SaaS" - Glows, Glass, Rounded
      theme = {
        radius: 'rounded-3xl',
        shadow: isDark ? 'shadow-[0_0_30px_-5px_rgba(37,99,235,0.3)]' : 'shadow-xl shadow-indigo-100',
        chartType: 'basis', // Super smooth
        chartStrokeWidth: 4,
        chartPlannedOpacity: 0.5,
        fontFamily: 'font-sans',
        filter: isDark ? 'drop-shadow(0 0 8px rgba(96,165,250,0.5))' : 'drop-shadow(0 0 4px rgba(37,99,235,0.3))',
        border: 'border-transparent' // Glass look usually has no hard border
      };
      break;
      
    case 'minimal': // "Brutalist" - Hard lines, No Shadows, Monospace feel
      theme = {
        radius: 'rounded-none',
        shadow: 'shadow-none',
        chartType: 'step', // Robot/Engineer feel
        chartStrokeWidth: 2,
        chartPlannedOpacity: 1, // Solid dashed line
        fontFamily: 'font-mono tracking-tight',
        filter: 'none',
        border: isDark ? 'border-2 border-slate-700' : 'border-2 border-slate-900'
      };
      break;

    default: // "Enterprise" - Clean, Standard (Default)
      theme = {
        radius: 'rounded-xl',
        shadow: 'shadow-sm',
        chartType: 'natural',
        chartStrokeWidth: 2,
        chartPlannedOpacity: 0.3,
        fontFamily: 'font-sans',
        filter: 'none',
        border: isDark ? 'border-slate-800' : 'border-slate-200'
      };
      break;
  }

  // --- COLOR MODES ---
  if (isDark) {
    return {
      bg: 'bg-slate-950',
      cardBg: design === 'modern' ? 'bg-slate-900/50 backdrop-blur-xl' : 'bg-slate-900',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      border: design === 'minimal' ? 'border-2 border-slate-700' : (design === 'modern' ? 'border-white/10' : 'border-slate-800'),
      accent: design === 'modern' ? '#60a5fa' : design === 'minimal' ? '#ffffff' : '#a78bfa',
      accentLight: 'bg-slate-800',
      chartMain: design === 'modern' ? '#60a5fa' : design === 'minimal' ? '#ffffff' : '#a78bfa',
      headerBg: design === 'modern' ? 'bg-slate-950/80 backdrop-blur-md' : 'bg-slate-950',
      logoFilter: 'invert(1) brightness(2)',
      ...theme
    } as ThemeConfig;
  }

  // LIGHT MODE
  return {
    bg: design === 'modern' ? 'bg-indigo-50/50' : 'bg-slate-50',
    cardBg: design === 'modern' ? 'bg-white/70 backdrop-blur-xl' : 'bg-white',
    textPrimary: 'text-slate-900',
    textSecondary: 'text-slate-500',
    border: design === 'minimal' ? 'border-2 border-slate-900' : (design === 'modern' ? 'border-white/40' : 'border-slate-200'),
    accent: design === 'modern' ? '#2563eb' : design === 'minimal' ? '#0f172a' : '#1C024E',
    accentLight: design === 'modern' ? 'bg-blue-50' : 'bg-slate-50',
    chartMain: design === 'modern' ? '#2563eb' : design === 'minimal' ? '#0f172a' : '#1C024E',
    headerBg: design === 'modern' ? 'bg-white/80 backdrop-blur-md' : 'bg-white',
    logoFilter: 'none',
    ...theme
  } as ThemeConfig;
};

/**
 * --- COMPONENTS ---
 */

interface StatCardProps {
  title: string;
  value: string | undefined;
  subValue: string | undefined;
  trend: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  theme: ThemeConfig;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, icon: Icon, isActive, onClick, theme }) => (
  <button 
    onClick={onClick}
    className={`
      relative overflow-hidden p-5 transition-all duration-300 text-left w-full group
      ${theme.cardBg} ${theme.radius} ${theme.fontFamily}
      ${isActive 
        ? `ring-2 ring-[${theme.accent}] z-10 scale-[1.02] ${theme.shadow}` 
        : `border ${theme.border} hover:border-[${theme.accent}]/50 ${theme.shadow}`
      }
    `}
    style={{ borderColor: isActive ? theme.accent : undefined }}
  >
    <div className="flex justify-between items-start mb-3">
      <div 
        className={`p-2.5 rounded-lg transition-colors`}
        style={{ 
          backgroundColor: isActive ? theme.accent : undefined,
          color: isActive ? (theme.chartMain === '#ffffff' ? '#000' : '#fff') : undefined 
        }}
      >
        <Icon size={18} className={!isActive ? theme.textSecondary : ''} />
      </div>
      {trend && (
        <span className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${parseFloat(trend) > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
          {parseFloat(trend) > 0 ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
          {Math.abs(parseFloat(trend))}%
        </span>
      )}
    </div>
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary}`}>{title}</p>
      <h3 className={`text-2xl font-bold mt-1 tracking-tight ${theme.textPrimary}`}>{value}</h3>
      <div className="flex items-center mt-1.5 gap-2">
         <span className={`text-[10px] font-medium uppercase tracking-wide ${theme.textSecondary}`}>Goal</span>
         <span className={`text-[11px] font-semibold ${theme.textPrimary}`}>{subValue}</span>
      </div>
    </div>
    {isActive && (
      <div 
        className="absolute bottom-0 left-0 w-full h-1" 
        style={{ background: `linear-gradient(90deg, ${theme.accent}, transparent)` }} 
      />
    )}
  </button>
);

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
  <div className={`${theme.cardBg} ${theme.radius} border ${theme.border} ${theme.shadow} ${theme.fontFamily} flex flex-col h-full overflow-hidden`}>
    <div className={`px-4 py-3 border-b ${theme.border} flex items-center justify-between ${theme.accentLight} bg-opacity-30`}>
      <h4 className={`font-bold flex items-center gap-2 text-xs uppercase tracking-wide ${theme.textPrimary}`}>
        <Icon size={14} style={{ color: theme.accent }} /> {title}
      </h4>
    </div>
    <div className="p-4 flex-1 overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-slate-200">
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between text-xs mb-1.5">
              <span className={`font-semibold ${theme.textPrimary}`}>{item.name}</span>
              <div className="text-right">
                <span className={`font-mono font-bold ${theme.textPrimary}`}>{item.value.toLocaleString()}</span>
                <span className={`ml-1 text-[10px] ${theme.textSecondary}`}>({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden ${theme.accentLight}`}>
              <div 
                className={`h-full ${theme.radius === 'rounded-none' ? 'rounded-none' : 'rounded-full'} opacity-80 group-hover:opacity-100 transition-all duration-500`} 
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%`, backgroundColor: theme.accent }}
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
  theme: ThemeConfig;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, theme }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`${theme.cardBg} p-3 ${theme.radius} shadow-xl border ${theme.border} text-xs ${theme.fontFamily} backdrop-blur-md`}>
        <p className={`font-bold mb-2 border-b ${theme.border} pb-1 ${theme.textSecondary}`}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-1 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
              <span className={`capitalize font-medium ${theme.textSecondary}`}>{entry.name}:</span>
            </div>
            <span className={`font-mono font-bold ${theme.textPrimary}`}>{entry.value.toLocaleString()}</span>
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
  
  // Theme State
  const [mode, setMode] = useState<ThemeMode>('light');
  const [design, setDesign] = useState<DesignSystem>('enterprise');

  // Computed Theme
  const theme = useMemo(() => getTheme(mode, design), [mode, design]);

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

  const ttlConfig = useMemo(() => {
    const counts: { [key: string]: number } = {};
    SEGMENTS.ttlBuckets.forEach(b => counts[b] = 0);
    
    rawData.forEach(row => {
        const val = row[activeMetric] as number;
        if (val > 0) {
            counts[row.ttl_bucket] = (counts[row.ttl_bucket] || 0) + val;
        }
    });

    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    
    const labels: { [key: string]: string } = {
      emails_sent: 'Emails Sent',
      replies: 'Total Replies',
      positive_replies: 'MQLs',
      meetings_booked: 'SQLs',
      bounces: 'Bounces'
    };

    return { data, label: labels[activeMetric] || 'Metric' };
  }, [rawData, activeMetric]);

  const getChartConfig = () => {
    // Dynamic colors based on theme accent unless strictly defined
    const baseColor = theme.chartMain;
    
    switch (activeMetric) {
      case 'emails_sent': return { actual: 'emails_sent', planned: 'planned_sent', color: baseColor, label: 'Emails Sent' };
      case 'replies': return { actual: 'replies', planned: 'planned_replies', color: '#3b82f6', label: 'Replies' };
      case 'positive_replies': return { actual: 'positive_replies', planned: 'planned_mqls', color: '#8b5cf6', label: 'MQLs (Positive)' };
      case 'meetings_booked': return { actual: 'meetings_booked', planned: 'planned_sqls', color: '#10b981', label: 'SQLs (Meetings)' };
      case 'bounces': return { actual: 'bounces', planned: 'planned_bounces', color: '#f43f5e', label: 'Bounces' };
      default: return { actual: 'emails_sent', planned: 'planned_sent', color: baseColor, label: 'Emails Sent' };
    }
  };

  const config = getChartConfig();

  return (
    <div className={`min-h-screen transition-colors duration-500 pb-20 ${theme.bg} ${theme.textPrimary} ${theme.fontFamily}`}>
      
      {/* --- HEADER --- */}
      <header className={`${theme.headerBg} border-b ${theme.border} sticky top-0 z-50 transition-all duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 {/* Replaced img tag with explicit path or use text fallback if image missing */}
                 <img 
                   src="/logo.png" 
                   alt="GTMA Logo" 
                   className="h-10 w-auto object-contain transition-all duration-300"
                   style={{ filter: theme.logoFilter }}
                   onError={(e) => { e.currentTarget.style.display='none'; }} 
                 />
                 <div className="h-6 w-px bg-slate-200 mx-2"></div>
              </div>
              
              <div className={`flex items-center gap-2 ${theme.cardBg} border ${theme.border} rounded-lg px-3 py-1.5 min-w-[160px]`}>
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 shadow-sm shrink-0"
                    style={{ background: theme.accent, borderColor: theme.bg }}
                  >
                    J
                  </div>
                  <div className="flex-1">
                    <span className={`block font-bold leading-none text-xs ${theme.textPrimary}`}>Joiners</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.textSecondary}`}>Growth Acct.</span>
                  </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 ${theme.cardBg} border ${theme.border} ${theme.radius} px-3 py-1.5 text-sm cursor-pointer shadow-sm transition-colors`}>
               <Calendar size={14} style={{ color: theme.accent }}/>
               <span className={`font-semibold text-xs ${theme.textSecondary}`}>Last 120 Days</span>
               <ChevronDown size={14} className={theme.textSecondary}/>
             </div>
             <button className={`h-8 w-8 rounded-full ${theme.accentLight} flex items-center justify-center ${theme.textSecondary}`}>
               <Bell size={16} />
             </button>
          </div>
        </div>
      </header>

      {/* --- THEME SWITCHER FLOATING WIDGET --- */}
      <div className={`fixed bottom-6 right-6 z-50 p-3 ${theme.cardBg} border ${theme.border} shadow-2xl ${theme.radius} flex flex-col gap-3 w-48 transition-all duration-300`}>
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Appearance</span>
        </div>
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button 
              onClick={() => setMode('light')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'light' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Light
            </button>
            <button 
              onClick={() => setMode('dark')}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'dark' ? 'bg-slate-700 shadow text-white' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Dark
            </button>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Design System</span>
          <button 
            onClick={() => setDesign('enterprise')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${design === 'enterprise' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-white ring-1 ring-indigo-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Layout size={14} /> Enterprise
          </button>
          <button 
            onClick={() => setDesign('modern')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${design === 'modern' ? 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Monitor size={14} /> SaaS Neon
          </button>
          <button 
            onClick={() => setDesign('minimal')}
            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${design === 'minimal' ? 'bg-emerald-50 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Layers size={14} /> Brutalist
          </button>
        </div>
      </div>

      {isLoading ? (
         <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
           <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: theme.accent, borderTopColor: 'transparent' }}></div>
           <p className={`text-sm font-medium ${theme.textSecondary} animate-pulse`}>Syncing data for Joiners...</p>
         </div>
      ) : (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* --- KPI SCORECARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard 
            title="Emails Sent" 
            value={totals.emails_sent?.toLocaleString()} 
            subValue={totals.planned_sent?.toLocaleString()}
            trend={((totals.emails_sent! - totals.planned_sent!) / totals.planned_sent! * 100).toFixed(1)}
            icon={Mail}
            isActive={activeMetric === 'emails_sent'}
            onClick={() => setActiveMetric('emails_sent')}
            theme={theme}
          />
          <StatCard 
            title="Replied" 
            value={totals.replies?.toLocaleString()} 
            subValue={totals.planned_replies?.toLocaleString()}
            trend={((totals.replies! - totals.planned_replies!) / totals.planned_replies! * 100).toFixed(1)}
            icon={MessageSquare}
            isActive={activeMetric === 'replies'}
            onClick={() => setActiveMetric('replies')}
            theme={theme}
          />
          <StatCard 
            title="MQLs (Positive)" 
            value={totals.positive_replies?.toLocaleString()} 
            subValue={totals.planned_mqls?.toLocaleString()}
            trend={((totals.positive_replies! - totals.planned_mqls!) / totals.planned_mqls! * 100).toFixed(1)}
            icon={Target}
            isActive={activeMetric === 'positive_replies'}
            onClick={() => setActiveMetric('positive_replies')}
            theme={theme}
          />
          <StatCard 
            title="SQLs (Meetings)" 
            value={totals.meetings_booked?.toLocaleString()} 
            subValue={totals.planned_sqls?.toLocaleString()}
            trend={((totals.meetings_booked! - totals.planned_sqls!) / totals.planned_sqls! * 100).toFixed(1)}
            icon={Trophy}
            isActive={activeMetric === 'meetings_booked'}
            onClick={() => setActiveMetric('meetings_booked')}
            theme={theme}
          />
          <StatCard 
            title="Bounces" 
            value={totals.bounces?.toLocaleString()} 
            subValue={totals.planned_bounces?.toLocaleString()}
            trend="-1.5" 
            icon={XOctagon}
            isActive={activeMetric === 'bounces'}
            onClick={() => setActiveMetric('bounces')}
            theme={theme}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* --- MAIN CHART --- */}
          <div className={`lg:col-span-2 ${theme.cardBg} ${theme.radius} border ${theme.border} ${theme.shadow} p-5 transition-all duration-500`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
                  Campaign Velocity: <span style={{ color: theme.accent }}>{config.label}</span>
                </h2>
                <p className={`text-xs mt-1 font-medium ${theme.textSecondary}`}>Comparing Actual Results (Area) vs. Strategic Plan (Dashed)</p>
              </div>
              <div className={`flex items-center gap-4 text-xs font-medium px-3 py-2 rounded-lg border ${theme.border} ${theme.bg}`}>
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 border-t-2 border-dashed opacity-40" style={{ borderColor: theme.accent }}></span>
                  <span className={theme.textSecondary}>Goal</span>
                </div>
                <div className={`h-3 w-px bg-slate-200 dark:bg-slate-700`}></div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.accent }}></span>
                  <span className={theme.textPrimary}>Actual</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={design === 'minimal' ? 0 : 0.25}/>
                      <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  {design !== 'minimal' && (
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={false} 
                      stroke={mode === 'dark' ? '#334155' : '#f1f5f9'} 
                    />
                  )}

                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 500 }} 
                    axisLine={design === 'minimal'} 
                    tickLine={false} 
                    minTickGap={40}
                  />
                  <YAxis 
                    tick={{ fill: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: 10, fontWeight: 500 }} 
                    axisLine={design === 'minimal'} 
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                  />
                  <Tooltip content={<CustomTooltip theme={theme} />} />
                  
                  <Line 
                    type={theme.chartType} 
                    dataKey={config.planned} 
                    stroke={config.color} 
                    strokeDasharray="4 4" 
                    strokeWidth={design === 'minimal' ? 2 : 2}
                    dot={false}
                    opacity={theme.chartPlannedOpacity}
                    name="Goal"
                    activeDot={false}
                    isAnimationActive={true}
                  />
                  
                  {design === 'minimal' ? (
                     // Minimal Mode: Only Line, No Area
                     <Line 
                       type={theme.chartType}
                       dataKey={config.actual}
                       stroke={config.color}
                       strokeWidth={theme.chartStrokeWidth}
                       dot={false}
                       activeDot={{ r: 4, fill: config.color }}
                       name="Actual"
                     />
                  ) : (
                     // Standard/Modern Mode: Area + Glow
                     <Area 
                       type={theme.chartType} 
                       dataKey={config.actual} 
                       stroke={config.color} 
                       strokeWidth={theme.chartStrokeWidth}
                       fillOpacity={1} 
                       fill="url(#colorMain)" 
                       name="Actual"
                       style={{ filter: theme.filter }} // APPLIES GLOW IN MODERN MODE
                       animationDuration={1000}
                     />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- TTL CHART --- */}
          <div className={`${theme.cardBg} ${theme.radius} border ${theme.border} ${theme.shadow} p-5 flex flex-col transition-all duration-500`}>
            <div className={`mb-4 pb-4 border-b ${theme.border}`}>
               <h3 className={`font-bold flex items-center gap-2 text-sm uppercase tracking-wide ${theme.textPrimary}`}>
                 <Zap size={16} className="text-amber-500 fill-amber-500" /> Speed to Lead
               </h3>
               <p className={`text-[11px] mt-1 font-medium ${theme.textSecondary}`}>
                 {ttlConfig.label} broken down by <strong>Response Time</strong>.
               </p>
            </div>
            
            <div className="flex-1 w-full min-h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={ttlConfig.data} 
                  layout="vertical" 
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={70} 
                    tick={{ fontSize: 10, fill: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{fill: mode === 'dark' ? '#334155' : '#f8fafc'}} 
                    contentStyle={{ borderRadius: '8px', border: 'none' }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={design === 'minimal' ? 30 : 20}>
                    {ttlConfig.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index < 2 ? '#10b981' : index === 2 ? '#fbbf24' : mode === 'dark' ? '#475569' : '#e2e8f0'} 
                        // Brutalist Stroke in Minimal Mode
                        stroke={design === 'minimal' ? (mode === 'dark' ? '#fff' : '#000') : 'none'}
                        strokeWidth={design === 'minimal' ? 1 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className={`mt-2 rounded p-3 ${design === 'minimal' ? 'border-2 border-amber-500 text-amber-600 bg-transparent' : 'border border-amber-500/20 bg-amber-500/10'}`}>
               <div className={`flex items-start gap-2 text-[10px] ${design === 'minimal' ? 'text-amber-700 dark:text-amber-400 font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
                 <Zap size={12} className="mt-0.5 shrink-0" />
                 <p className="leading-tight"><strong>Insight:</strong> Faster response times consistently correlate with higher {ttlConfig.label} volume.</p>
               </div>
            </div>
          </div>
        </div>

        <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 px-1 ${theme.textSecondary}`}>
          <Filter size={12} /> Data Attribution: <span style={{ color: theme.accent }}>{config.label}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}