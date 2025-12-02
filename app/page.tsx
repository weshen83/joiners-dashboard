'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell, ComposedChart
} from 'recharts';
import { 
  Mail, MessageSquare, Target, Trophy, XOctagon, 
  Calendar, ChevronDown, Filter, ArrowUpRight, ArrowDownRight,
  Zap, Users, Bell, Globe, Server, Layers
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
  [key: string]: string | number; // Allow dynamic access
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
  const anchorDate = new Date('2024-10-25T12:00:00'); // Late Oct anchor

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
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subValue, trend, icon: Icon, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className={`
      relative overflow-hidden p-5 rounded-xl transition-all duration-300 text-left w-full group
      ${isActive 
        ? 'bg-white ring-2 ring-[#1C024E] shadow-xl scale-[1.02] z-10' 
        : 'bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100'
      }
    `}
  >
    <div className="flex justify-between items-start mb-3">
      <div className={`p-2.5 rounded-lg transition-colors ${isActive ? 'bg-[#1C024E] text-white' : 'bg-slate-50 text-slate-500 group-hover:bg-slate-100'}`}>
        <Icon size={18} />
      </div>
      {trend && (
        <span className={`flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full ${parseFloat(trend) > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {parseFloat(trend) > 0 ? <ArrowUpRight size={12} className="mr-1"/> : <ArrowDownRight size={12} className="mr-1"/>}
          {Math.abs(parseFloat(trend))}%
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
      <div className="flex items-center mt-1.5 gap-2">
         <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Goal</span>
         <span className="text-[11px] font-semibold text-slate-600">{subValue}</span>
      </div>
    </div>
    {isActive && (
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#1C024E] to-purple-500" />
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
}

const DrillDownTable: React.FC<DrillDownTableProps> = ({ title, icon: Icon, data, total }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wide">
        <Icon size={14} className="text-[#1C024E]" /> {title}
      </h4>
    </div>
    <div className="p-4 flex-1 overflow-y-auto max-h-[250px] scrollbar-thin scrollbar-thumb-slate-200">
      <div className="space-y-4">
        {data.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-700">{item.name}</span>
              <div className="text-right">
                <span className="font-mono font-bold text-slate-800">{item.value.toLocaleString()}</span>
                <span className="text-slate-400 ml-1 text-[10px]">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-[#1C024E] h-full rounded-full opacity-80 group-hover:opacity-100 transition-all duration-500" 
                style={{ width: `${total > 0 ? (item.value / total) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Explicitly type the Recharts CustomTooltip props
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur text-slate-800 p-3 rounded-lg shadow-xl border border-slate-100 text-xs">
        <p className="font-bold mb-2 text-slate-400 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-1 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
              <span className="capitalize text-slate-600 font-medium">{entry.name}:</span>
            </div>
            <span className="font-mono font-bold text-slate-900">{entry.value.toLocaleString()}</span>
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
    switch (activeMetric) {
      case 'emails_sent': return { actual: 'emails_sent', planned: 'planned_sent', color: '#1C024E', label: 'Emails Sent' };
      case 'replies': return { actual: 'replies', planned: 'planned_replies', color: '#3b82f6', label: 'Replies' };
      case 'positive_replies': return { actual: 'positive_replies', planned: 'planned_mqls', color: '#8b5cf6', label: 'MQLs (Positive)' };
      case 'meetings_booked': return { actual: 'meetings_booked', planned: 'planned_sqls', color: '#10b981', label: 'SQLs (Meetings)' };
      case 'bounces': return { actual: 'bounces', planned: 'planned_bounces', color: '#f43f5e', label: 'Bounces' };
      default: return { actual: 'emails_sent', planned: 'planned_sent', color: '#1C024E', label: 'Emails Sent' };
    }
  };

  const config = getChartConfig();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 {/* Replaced img tag with explicit path or use text fallback if image missing */}
                 <img src="/logo.png" alt="GTMA Logo" className="h-10 w-auto object-contain" onError={(e) => { e.currentTarget.style.display='none'; }} />
                 <div className="h-6 w-px bg-slate-200 mx-2"></div>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 min-w-[160px]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1C024E] to-indigo-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-50 shadow-sm shrink-0">
                    J
                  </div>
                  <div className="flex-1">
                    <span className="block font-bold text-slate-800 leading-none text-xs">Joiners</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Growth Acct.</span>
                  </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-sm text-slate-600 cursor-pointer hover:border-[#1C024E] shadow-sm transition-colors">
               <Calendar size={14} className="text-[#1C024E]"/>
               <span className="font-semibold text-xs">Last 120 Days</span>
               <ChevronDown size={14} className="text-slate-400"/>
             </div>
             <button className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-[#1C024E]">
               <Bell size={16} />
             </button>
          </div>
        </div>
      </header>

      {isLoading ? (
         <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-50">
           <div className="w-8 h-8 border-4 border-[#1C024E] border-t-transparent rounded-full animate-spin mb-4"></div>
           <p className="text-sm font-medium text-slate-500 animate-pulse">Syncing data for Joiners...</p>
         </div>
      ) : (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard 
            title="Emails Sent" 
            value={totals.emails_sent?.toLocaleString()} 
            subValue={totals.planned_sent?.toLocaleString()}
            trend={((totals.emails_sent! - totals.planned_sent!) / totals.planned_sent! * 100).toFixed(1)}
            icon={Mail}
            isActive={activeMetric === 'emails_sent'}
            onClick={() => setActiveMetric('emails_sent')}
          />
          <StatCard 
            title="Replied" 
            value={totals.replies?.toLocaleString()} 
            subValue={totals.planned_replies?.toLocaleString()}
            trend={((totals.replies! - totals.planned_replies!) / totals.planned_replies! * 100).toFixed(1)}
            icon={MessageSquare}
            isActive={activeMetric === 'replies'}
            onClick={() => setActiveMetric('replies')}
          />
          <StatCard 
            title="MQLs (Positive)" 
            value={totals.positive_replies?.toLocaleString()} 
            subValue={totals.planned_mqls?.toLocaleString()}
            trend={((totals.positive_replies! - totals.planned_mqls!) / totals.planned_mqls! * 100).toFixed(1)}
            icon={Target}
            isActive={activeMetric === 'positive_replies'}
            onClick={() => setActiveMetric('positive_replies')}
          />
          <StatCard 
            title="SQLs (Meetings)" 
            value={totals.meetings_booked?.toLocaleString()} 
            subValue={totals.planned_sqls?.toLocaleString()}
            trend={((totals.meetings_booked! - totals.planned_sqls!) / totals.planned_sqls! * 100).toFixed(1)}
            icon={Trophy}
            isActive={activeMetric === 'meetings_booked'}
            onClick={() => setActiveMetric('meetings_booked')}
          />
          <StatCard 
            title="Bounces" 
            value={totals.bounces?.toLocaleString()} 
            subValue={totals.planned_bounces?.toLocaleString()}
            trend="-1.5" 
            icon={XOctagon}
            isActive={activeMetric === 'bounces'}
            onClick={() => setActiveMetric('bounces')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Campaign Velocity: <span className="text-[#1C024E]">{config.label}</span>
                </h2>
                <p className="text-slate-400 text-xs mt-1 font-medium">Comparing Actual Results (Area) vs. Strategic Plan (Dashed)</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-6 h-0.5 border-t-2 border-dashed border-[#1C024E] opacity-40"></span>
                  <span className="text-slate-500">Goal</span>
                </div>
                <div className="h-3 w-px bg-slate-200"></div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#1C024E]"></span>
                  <span className="text-slate-800">Actual</span>
                </div>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={config.color} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="displayDate" 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={40}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(1)}k` : value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Line 
                    type="natural" 
                    dataKey={config.planned} 
                    stroke={config.color} 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    dot={false}
                    opacity={0.3}
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
                    animationDuration={1000}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col">
            <div className="mb-4 pb-4 border-b border-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                 <Zap size={16} className="text-amber-500 fill-amber-500" /> Speed to Lead
               </h3>
               <p className="text-[11px] text-slate-400 mt-1 font-medium">
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
                    tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {ttlConfig.data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index < 2 ? '#10b981' : index === 2 ? '#fbbf24' : '#e2e8f0'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-2 bg-amber-50 rounded p-3 border border-amber-100">
               <div className="flex items-start gap-2 text-[10px] text-amber-800">
                 <Zap size={12} className="mt-0.5 shrink-0" />
                 <p className="leading-tight"><strong>Insight:</strong> Faster response times consistently correlate with higher {ttlConfig.label} volume.</p>
               </div>
            </div>
          </div>
        </div>

        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-1">
          <Filter size={12} /> Data Attribution: <span className="text-[#1C024E]">{config.label}</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <DrillDownTable 
             title="Inbox Provider" 
             icon={Server} 
             data={inboxStats.data} 
             total={inboxStats.total}
           />
           <DrillDownTable 
             title="Region" 
             icon={Globe} 
             data={regionStats.data} 
             total={regionStats.total}
           />
           <DrillDownTable 
             title="Persona" 
             icon={Users} 
             data={personaStats.data} 
             total={personaStats.total}
           />
           <DrillDownTable 
             title="Campaign" 
             icon={Layers} 
             data={campaignStats.data} 
             total={campaignStats.total}
           />
        </div>

      </main>
      )}
    </div>
  );
}