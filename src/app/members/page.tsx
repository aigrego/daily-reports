'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Trash2,
  FileText,
  FolderKanban,
  Shield,
  User,
  UserCog,
  X,
  Users,
  Mail,
  Building2,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../providers/AuthProvider';
import Navbar from '../components/Navbar';
import type { User as UserType, UserRole, Project, DailyReport } from '@/types';

export default function MembersPage() {
  const router = useRouter();
  const { currentUser, canManageMembers, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserType[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('member');

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser && !canManageMembers()) {
      router.push('/dashboard');
    }
  }, [currentUser, canManageMembers, router]);

  useEffect(() => {
    if (currentUser && canManageMembers()) {
      fetchData();
    }
  }, [currentUser, canManageMembers]);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersData.users) {
        setUsers(usersData.users);
      }

      // Fetch projects
      const projectsRes = await fetch('/api/projects');
      const projectsData = await projectsRes.json();
      if (projectsData.projects) {
        setProjects(projectsData.projects);
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

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormName('');
    setFormDepartment('');
    setFormRole('member');
  };

  const openCreate = () => {
    resetForm();
    setEditingUser(null);
    setIsCreateOpen(true);
  };

  const openEdit = (user: UserType) => {
    setFormName(user.name);
    setFormDepartment(user.department);
    setFormRole(user.role);
    setEditingUser(user);
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDepartment.trim()) return;

    const userData = {
      name: formName.trim(),
      department: formDepartment.trim(),
      role: formRole,
    };

    try {
      let response;
      if (editingUser) {
        response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      } else {
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      }

      const result = await response.json();
      console.log('Response:', result);

      if (!response.ok) {
        alert(result.error || '保存失败');
        return;
      }

      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (userId: string) => {
    if (confirm('确定要删除这个成员吗？')) {
      try {
        await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        fetchData();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'lead':
        return '负责人';
      default:
        return '成员';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return Shield;
      case 'lead':
        return UserCog;
      default:
        return User;
    }
  };

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return 'bg-neutral-900 text-white';
      case 'lead':
        return 'bg-neutral-700 text-white';
      default:
        return 'bg-neutral-200 text-neutral-700';
    }
  };

  const getUserStats = (userId: string) => {
    const userReports = reports.filter((r) => r.userId === userId);
    const userProjects = projects.filter((p) => p.members.includes(userId));
    return {
      reportCount: userReports.length,
      projectCount: userProjects.length,
      lastReport: userReports.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.date,
    };
  };

  // Calculate stats
  const totalMembers = users.length;
  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'lead').length;
  const memberCount = users.filter((u) => u.role === 'member').length;

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
      'bg-rose-500', 'bg-amber-500', 'bg-lime-500', 'bg-sky-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser || !canManageMembers()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-transition">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">成员管理</h1>
              <p className="text-neutral-500 text-sm mt-1">管理团队成员和权限</p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 btn-hover"
            >
              <Plus size={18} />
              添加成员
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center">
                  <Users size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{totalMembers}</div>
                  <div className="text-sm text-neutral-500">总成员</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Shield size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{adminCount}</div>
                  <div className="text-sm text-neutral-500">负责人/管理员</div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <User size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-neutral-900">{memberCount}</div>
                  <div className="text-sm text-neutral-500">普通成员</div>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索成员..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white focus:border-neutral-900 focus:outline-none text-sm"
            />
          </div>

          {/* Members Grid */}
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => {
                const stats = getUserStats(user.id);
                const RoleIcon = getRoleIcon(user.role);
                const avatarColor = getAvatarColor(user.name);

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl p-5 border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full ${avatarColor} flex items-center justify-center text-lg font-semibold text-white`}>
                          {user.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-neutral-900 truncate">
                            {user.name}
                          </h3>
                          <div className="flex items-center gap-1 text-neutral-400 text-xs mt-0.5">
                            <Mail size={12} />
                            <span className="truncate">{user.name.toLowerCase()}@company.com</span>
                          </div>
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
                                onClick={() => openEdit(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-neutral-100 transition-colors cursor-pointer"
                              >
                                <Edit3 size={14} />
                                编辑
                              </button>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild>
                              <button
                                onClick={() => handleDelete(user.id)}
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

                    {/* Role & Department */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        user.role === 'admin' ? 'bg-red-50 text-red-600' :
                        user.role === 'lead' ? 'bg-blue-50 text-blue-600' :
                        'bg-neutral-100 text-neutral-600'
                      }`}>
                        <RoleIcon size={12} />
                        {getRoleLabel(user.role)}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600">
                        <Building2 size={12} />
                        {user.department}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
                      <div>
                        <div className="text-xl font-bold text-neutral-900">{stats.projectCount}</div>
                        <div className="text-xs text-neutral-500">参与项目</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-neutral-900">{stats.reportCount}</div>
                        <div className="text-xs text-neutral-500">提交日报</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center border border-neutral-200">
              <p className="text-neutral-400">暂无成员</p>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog.Root open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 p-6">
            <Dialog.Title className="text-xl font-bold text-neutral-900 mb-6">
              {editingUser ? '编辑成员' : '添加成员'}
            </Dialog.Title>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  姓名
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="输入姓名"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none"
                  required
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  部门
                </label>
                <input
                  type="text"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  placeholder="输入部门"
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none"
                  required
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  角色
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['member', 'lead', 'admin'] as UserRole[]).map((role) => {
                    const RoleIcon = getRoleIcon(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormRole(role)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          formRole === role
                            ? 'border-neutral-900 bg-neutral-50'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <RoleIcon
                          size={24}
                          className={formRole === role ? 'text-neutral-900' : 'text-neutral-400'}
                        />
                        <span
                          className={`text-sm font-medium ${
                            formRole === role ? 'text-neutral-900' : 'text-neutral-500'
                          }`}
                        >
                          {getRoleLabel(role)}
                        </span>
                      </button>
                    );
                  })}
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
                  {editingUser ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
