'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  Users,
  Calendar,
  X,
  FileText,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useAuth } from '../providers/AuthProvider';
import Navbar from '../components/Navbar';
import type { ViewMode, FilterOptions, DailyReport, Project, User } from '@/types';

export default function SummaryPage() {
  const router = useRouter();
  const { currentUser, canViewAllReports, isLoading: authLoading } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('date');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser]);

  const fetchData = async () => {
    try {
      // Fetch reports
      const reportsRes = await fetch('/api/reports');
      const reportsData = await reportsRes.json();
      if (reportsData.reports) {
        setReports(reportsData.reports);
      }

      // Fetch projects
      const projectsRes = await fetch('/api/projects');
      const projectsData = await projectsRes.json();
      if (projectsData.projects) {
        setProjects(projectsData.projects);
      }

      // Fetch users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersData.users) {
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserById = (userId: string) => users.find((u) => u.id === userId);
  const getProjectById = (projectId: string) => projects.find((p) => p.id === projectId);

  const filteredReports = useMemo(() => {
    let result = [...reports];

    // Filter by keyword
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(
        (r) =>
          r.completed.toLowerCase().includes(keyword) ||
          r.inProgress.toLowerCase().includes(keyword) ||
          r.problems.toLowerCase().includes(keyword) ||
          r.tomorrowPlan.toLowerCase().includes(keyword)
      );
    }

    // Filter by project
    if (filters.projectId) {
      result = result.filter((r) => r.projectIds.includes(filters.projectId!));
    }

    // Filter by member
    if (filters.memberId) {
      result = result.filter((r) => r.userId === filters.memberId);
    }

    // Filter by date range
    if (filters.startDate) {
      result = result.filter((r) => r.date >= filters.startDate!);
    }
    if (filters.endDate) {
      result = result.filter((r) => r.date <= filters.endDate!);
    }

    // If user cannot view all reports, only show their own
    if (!canViewAllReports()) {
      result = result.filter((r) => r.userId === currentUser?.id);
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reports, searchKeyword, filters, canViewAllReports, currentUser]);

  const groupedReports = useMemo(() => {
    if (viewMode === 'project') {
      const groups: Record<string, DailyReport[]> = {};
      filteredReports.forEach((report) => {
        report.projectIds.forEach((projectId) => {
          if (!groups[projectId]) groups[projectId] = [];
          groups[projectId].push(report);
        });
      });
      return groups;
    } else if (viewMode === 'member') {
      const groups: Record<string, DailyReport[]> = {};
      filteredReports.forEach((report) => {
        if (!groups[report.userId]) groups[report.userId] = [];
        groups[report.userId].push(report);
      });
      return groups;
    } else {
      const groups: Record<string, DailyReport[]> = {};
      filteredReports.forEach((report) => {
        if (!groups[report.date]) groups[report.date] = [];
        groups[report.date].push(report);
      });
      return groups;
    }
  }, [filteredReports, viewMode]);

  const clearFilters = () => {
    setFilters({});
    setSearchKeyword('');
  };

  const hasActiveFilters =
    filters.projectId || filters.memberId || filters.startDate || filters.endDate || searchKeyword;

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">汇总查看</h1>

            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-2xl border border-neutral-200">
              <button
                onClick={() => setViewMode('project')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'project'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <LayoutGrid size={16} />
                按项目
              </button>
              <button
                onClick={() => setViewMode('member')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'member'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Users size={16} />
                按人员
              </button>
              <button
                onClick={() => setViewMode('date')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  viewMode === 'date'
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Calendar size={16} />
                按日期
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-3xl p-6 border border-neutral-200 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="搜索日报内容..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none"
                />
              </div>

              {/* Project Filter */}
              <select
                value={filters.projectId || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    projectId: e.target.value || undefined,
                  }))
                }
                className="px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none bg-white"
              >
                <option value="">所有项目</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Member Filter */}
              {canViewAllReports() && (
                <select
                  value={filters.memberId || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      memberId: e.target.value || undefined,
                    }))
                  }
                  className="px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none bg-white"
                >
                  <option value="">所有成员</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              )}

              {/* Date Range */}
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    startDate: e.target.value || undefined,
                  }))
                }
                className="px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none"
              />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    endDate: e.target.value || undefined,
                  }))
                }
                className="px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none"
              />

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-neutral-200 hover:bg-neutral-100 transition-colors"
                >
                  <X size={16} />
                  清除
                </button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <p className="text-neutral-500 mb-4">
            共找到 {filteredReports.length} 条日报
          </p>

          {/* Reports List */}
          {Object.entries(groupedReports).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedReports).map(([key, groupReports]) => {
                let groupTitle = key;
                let groupSubtitle = '';

                if (viewMode === 'project') {
                  const project = getProjectById(key);
                  groupTitle = project?.name || '未知项目';
                  groupSubtitle = project?.description || '';
                } else if (viewMode === 'member') {
                  const user = getUserById(key);
                  groupTitle = user?.name || '未知成员';
                  groupSubtitle = user?.department || '';
                } else {
                  groupTitle = new Date(key).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'long',
                  });
                }

                return (
                  <div key={key} className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
                    <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200">
                      <h3 className="font-semibold text-neutral-900">{groupTitle}</h3>
                      {groupSubtitle && (
                        <p className="text-sm text-neutral-500">{groupSubtitle}</p>
                      )}
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {groupReports.map((report) => {
                        const user = getUserById(report.userId);
                        const reportProjects = report.projectIds
                          .map((id) => getProjectById(id))
                          .filter(Boolean);

                        return (
                          <button
                            key={report.id}
                            onClick={() => setSelectedReport(report)}
                            className="w-full flex items-start gap-4 p-6 hover:bg-neutral-50 transition-colors text-left"
                          >
                            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-semibold flex-shrink-0">
                              {user?.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="font-semibold text-neutral-900">
                                  {user?.name}
                                </span>
                                <span className="text-sm text-neutral-500">
                                  {new Date(report.date).toLocaleDateString('zh-CN')}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {reportProjects.map((project) => (
                                  <span
                                    key={project!.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-700"
                                  >
                                    <div
                                      className="w-2 h-2 rounded-full"
                                      style={{ backgroundColor: project!.color }}
                                    />
                                    {project!.name}
                                  </span>
                                ))}
                              </div>
                              <p className="text-sm text-neutral-600 line-clamp-2">
                                {report.completed}
                              </p>
                            </div>
                            <FileText size={20} className="text-neutral-400 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-neutral-200 text-center">
              <FileText size={48} className="mx-auto text-neutral-300 mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">暂无日报</h3>
              <p className="text-neutral-500">
                {hasActiveFilters ? '尝试调整筛选条件' : '还没有人提交日报'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Report Detail Dialog */}
      <Dialog.Root open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-50 p-6">
            {selectedReport && (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-bold text-neutral-900">
                      日报详情
                    </Dialog.Title>
                    <p className="text-neutral-500 mt-1">
                      {new Date(selectedReport.date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        weekday: 'long',
                      })}
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="space-y-6">
                  {/* User Info */}
                  <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-semibold">
                      {getUserById(selectedReport.userId)?.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">
                        {getUserById(selectedReport.userId)?.name}
                      </div>
                      <div className="text-sm text-neutral-500">
                        {getUserById(selectedReport.userId)?.department}
                      </div>
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">参与项目</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.projectIds.map((projectId) => {
                        const project = getProjectById(projectId);
                        return (
                          <span
                            key={projectId}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-medium bg-neutral-100"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: project?.color }}
                            />
                            {project?.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Completed */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">已完成</h4>
                    <div className="p-4 bg-green-50 rounded-2xl">
                      <p className="text-neutral-800 whitespace-pre-wrap">
                        {selectedReport.completed}
                      </p>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">进行中</h4>
                    <div className="p-4 bg-blue-50 rounded-2xl">
                      <p className="text-neutral-800 whitespace-pre-wrap">
                        {selectedReport.inProgress}
                      </p>
                    </div>
                  </div>

                  {/* Problems */}
                  {selectedReport.problems && (
                    <div>
                      <h4 className="text-sm font-medium text-neutral-500 mb-2">遇到的问题</h4>
                      <div className="p-4 bg-amber-50 rounded-2xl">
                        <p className="text-neutral-800 whitespace-pre-wrap">
                          {selectedReport.problems}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tomorrow Plan */}
                  <div>
                    <h4 className="text-sm font-medium text-neutral-500 mb-2">明日计划</h4>
                    <div className="p-4 bg-purple-50 rounded-2xl">
                      <p className="text-neutral-800 whitespace-pre-wrap">
                        {selectedReport.tomorrowPlan}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="pt-4 border-t border-neutral-200 text-sm text-neutral-400">
                    提交时间：{new Date(selectedReport.createdAt).toLocaleString('zh-CN')}
                    {selectedReport.updatedAt !== selectedReport.createdAt && (
                      <span className="ml-4">
                        更新时间：{new Date(selectedReport.updatedAt).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
