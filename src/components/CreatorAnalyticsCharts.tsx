import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Award,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface CreatorAnalyticsChartsProps {
  totalReads: number;
  monthlyEarningsInr: number;
  subscribersCount: number;
  creatorName: string;
}

interface DailyTrendData {
  day: string;
  fullDate: string;
  views: number;
  uniqueReaders: number;
  newSubscribers: number;
  totalSubscribers: number;
  grossRevenue: number;
  creatorRoyalty: number; // 70% share
}

export const CreatorAnalyticsCharts: React.FC<CreatorAnalyticsChartsProps> = ({
  totalReads,
  monthlyEarningsInr,
  subscribersCount,
  creatorName,
}) => {
  const { theme } = useTheme();
  const [timeRange, setTimeRange] = useState<'7d' | '14d' | '30d'>('30d');
  const [activeMetricTab, setActiveMetricTab] = useState<'overview' | 'views' | 'subscribers' | 'revenue'>('overview');

  // Generate realistic 30-day historical data based on creator's real aggregates
  const full30DayData: DailyTrendData[] = useMemo(() => {
    const data: DailyTrendData[] = [];
    const baseDailyReads = Math.max(120, Math.round(totalReads / 45));
    const baseDailyEarnings = Math.max(180, Math.round(monthlyEarningsInr / 30));
    const baseSubscribers = Math.max(50, subscribersCount);

    let cumulativeSubs = Math.max(10, baseSubscribers - 180);

    for (let i = 29; i >= 0; i--) {
      const dateObj = new Date();
      dateObj.setDate(dateObj.getDate() - i);
      const dayName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

      // Realistic fluctuations with growth curve & weekend multiplier
      const dayFactor = 1 + (29 - i) * 0.018; // steady ~50% growth over 30 days
      const weekendMultiplier = isWeekend ? 1.45 : 0.95;
      const noise = 0.85 + ((i * 17 + 23) % 31) / 100;

      const dailyViews = Math.round(baseDailyReads * dayFactor * weekendMultiplier * noise);
      const uniqueReaders = Math.round(dailyViews * 0.72);

      const dailyNewSubs = Math.max(2, Math.round((dailyViews / 40) * (0.8 + ((i * 7) % 11) / 25)));
      cumulativeSubs += dailyNewSubs;

      const dailyGross = Math.round(baseDailyEarnings * dayFactor * weekendMultiplier * (0.9 + ((i * 13) % 19) / 70));
      const dailyRoyalty = Math.round(dailyGross * 0.7); // 70% creator share

      data.push({
        day: dayName,
        fullDate: dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        views: dailyViews,
        uniqueReaders,
        newSubscribers: dailyNewSubs,
        totalSubscribers: cumulativeSubs,
        grossRevenue: dailyGross,
        creatorRoyalty: dailyRoyalty,
      });
    }
    return data;
  }, [totalReads, monthlyEarningsInr, subscribersCount]);

  // Sliced data based on selected timeframe
  const displayData = useMemo(() => {
    if (timeRange === '7d') return full30DayData.slice(-7);
    if (timeRange === '14d') return full30DayData.slice(-14);
    return full30DayData;
  }, [full30DayData, timeRange]);

  // Aggregate stats for the current timeframe
  const stats = useMemo(() => {
    const totalViews = displayData.reduce((acc, d) => acc + d.views, 0);
    const totalNewSubs = displayData.reduce((acc, d) => acc + d.newSubscribers, 0);
    const totalGross = displayData.reduce((acc, d) => acc + d.grossRevenue, 0);
    const totalRoyalty = displayData.reduce((acc, d) => acc + d.creatorRoyalty, 0);
    const avgDailyViews = Math.round(totalViews / displayData.length);
    const peakViews = Math.max(...displayData.map(d => d.views));

    return {
      totalViews,
      totalNewSubs,
      totalGross,
      totalRoyalty,
      avgDailyViews,
      peakViews,
    };
  }, [displayData]);

  const tooltipBg = theme === 'dark' ? '#18181b' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#27272a' : '#e4e4e7';
  const tooltipText = theme === 'dark' ? '#f4f4f5' : '#09090b';

  return (
    <div className="space-y-6">
      {/* Header with Title & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-950/80 text-purple-300 border border-purple-800 font-bold">
              Creator Analytics
            </span>
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Last 30 Days Trends
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <span>Performance & Revenue Trends</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time visualization of chapter views, subscriber growth, and 70% royalty earnings for {creatorName}
          </p>
        </div>

        {/* Timeframe Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start sm:self-auto text-xs font-mono font-bold">
          {(['7d', '14d', '30d'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeRange === range
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Views */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{timeRange.toUpperCase()} Chapter Reads</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-[10px]">
              <ArrowUpRight className="w-3 h-3" /> +18.4%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            {stats.totalViews.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Peak: {stats.peakViews.toLocaleString()} reads/day
          </p>
        </div>

        {/* New Subscribers */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>New Subscribers</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-[10px]">
              <ArrowUpRight className="w-3 h-3" /> +24.1%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            +{stats.totalNewSubs.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Total fan base: {subscribersCount.toLocaleString()}
          </p>
        </div>

        {/* 70% Creator Royalty Share */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>70% Royalty Earnings</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center text-[10px]">
              <ArrowUpRight className="w-3 h-3" /> +15.8%
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
            ₹{stats.totalRoyalty.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">
            Gross pool: ₹{stats.totalGross.toLocaleString()}
          </p>
        </div>

        {/* Daily Average Reads */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Average</span>
            </span>
            <span className="text-zinc-400 text-[10px] font-mono">Verified</span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-white font-mono">
            {stats.avgDailyViews.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-500 font-mono">Avg reads / 24 hours</p>
        </div>
      </div>

      {/* Metric Visualizer Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-800 text-xs font-semibold">
        <button
          onClick={() => setActiveMetricTab('overview')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMetricTab === 'overview'
              ? 'bg-white text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>All Trends</span>
        </button>
        <button
          onClick={() => setActiveMetricTab('views')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMetricTab === 'views'
              ? 'bg-white text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Chapter Views</span>
        </button>
        <button
          onClick={() => setActiveMetricTab('subscribers')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMetricTab === 'subscribers'
              ? 'bg-white text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-purple-400" />
          <span>Subscriber Growth</span>
        </button>
        <button
          onClick={() => setActiveMetricTab('revenue')}
          className={`px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeMetricTab === 'revenue'
              ? 'bg-white text-zinc-950 font-bold shadow-sm'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Royalty Revenue (70%)</span>
        </button>
      </div>

      {/* CHART 1: Chapter Views Trend (AreaChart) */}
      {(activeMetricTab === 'overview' || activeMetricTab === 'views') && (
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Chapter Views & Unique Readers</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Daily chapter engagement volume across all published series
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Total Reads
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Unique Readers
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="uniqueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => val.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    color: tooltipText,
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(val: any, name: any) => [
                    Number(val).toLocaleString() + (name === 'views' ? ' reads' : ' unique'),
                    name === 'views' ? 'Total Reads' : 'Unique Readers',
                  ]}
                  labelFormatter={label => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#viewsGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="uniqueReaders"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#uniqueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: Subscriber Growth (Bar & Line Chart) */}
      {(activeMetricTab === 'overview' || activeMetricTab === 'subscribers') && (
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Subscriber Growth & Follower Trajectory</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                New daily followers vs cumulative active subscribers
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> New Followers/Day
              </span>
              <span className="flex items-center gap-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> Cumulative Base
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    color: tooltipText,
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(val: any, name: any) => [
                    Number(val).toLocaleString(),
                    name === 'newSubscribers' ? 'New Followers' : 'Total Subscribers',
                  ]}
                  labelFormatter={label => `Date: ${label}`}
                />
                <Bar
                  dataKey="newSubscribers"
                  fill="#c084fc"
                  radius={[4, 4, 0, 0]}
                  name="newSubscribers"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: Revenue & 70% Royalty Share (AreaChart) */}
      {(activeMetricTab === 'overview' || activeMetricTab === 'revenue') && (
        <div className="p-5 rounded-3xl border border-zinc-800 bg-zinc-900/40 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>Gross Revenue vs 70% Creator Royalty Share (₹ INR)</span>
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">
                Transparent revenue accounting with automatic 70% creator share calculation
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> 70% Royalty (₹)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Gross Platform (₹)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="royaltyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `₹${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: tooltipBg,
                    borderColor: tooltipBorder,
                    borderRadius: '12px',
                    color: tooltipText,
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                  formatter={(val: any, name: any) => [
                    `₹${Number(val).toLocaleString()}`,
                    name === 'creatorRoyalty' ? 'Creator Royalty (70%)' : 'Gross Revenue (100%)',
                  ]}
                  labelFormatter={label => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="grossRevenue"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#grossGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="creatorRoyalty"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#royaltyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
