import { useState } from 'react';
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
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useApp } from '../contexts/AppContext';
import { Navbar } from '../components';
import type { User as UserType, UserRole } from '../types';

export default function Members() {
  const { users, projects, reports, addUser, updateUser, deleteUser, getUserProjects } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('member');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDepartment.trim()) return;

    const userData = {
      name: formName.trim(),
      department: formDepartment.trim(),
      role: formRole,
    };

    if (editingUser) {
      updateUser(editingUser.id, userData);
    } else {
      addUser(userData);
    }

    setIsCreateOpen(false);
    resetForm();
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
    const userProjects = getUserProjects(userId);
    return {
      reportCount: userReports.length,
      projectCount: userProjects.length,
      lastReport: userReports.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.date,
    };
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-transition">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl font-bold text-neutral-900">成员管理</h1>
            <button
              onClick={openCreate}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-2xl font-medium hover:bg-neutral-800 btn-hover"
            >
              <Plus size={20} />
              添加成员
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
              placeholder="搜索成员..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 bg-white focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {/* Members List */}
          <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden">
            {filteredUsers.length > 0 ? (
              <div className="divide-y divide-neutral-100">
                {filteredUsers.map((user) => {
                  const stats = getUserStats(user.id);
                  const RoleIcon = getRoleIcon(user.role);

                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 p-6 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-neutral-200 flex items-center justify-center text-xl font-semibold">
                        {user.name[0]}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg text-neutral-900">
                            {user.name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
                              user.role
                            )}`}
                          >
                            <RoleIcon size={12} />
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-neutral-500 text-sm">{user.department}</p>
                      </div>

                      <div className="hidden sm:flex items-center gap-6 text-sm text-neutral-500">
                        <div className="flex items-center gap-1">
                          <FileText size={16} />
                          <span>{stats.reportCount} 日报</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FolderKanban size={16} />
                          <span>{stats.projectCount} 项目</span>
                        </div>
                        {stats.lastReport && (
                          <div className="text-neutral-400">
                            最近提交：{new Date(stats.lastReport).toLocaleDateString('zh-CN')}
                          </div>
                        )}
                      </div>

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-2 rounded-xl hover:bg-neutral-200 transition-colors">
                            <MoreVertical size={18} />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="min-w-[160px] bg-white rounded-2xl shadow-xl border border-neutral-200 p-2 animate-in fade-in zoom-in-95 duration-200"
                            sideOffset={4}
                            align="end"
                          >
                            <DropdownMenu.Item asChild>
                              <button
                                onClick={() => openEdit(user)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-neutral-100 transition-colors"
                              >
                                <Edit3 size={16} />
                                编辑
                              </button>
                            </DropdownMenu.Item>
                            <DropdownMenu.Item asChild>
                              <button
                                onClick={() => {
                                  if (confirm('确定要删除这个成员吗？')) {
                                    deleteUser(user.id);
                                  }
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 size={16} />
                                删除
                              </button>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-neutral-400">暂无成员</p>
              </div>
            )}
          </div>
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
