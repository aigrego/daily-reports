'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Archive,
  Trash2,
  Edit3,
  Users,
  FileText,
  X,
  Check,
  FolderKanban,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../providers/AuthProvider';
import Navbar from '../components/Navbar';
import { PROJECT_COLORS } from '@/types';
import type { Project, User, DailyReport } from '@/types';

export default function ProjectsPage() {
  const router = useRouter();
  const { currentUser, canManageProjects, isLoading: authLoading } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState(PROJECT_COLORS[0]);
  const [formMembers, setFormMembers] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser && !canManageProjects()) {
      router.push('/dashboard');
    }
  }, [currentUser, canManageProjects, router]);

  useEffect(() => {
    if (currentUser && canManageProjects()) {
      fetchData();
    }
  }, [currentUser, canManageProjects]);

  const fetchData = async () => {
    try {
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

      // Fetch reports
      const reportsRes = await fetch('/api/reports');
      const reportsData = await reportsRes.json();
      if (reportsData.reports) {
        setReports(reportsData.reports);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeProjects = filteredProjects.filter((p) => p.status === 'active');
  const archivedProjects = filteredProjects.filter((p) => p.status === 'archived');

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor(PROJECT_COLORS[0]);
    setFormMembers([]);
  };

  const openCreate = () => {
    resetForm();
    setEditingProject(null);
    setIsCreateOpen(true);
  };

  const openEdit = (project: Project) => {
    setFormName(project.name);
    setFormDescription(project.description);
    setFormColor(project.color);
    setFormMembers(project.members);
    setEditingProject(project);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const projectData = {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      member_ids: formMembers,
      status: 'active' as const,
    };

    try {
      if (editingProject) {
        await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
      } else {
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });
      }

      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('保存失败，请重试');
    }
  };

  const toggleMember = (userId: string) => {
    setFormMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleArchive = async (projectId: string) => {
    try {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...project, status: 'archived' }),
      });

      fetchData();
    } catch (error) {
      console.error('Failed to archive project:', error);
      alert('归档失败，请重试');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (confirm('确定要删除这个项目吗？相关日报也会被删除。')) {
      try {
        await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
        });

        fetchData();
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const getUserById = (userId: string) => users.find((u) => u.id === userId);

  const getProjectStats = (projectId: string) => {
    const projectReports = reports.filter((r) => r.projectIds.includes(projectId));
    const uniqueMembers = new Set(projectReports.map((r) => r.userId));
    return {
      reportCount: projectReports.length,
      memberCount: uniqueMembers.size,
    };
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const stats = getProjectStats(project.id);
    // Handle both string[] (IDs) and object[] (full user objects) from API
    const memberUsers = Array.isArray(project.members) && project.members.length > 0
      ? typeof project.members[0] === 'string'
        ? (project.members as string[]).map((id) => getUserById(id)).filter(Boolean)
        : (project.members as { id: string; name: string; department: string; role: string }[])
      : [];

    // Generate icon background color based on project color
    const getIconBgColor = (color: string) => {
      const colorMap: Record<string, string> = {
        '#0a0a0a': 'bg-blue-50 text-blue-600',
        '#525252': 'bg-green-50 text-green-600',
        '#737373': 'bg-amber-50 text-amber-600',
        '#a3a3a3': 'bg-pink-50 text-pink-600',
        '#d4d4d4': 'bg-purple-50 text-purple-600',
        '#171717': 'bg-indigo-50 text-indigo-600',
        '#262626': 'bg-teal-50 text-teal-600',
        '#404040': 'bg-orange-50 text-orange-600',
        '#ef4444': 'bg-red-50 text-red-600',
        '#f97316': 'bg-orange-50 text-orange-600',
        '#f59e0b': 'bg-amber-50 text-amber-600',
        '#84cc16': 'bg-lime-50 text-lime-600',
        '#22c55e': 'bg-green-50 text-green-600',
        '#10b981': 'bg-emerald-50 text-emerald-600',
        '#14b8a6': 'bg-teal-50 text-teal-600',
        '#06b6d4': 'bg-cyan-50 text-cyan-600',
        '#0ea5e9': 'bg-sky-50 text-sky-600',
        '#3b82f6': 'bg-blue-50 text-blue-600',
        '#6366f1': 'bg-indigo-50 text-indigo-600',
        '#8b5cf6': 'bg-violet-50 text-violet-600',
        '#a855f7': 'bg-purple-50 text-purple-600',
        '#d946ef': 'bg-fuchsia-50 text-fuchsia-600',
        '#ec4899': 'bg-pink-50 text-pink-600',
        '#f43f5e': 'bg-rose-50 text-rose-600',
      };
      return colorMap[color] || 'bg-blue-50 text-blue-600';
    };

    const iconBgClass = getIconBgColor(project.color);

    return (
      <div className="bg-white rounded-2xl p-5 border border-neutral-200 hover:shadow-md transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${iconBgClass} flex items-center justify-center`}>
              <FolderKanban size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-base text-neutral-900">{project.name}</h3>
              <p className="text-xs text-neutral-400">
                {new Date(project.createdAt).toLocaleDateString('zh-CN')} 创建
              </p>
            </div>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
                <MoreVertical size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[140px] bg-white rounded-xl shadow-xl border border-neutral-200 p-1.5 animate-in fade-in zoom-in-95 duration-200"
                sideOffset={4}
                align="end"
              >
                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => openEdit(project)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <Edit3 size={14} />
                    编辑
                  </button>
                </DropdownMenu.Item>
                {project.status === 'active' && (
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={() => handleArchive(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-neutral-100 transition-colors cursor-pointer"
                    >
                      <Archive size={14} />
                      归档
                    </button>
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* Description */}
        <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{project.description}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Users size={16} />
            <span>{memberUsers.length} 人</span>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            project.status === 'active'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600'
          }`}>
            {project.status === 'active' ? '进行中' : '已归档'}
          </span>
        </div>

        {/* Member Avatars */}
        <div className="flex items-center -space-x-2 mt-3">
          {memberUsers.slice(0, 5).map((user, index) => {
            const colors = [
              'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
              'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
              'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-sky-500',
            ];
            const colorClass = colors[index % colors.length];
            return (
              <div
                key={user!.id}
                className={`w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-xs font-semibold text-white border-2 border-white`}
                title={user!.name}
              >
                {user!.name[0]}
              </div>
            );
          })}
          {memberUsers.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium text-neutral-600 border-2 border-white">
              +{memberUsers.length - 5}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || !canManageProjects()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-transition">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">项目管理</h1>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-medium hover:bg-neutral-800 btn-hover"
            >
              <Plus size={20} />
              新建项目
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 bg-white focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {/* Active Projects */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              进行中 ({activeProjects.length})
            </h2>
            {activeProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-neutral-200 text-center">
                <p className="text-neutral-400">暂无进行中的项目</p>
              </div>
            )}
          </div>

          {/* Archived Projects */}
          {archivedProjects.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                已归档 ({archivedProjects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl z-50 p-6">
            <Dialog.Title className="text-xl font-bold text-neutral-900 mb-6">
              {editingProject ? '编辑项目' : '新建项目'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目名称
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="输入项目名称"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目描述
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="输入项目描述"
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none resize-none"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目颜色
                </label>
                <div className="flex flex-wrap gap-3">
                  {PROJECT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-10 h-10 rounded-full transition-all ${
                        formColor === color
                          ? 'ring-2 ring-offset-2 ring-neutral-900 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formColor === color && <Check size={20} className="text-white mx-auto" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Members */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  项目成员
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border border-neutral-200 rounded-2xl">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formMembers.includes(user.id)}
                        onChange={() => toggleMember(user.id)}
                        className="w-5 h-5 rounded-lg border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                      />
                      <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-sm font-semibold">
                        {user.name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-neutral-900">{user.name}</div>
                        <div className="text-xs text-neutral-500">{user.department}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 px-6 py-3 rounded-2xl border border-neutral-200 font-medium hover:bg-neutral-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 rounded-2xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 btn-hover"
                >
                  {editingProject ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
