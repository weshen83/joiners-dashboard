'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart, ReferenceLine
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
  fontFamilyHead: string;
  fontFamilyBody: string;
  filter: string; // CSS Filter for glows
  colors: {
    purpleDark: string;
    purpleLight: string;
    green: string;
    red: string;
    white: string;
  }
}

const COLORS = {
  purpleDark: '#1c024e',
  purpleLight: '#352c47',
  green: '#077005',
  red: '#700805',
  white: '#fefefe'
};

const getTheme = (mode: ThemeMode, design: DesignSystem): ThemeConfig => {
  // We are forcing the Dark/Purple theme as the primary look per the requirement
  // but keeping the logic extensible if you want to switch back later.
  
  // Base configuration following the uploaded image palette
  const baseTheme = {
    bg: 'bg-[#1c024e]', // Dark Purple Background
    cardBg: 'bg-[#352c47]', // Light Purple Card
    textPrimary: 'text-[#fefefe]',
    textSecondary: 'text-[#fefefe]/70', // White with opacity
    border: 'border-[#fefefe]/10',
    accent: COLORS.green,
    accentLight: 'bg-[#352c47]',
    chartMain: COLORS.white,
    headerBg: 'bg-[#1c024e]',
    logoFilter: 'brightness(0) invert(1)', // Make logo white
    fontFamilyHead: 'font-playfair',
    fontFamilyBody: 'font-inter',
    colors: COLORS,
  };

  let theme: Partial<ThemeConfig> = {};

  switch(design) {
    case 'modern': 
      theme = {
        radius: 'rounded-3xl',
        shadow: 'shadow-[0_0_30px_-5px_rgba(254,254,254,0.1)]',
        chartType: 'basis',
        chartStrokeWidth: 4,
        chartPlannedOpacity: 0.5,
        filter: 'drop-shadow(0 0 8px rgba(254,254,254,0.3))',
        border: 'border-transparent'
      };
      break;
      
    case 'minimal': 
      theme = {
        radius: 'rounded-none',
        shadow: 'shadow-none',
        chartType: 'step',
        chartStrokeWidth: 2,
        chartPlannedOpacity: 1,
        filter: 'none',
        border: 'border-2 border-[#fefefe]/20'
      };
      break;

    default: // "Enterprise"
      theme = {
        radius: 'rounded-xl',
        shadow: 'shadow-xl shadow-black/20',
        chartType: 'natural',
        chartStrokeWidth: 2,
        chartPlannedOpacity: 0.3,
        filter: 'none',
        border: 'border-[#fefefe]/10'
      };
      break;
  }

  return { ...baseTheme, ...theme } as ThemeConfig;
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
      ${theme.cardBg} ${theme.radius}
      ${isActive 
        ? `ring-2 ring-[${theme.colors.white}] z-10 scale-[1.02] ${theme.shadow}` 
        : `border ${theme.border} hover:border-[${theme.colors.white}]/50 ${theme.shadow}`
      }
    `}
    style={{ borderColor: isActive ? theme.colors.white : undefined }}
  >
    <div className="flex justify-between items-start mb-3">
      <div 
        className={`p-2.5 rounded-lg transition-colors`}
        style={{ 
          backgroundColor: isActive ? theme.colors.white : 'rgba(254,254,254,0.05)',
          color: isActive ? theme.colors.purpleDark : theme.colors.white 
        }}
      >
        <Icon size={18} />
      </div>
      {trend && (
        <span 
          className={`flex items-center text-[11px] ${theme.fontFamilyBody} font-bold px-2 py-0.5 rounded-full`}
          style={{ 
            backgroundColor: parseFloat(trend) > 0 ? theme.colors.green + '20' : theme.colors.red + '20',
            color: parseFloat(trend) > 0 ? '#4ade80' : '#f87171' // Lighter green/red for contrast on dark bg
          }}
        >
          {parseFloat(trend) > 0 ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
          {Math.abs(parseFloat(trend))}%
        </span>
      )}
    </div>
    <div>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${theme.textSecondary} ${theme.fontFamilyBody}`}>{title}</p>
      <h3 className={`text-2xl font-bold mt-1 tracking-tight ${theme.textPrimary} ${theme.fontFamilyBody}`}>{value}</h3>
      <div className="flex items-center mt-1.5 gap-2">
         <span className={`text-[10px] font-medium uppercase tracking-wide ${theme.textSecondary} ${theme.fontFamilyBody}`}>Goal</span>
         <span className={`text-[11px] font-semibold ${theme.textPrimary} ${theme.fontFamilyBody}`}>{subValue}</span>
      </div>
    </div>
    {isActive && (
      <div 
        className="absolute bottom-0 left-0 w-full h-1" 
        style={{ background: `linear-gradient(90deg, ${theme.colors.white}, transparent)` }} 
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
  <div className={`${theme.cardBg} ${theme.radius} border ${theme.border} ${theme.shadow} flex flex-col h-full overflow-hidden`}>
    <div className={`px-4 py-3 border-b ${theme.border} flex items-center justify-between bg-black/10`}>
      <h4 className={`font-bold flex items-center gap-2 text-sm ${theme.fontFamilyHead} tracking-wide ${theme.textPrimary}`}>
        <Icon size={16} style={{ color: theme.colors.white }} /> {title}
      </h4>
    </div>
    <div className="p-4 flex-1 overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-white/20">
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between text-xs mb-1.5">
              <span className={`font-semibold ${theme.textPrimary} ${theme.fontFamilyBody}`}>{item.name}</span>
              <div className="text-right">
                <span className={`font-mono font-bold ${theme.textPrimary} ${theme.fontFamilyBody}`}>{item.value.toLocaleString()}</span>
                <span className={`ml-1 text-[10px] ${theme.textSecondary} ${theme.fontFamilyBody}`}>({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
            <div className={`w-full rounded-full h-1.5 overflow-hidden bg-white/10`}>
              <div 
                className={`h-full ${theme.radius === 'rounded-none' ? 'rounded-none' : 'rounded-full'} opacity-80 group-hover:opacity-100 transition-all duration-500`} 
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%`, backgroundColor: theme.colors.white }}
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
      <div className={`${theme.cardBg} p-3 ${theme.radius} shadow-xl border ${theme.border} text-xs ${theme.fontFamilyBody} backdrop-blur-md`}>
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
  
  // Theme State (Forced to Light/Enterprise as base, but visually overridden by getTheme)
  const [mode, setMode] = useState<ThemeMode>('dark'); 
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

  // Calculate Reference Lines (Faint lines for context)
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
    // Everything is white/white-ish per requirement
    const baseColor = theme.colors.white;
    
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

      <div className={`min-h-screen transition-colors duration-500 pb-20 ${theme.bg} ${theme.textPrimary}`}>
        
        {/* --- HEADER --- */}
        <header className={`${theme.headerBg} border-b ${theme.border} sticky top-0 z-50 transition-all duration-500`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img 
                    src="/logo.png" 
                    alt="GTMA Logo" 
                    className="h-10 w-auto object-contain transition-all duration-300"
                    style={{ filter: theme.logoFilter }}
                    onError={(e) => { e.currentTarget.style.display='none'; }} 
                  />
                  <div className="h-8 w-px bg-white/20 mx-2"></div>
                  <span className={`text-lg font-semibold tracking-wide ${theme.fontFamilyHead}`}>
                    Attribution Analytics Joinrs.com x The GTMA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${theme.cardBg} border ${theme.border} ${theme.radius} px-3 py-1.5 text-sm cursor-pointer shadow-sm transition-colors`}>
                <Calendar size={14} style={{ color: theme.colors.white }}/>
                <span className={`font-semibold text-xs ${theme.textSecondary} ${theme.fontFamilyBody}`}>Last 120 Days</span>
                <ChevronDown size={14} className={theme.textSecondary}/>
              </div>
              <button className={`h-8 w-8 rounded-full bg-white/10 flex items-center justify-center ${theme.textSecondary} hover:bg-white/20 transition-colors`}>
                <Bell size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* --- THEME SWITCHER FLOATING WIDGET (Hidden by default based on strict requirement for one look, but kept in code if needed for demo purposes later) --- */}
        {/* <div className={`fixed bottom-6 right-6 z-50 ...`}> ... </div> */}
        <div className={`fixed bottom-6 right-6 z-50 p-3 ${theme.cardBg} border ${theme.border} shadow-2xl ${theme.radius} flex flex-col gap-3 w-48 transition-all duration-300`}>
             <div className="flex justify-between items-center px-1">
              <span className={`text-[10px] uppercase font-bold ${theme.textSecondary} ${theme.fontFamilyBody}`}>Design System</span>
            </div>
            <div className="space-y-1">
              <button onClick={() => setDesign('enterprise')} className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${design === 'enterprise' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}>
                <Layout size={14} /> Enterprise
              </button>
              <button onClick={() => setDesign('modern')} className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${design === 'modern' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}>
                <Monitor size={14} /> Modern
              </button>
              <button onClick={() => setDesign('minimal')} className={`w-full text-left px-3 py-2 text-xs font-medium rounded-md transition-all flex items-center gap-2 ${design === 'minimal' ? 'bg-white/10 text-white' : 'text-white/50 hover:bg-white/5'}`}>
                <Layers size={14} /> Minimal
              </button>
            </div>
        </div>

        {isLoading ? (
          <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: theme.colors.white, borderTopColor: 'transparent' }}></div>
            <p className={`text-sm font-medium ${theme.textSecondary} animate-pulse ${theme.fontFamilyBody}`}>Syncing data for Joiners...</p>
          </div>
        ) : (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          
          {/* --- KPI SCORECARDS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
            
            {/* --- MAIN CHART --- */}
            <div className={`w-full ${theme.cardBg} ${theme.radius} border ${theme.border} ${theme.shadow} p-6 transition-all duration-500`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className={`text-2xl font-bold flex items-center gap-2 ${theme.textPrimary} ${theme.fontFamilyHead}`}>
                    Campaign Velocity: {config.label}
                  </h2>
                  <p className={`text-sm mt-1 font-medium ${theme.textSecondary} ${theme.fontFamilyBody}`}>Comparing Actual Results vs. Strategic Plan</p>
                </div>
                <div className={`flex items-center gap-4 text-xs font-medium px-4 py-2 rounded-lg border ${theme.border} bg-white/5`}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-0.5 border-t-2 border-dashed opacity-40" style={{ borderColor: theme.colors.white }}></span>
                    <span className={`${theme.textSecondary} ${theme.fontFamilyBody}`}>Goal</span>
                  </div>
                  <div className={`h-4 w-px bg-white/20`}></div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.white }}></span>
                    <span className={`${theme.textPrimary} ${theme.fontFamilyBody}`}>Actual</span>
                  </div>
                </div>
              </div>

              <div className="h-[400px] w-full">
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
                        stroke="rgba(254,254,254,0.1)" 
                      />
                    )}

                    {/* Faint Horizontal Reference Lines */}
                    <ReferenceLine y={chartMax * 0.25} stroke="rgba(254,254,254,0.1)" strokeDasharray="3 3" />
                    <ReferenceLine y={chartMax * 0.50} stroke="rgba(254,254,254,0.1)" strokeDasharray="3 3" />
                    <ReferenceLine y={chartMax * 0.75} stroke="rgba(254,254,254,0.1)" strokeDasharray="3 3" />

                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fill: 'rgba(254,254,254,0.5)', fontSize: 11, fontWeight: 500, fontFamily: 'Inter' }} 
                      axisLine={design === 'minimal'} 
                      tickLine={false} 
                      minTickGap={40}
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(254,254,254,0.5)', fontSize: 11, fontWeight: 500, fontFamily: 'Inter' }} 
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
                      <Area 
                        type={theme.chartType} 
                        dataKey={config.actual} 
                        stroke={config.color} 
                        strokeWidth={theme.chartStrokeWidth}
                        fillOpacity={1} 
                        fill="url(#colorMain)" 
                        name="Actual"
                        style={{ filter: theme.filter }} 
                        animationDuration={1000}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <h3 className={`text-xs font-bold uppercase tracking-widest mb-6 flex items-center gap-2 px-1 ${theme.textSecondary} ${theme.fontFamilyBody}`}>
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
      </div>
    </>
  );
}