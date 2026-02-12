'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  FolderKanban,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../providers/AuthProvider';
import Navbar from '../components/Navbar';

interface Stats {
  totalReports: number;
  activeProjects: number;
  totalMembers: number;
  todayReports: number;
}

interface Report {
  id: string;
  userId: string;
  date: string;
  completed: string;
  createdAt: string;
  userName?: string;
  projects?: string[];
}

interface ChartData {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser, canViewAllReports, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [todayReports, setTodayReports] = useState<Report[]>([]);
  const [unsubmittedUsers, setUnsubmittedUsers] = useState<{ id: string; name: string; department: string }[]>([]);
  const [myStats, setMyStats] = useState({ total: 0, streak: 0, todaySubmitted: false });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();

      if (data.stats) {
        setStats(data.stats);
      }
      if (data.last7Days) {
        setChartData(data.last7Days);
      }
      if (data.todayReports) {
        setTodayReports(data.todayReports);
      }
      if (data.unsubmittedUsers) {
        setUnsubmittedUsers(data.unsubmittedUsers);
      }

      // Fetch my stats
      const myReportsRes = await fetch(`/api/reports?userId=${currentUser?.id}`);
      const myReportsData = await myReportsRes.json();
      const myReports = myReportsData.reports || [];

      const today = new Date().toISOString().split('T')[0];
      setMyStats({
        total: myReports.length,
        todaySubmitted: myReports.some((r: Report) => r.date === today),
        streak: calculateStreak(myReports),
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  function calculateStreak(reports: Report[]) {
    if (reports.length === 0) return 0;
    const sortedDates = [...new Set(reports.map((r) => r.date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i]);
      const diffDays = Math.floor(
        (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === i || (i === 0 && diffDays === 1)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    subtitle,
    colorClass,
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    subtitle?: string;
    colorClass?: string;
  }) => (
    <div className="bg-white rounded-3xl p-6 border border-neutral-200 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
          {subtitle && <p className="text-sm text-neutral-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colorClass || 'bg-neutral-100'}`}>
          <Icon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-transition">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">
              你好，{currentUser?.name}
            </h1>
            <p className="text-neutral-500 mt-1">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long',
              })}
            </p>
          </div>

          {/* Stats Grid */}
          {canViewAllReports() && stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="总日报数"
                value={stats.totalReports}
                icon={FileText}
                subtitle="累计提交"
                colorClass="icon-bg-primary"
              />
              <StatCard
                title="活跃项目"
                value={stats.activeProjects}
                icon={FolderKanban}
                subtitle="进行中"
                colorClass="icon-bg-success"
              />
              <StatCard
                title="团队成员"
                value={stats.totalMembers}
                icon={Users}
                subtitle="总人数"
                colorClass="icon-bg-purple"
              />
              <StatCard
                title="今日日报"
                value={stats.todayReports}
                icon={Calendar}
                subtitle={`/${stats.totalMembers} 人已提交`}
                colorClass="icon-bg-info"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="我的日报"
                value={myStats.total}
                icon={FileText}
                subtitle="累计提交"
                colorClass="icon-bg-primary"
              />
              <StatCard
                title="连续提交"
                value={myStats.streak}
                icon={TrendingUp}
                subtitle="天"
                colorClass="icon-bg-success"
              />
              <StatCard
                title="今日状态"
                value={myStats.todaySubmitted ? '已提交' : '未提交'}
                icon={Clock}
                subtitle={myStats.todaySubmitted ? '继续保持' : '记得写日报'}
                colorClass={myStats.todaySubmitted ? 'icon-bg-success' : 'icon-bg-warning'}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">近7天日报统计</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#737373', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#737373', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '12px',
                        boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Today's Reports */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={20} className="text-neutral-400" />
                <h2 className="text-lg font-semibold text-neutral-900">今日日报</h2>
              </div>
              {todayReports.length > 0 ? (
                <div className="space-y-2">
                  {todayReports.slice(0, 10).map((report) => (
                    <div
                      key={report.id}
                      onClick={() => router.push(`/report/${report.id}`)}
                      className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 hover:bg-neutral-100 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
                        {report.userName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-neutral-600 truncate">
                          {report.completed?.split('\n')[0]?.replace(/^\d+\.\s*/, '') || '无内容'}
                          {report.projects && report.projects.length > 0 && (
                            <span className="text-neutral-400 ml-1">
                              ({report.userName} · {report.projects.join(', ')})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 flex-shrink-0">
                        {new Date(report.createdAt).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state py-8">
                  <Calendar size={40} className="text-neutral-300 mb-3" />
                  <p className="text-neutral-400">今日暂无日报</p>
                </div>
              )}
            </div>
          </div>

          {/* Unsubmitted Users - Bottom Section */}
          {canViewAllReports() && unsubmittedUsers.length > 0 && (
            <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle size={24} className="text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900">
                      今日有 {unsubmittedUsers.length} 位成员未提交日报
                    </h3>
                    <p className="text-sm text-red-600 mt-0.5">
                      请及时提醒团队成员提交今日工作汇报
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {unsubmittedUsers.map((user, index) => {
                    const colors = [
                      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
                      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
                      'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-sky-500',
                    ];
                    const colorClass = colors[index % colors.length];
                    return (
                      <div
                        key={user.id}
                        className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-sm font-semibold text-white border-2 border-red-50`}
                        style={{ marginLeft: index > 0 ? '-12px' : '0', zIndex: unsubmittedUsers.length - index }}
                        title={`${user.name} (${user.department})`}
                      >
                        {user.name[0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
