'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import type { StatsResponse } from '../api/stats/route';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

type SparklineData = {
  date: string;
  value: number;
};

type DailyStats = {
  tokens: number;
  requests: number;
  successfulRequests: number;
  totalResponseTime: number;
};

type LogEntry = {
  date: string;
  tokens: number;
  success: boolean;
  responseTime: number;
};

function SparklineCard({
  title,
  value,
  description,
  data,
  dataKey,
  color = '#8884d8',
}: {
  title: string;
  value: string | number;
  description: string;
  data: SparklineData[];
  dataKey: 'value';
  color?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-2xl font-bold">{value}</div>
      </CardHeader>
      <CardContent>
        <div className="h-[60px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`gradient-${title}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fillOpacity={1}
                fill={`url(#gradient-${title})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 p-8 pt-6 space-y-4">
        <div className="text-center">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex-1 p-8 pt-6 space-y-4">
        <div className="text-center">Failed to load statistics</div>
      </div>
    );
  }

  // Transform raw data into daily stats
  const dailyStats = (stats.usageOverTime as LogEntry[]).reduce(
    (acc: Map<string, DailyStats>, log) => {
      const date = log.date;
      if (!acc.has(date)) {
        acc.set(date, {
          tokens: 0,
          requests: 0,
          successfulRequests: 0,
          totalResponseTime: 0,
        });
      }
      const day = acc.get(date)!;
      day.tokens += log.tokens;
      day.requests += 1;
      day.successfulRequests += log.success ? 1 : 0;
      day.totalResponseTime += log.responseTime || 0;
      return acc;
    },
    new Map()
  );

  // Convert daily stats into our SparklineData format
  const tokenUsageData: SparklineData[] = Array.from(dailyStats.entries()).map(
    ([date, day]) => ({
      date,
      value: day.tokens,
    })
  );

  const dailySuccessRates: SparklineData[] = Array.from(
    dailyStats.entries()
  ).map(([date, day]) => ({
    date,
    value: (day.successfulRequests / day.requests) * 100,
  }));

  const dailyResponseTimes: SparklineData[] = Array.from(
    dailyStats.entries()
  ).map(([date, day]) => ({
    date,
    value: day.totalResponseTime / day.requests,
  }));

  const conversationData: SparklineData[] = Array.from(
    dailyStats.entries()
  ).map(([date, day]) => ({
    date,
    value: day.requests,
  }));

  return (
    <div className="flex-1 p-8 pt-6 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Statistics</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tokens">Token Usage</TabsTrigger>
          <TabsTrigger value="requests">API Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SparklineCard
              title="Total Tokens Used"
              value={stats.totalTokens.toLocaleString()}
              description="Token usage over time"
              data={tokenUsageData}
              dataKey="value"
              color="#8884d8"
            />
            <SparklineCard
              title="Total Conversations"
              value={stats.totalConversations.toLocaleString()}
              description="Conversation count over time"
              data={conversationData}
              dataKey="value"
              color="#82ca9d"
            />
            <SparklineCard
              title="Average Response Time"
              value={`${stats.averageResponseTime.toFixed(0)}ms`}
              description="Response latency trend"
              data={dailyResponseTimes}
              dataKey="value"
              color="#ffc658"
            />
            <SparklineCard
              title="Success Rate"
              value={`${stats.successRate.toFixed(1)}%`}
              description="Success rate trend"
              data={dailySuccessRates}
              dataKey="value"
              color="#ff8042"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Usage Over Time</CardTitle>
                <CardDescription>
                  Token usage trends over the past 30 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.usageOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        width={80}
                        tickFormatter={value => value.toLocaleString()}
                      />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="tokens"
                        stroke="#8884d8"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Model Distribution</CardTitle>
                <CardDescription>
                  Usage distribution across different models
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.modelDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="usage"
                      >
                        {stats.modelDistribution.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tokens" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Token Usage</CardTitle>
              <CardDescription>
                Breakdown of token usage by different metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {/* We'll add more detailed token analytics here in the future */}
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Detailed token statistics coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Request Analytics</CardTitle>
              <CardDescription>
                Detailed breakdown of API requests and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {/* We'll add more detailed request analytics here in the future */}
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  API request statistics coming soon
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
