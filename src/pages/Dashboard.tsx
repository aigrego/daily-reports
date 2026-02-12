import { useMemo } from 'react';
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
import { useApp } from '../contexts/AppContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const {
    currentUser,
    getStats,
    getLast7DaysStats,
    reports,
    users,
    getUserById,
    getProjectById,
    canViewAllReports,
  } = useApp();

  const stats = getStats();
  const chartData = getLast7DaysStats();

  const todayReports = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reports
      .filter((r) => r.date === today)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reports]);

  const unsubmittedUsers = useMemo(() => {
    if (!canViewAllReports()) return [];
    const today = new Date().toISOString().split('T')[0];
    const submittedUserIds = new Set(
      reports.filter((r) => r.date === today).map((r) => r.userId)
    );
    return users.filter((u) => !submittedUserIds.has(u.id));
  }, [reports, users, canViewAllReports]);

  const myStats = useMemo(() => {
    const myReports = reports.filter((r) => r.userId === currentUser?.id);
    const today = new Date().toISOString().split('T')[0];
    return {
      total: myReports.length,
      todaySubmitted: myReports.some((r) => r.date === today),
      streak: calculateStreak(myReports),
    };
  }, [reports, currentUser]);

  function calculateStreak(myReports: typeof reports) {
    if (myReports.length === 0) return 0;
    const sortedDates = [...new Set(myReports.map((r) => r.date))].sort().reverse();
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
          {canViewAllReports() ? (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                      fill="#0a0a0a"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Today's Reports */}
              <div className="bg-white rounded-3xl p-6 border border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">今日日报</h2>
                {todayReports.length > 0 ? (
                  <div className="space-y-3">
                    {todayReports.slice(0, 5).map((report) => {
                      const user = getUserById(report.userId);
                      const projects = report.projectIds
                        .map((id) => getProjectById(id)?.name)
                        .filter(Boolean)
                        .join(', ');
                      return (
                        <div
                          key={report.id}
                          className="flex items-start gap-3 p-3 rounded-2xl bg-neutral-50"
                        >
                          <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                            {user?.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                              {user?.name}
                            </div>
                            <div className="text-sm text-neutral-500 truncate">
                              {projects}
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              {new Date(report.createdAt).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="empty-state py-8">
                    <Calendar size={40} className="text-neutral-300 mb-3" />
                    <p className="text-neutral-400">今日暂无日报</p>
                  </div>
                )}
              </div>

              {/* Unsubmitted Users */}
              {canViewAllReports() && unsubmittedUsers.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle size={20} className="text-amber-500" />
                    <h2 className="text-lg font-semibold text-neutral-900">未提交提醒</h2>
                  </div>
                  <div className="space-y-2">
                    {unsubmittedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-semibold text-amber-700">
                          {user.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-neutral-900">{user.name}</div>
                          <div className="text-sm text-neutral-500">{user.department}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
