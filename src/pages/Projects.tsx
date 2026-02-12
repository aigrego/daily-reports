import { useState } from 'react';
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
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useApp } from '../contexts/AppContext';
import { Navbar } from '../components';
import { PROJECT_COLORS } from '../types';
import type { Project } from '../types';

export default function Projects() {
  const {
    projects,
    users,
    reports,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    getUserById,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState(PROJECT_COLORS[0]);
  const [formMembers, setFormMembers] = useState<string[]>([]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const projectData = {
      name: formName.trim(),
      description: formDescription.trim(),
      color: formColor,
      members: formMembers,
      status: 'active' as const,
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
    }

    setIsCreateOpen(false);
    resetForm();
  };

  const toggleMember = (userId: string) => {
    setFormMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

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
    const memberUsers = project.members.map((id) => getUserById(id)).filter(Boolean);

    return (
      <div className="bg-white rounded-3xl p-6 border border-neutral-200 card-hover">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: project.color }}
            />
            <h3 className="font-semibold text-lg text-neutral-900">{project.name}</h3>
          </div>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="p-2 rounded-xl hover:bg-neutral-100 transition-colors">
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
                    onClick={() => openEdit(project)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-neutral-100 transition-colors"
                  >
                    <Edit3 size={16} />
                    编辑
                  </button>
                </DropdownMenu.Item>
                {project.status === 'active' && (
                  <DropdownMenu.Item asChild>
                    <button
                      onClick={() => archiveProject(project.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-neutral-100 transition-colors"
                    >
                      <Archive size={16} />
                      归档
                    </button>
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item asChild>
                  <button
                    onClick={() => {
                      if (confirm('确定要删除这个项目吗？相关日报也会被删除。')) {
                        deleteProject(project.id);
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

        <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{project.description}</p>

        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
          <div className="flex items-center gap-1">
            <FileText size={16} />
            <span>{stats.reportCount} 日报</span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{stats.memberCount} 成员</span>
          </div>
        </div>

        <div className="flex items-center -space-x-2">
          {memberUsers.slice(0, 5).map((user) => (
            <div
              key={user!.id}
              className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-semibold border-2 border-white"
              title={user!.name}
            >
              {user!.name[0]}
            </div>
          ))}
          {memberUsers.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-medium border-2 border-white">
              +{memberUsers.length - 5}
            </div>
          )}
        </div>

        {project.status === 'archived' && (
          <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
            <Archive size={12} />
            已归档
          </div>
        )}
      </div>
    );
  };

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
