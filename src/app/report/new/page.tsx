'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Check,
  FileText,
  Briefcase,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';
import Navbar from '../../components/Navbar';
import { REPORT_TEMPLATES } from '@/types';
import type { Project, DailyReport } from '@/types';

export default function NewReportPage() {
  const router = useRouter();
  const { currentUser, isLoading: authLoading } = useAuth();

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [template, setTemplate] = useState<keyof typeof REPORT_TEMPLATES>('normal');
  const [completed, setCompleted] = useState('');
  const [inProgress, setInProgress] = useState('');
  const [problems, setProblems] = useState('');
  const [tomorrowPlan, setTomorrowPlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReport, setExistingReport] = useState<DailyReport | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, authLoading, router]);

  useEffect(() => {
    if (currentUser) {
      fetchProjects();
      fetchTodayReport();
    }
  }, [currentUser]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.projects) {
        // Filter projects that the current user is a member of
        const userProjects = data.projects.filter(
          (p: Project) => p.status === 'active' && p.members.includes(currentUser!.id)
        );
        setProjects(userProjects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const fetchTodayReport = async () => {
    try {
      const response = await fetch(`/api/reports?userId=${currentUser?.id}&date=${today}`);
      const data = await response.json();
      if (data.reports && data.reports.length > 0) {
        const report = data.reports[0];
        setExistingReport(report);
        setSelectedProjects(report.projectIds);
        setCompleted(report.completed);
        setInProgress(report.inProgress);
        setProblems(report.problems);
        setTomorrowPlan(report.tomorrowPlan);
      } else {
        applyTemplate('normal');
      }
    } catch (error) {
      console.error('Failed to fetch today report:', error);
      applyTemplate('normal');
    } finally {
      setIsLoading(false);
    }
  };

  const applyTemplate = (key: keyof typeof REPORT_TEMPLATES) => {
    const tpl = REPORT_TEMPLATES[key];
    setCompleted(tpl.completed);
    setInProgress(tpl.inProgress);
    setProblems(tpl.problems);
    setTomorrowPlan(tpl.tomorrowPlan);
  };

  const handleTemplateChange = (value: keyof typeof REPORT_TEMPLATES) => {
    setTemplate(value);
    applyTemplate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjects.length === 0) {
      alert('请至少选择一个项目');
      return;
    }

    setIsSubmitting(true);

    const reportData = {
      userId: currentUser!.id,
      projectIds: selectedProjects,
      date: today,
      completed,
      inProgress,
      problems,
      tomorrowPlan,
    };

    try {
      if (existingReport) {
        await fetch(`/api/reports/${existingReport.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });
      } else {
        await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportData),
        });
      }

      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save report:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="page-transition">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl hover:bg-neutral-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">
                {existingReport ? '编辑日报' : '写日报'}
              </h1>
              <p className="text-neutral-500">
                {new Date().toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Selection */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Briefcase size={18} className="text-white" />
                </div>
                选择项目
              </h2>
              <div className="flex flex-wrap gap-3">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => toggleProject(project.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                      selectedProjects.includes(project.id)
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                    {selectedProjects.includes(project.id) && <Check size={16} />}
                  </button>
                ))}
              </div>
              {projects.length === 0 && (
                <p className="text-neutral-400 text-center py-4">暂无参与的项目</p>
              )}
            </div>

            {/* Template Selection */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">快速模板</h2>
              <div className="flex gap-3">
                {(Object.keys(REPORT_TEMPLATES) as Array<keyof typeof REPORT_TEMPLATES>).map(
                  (key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTemplateChange(key)}
                      className={`px-4 py-2 rounded-xl border-2 transition-all duration-200 ${
                        template === key
                          ? 'border-neutral-900 bg-neutral-100'
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      {REPORT_TEMPLATES[key].name}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Report Content */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-200 space-y-6">
              {/* Completed */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <Check size={18} className="text-white" />
                  </div>
                  已完成
                </label>
                <textarea
                  value={completed}
                  onChange={(e) => setCompleted(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none input-focus resize-none"
                  placeholder="今天完成了哪些工作..."
                />
              </div>

              {/* In Progress */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                    <FileText size={18} className="text-white" />
                  </div>
                  进行中
                </label>
                <textarea
                  value={inProgress}
                  onChange={(e) => setInProgress(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none input-focus resize-none"
                  placeholder="正在进行的工作..."
                />
              </div>

              {/* Problems */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                  遇到的问题
                </label>
                <textarea
                  value={problems}
                  onChange={(e) => setProblems(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none input-focus resize-none"
                  placeholder="遇到的问题或需要的帮助..."
                />
              </div>

              {/* Tomorrow Plan */}
              <div>
                <label className="flex items-center gap-2 text-lg font-semibold text-neutral-900 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <Calendar size={18} className="text-white" />
                  </div>
                  明日计划
                </label>
                <textarea
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 focus:border-neutral-900 focus:outline-none input-focus resize-none"
                  placeholder="明天的工作计划..."
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              {existingReport && (
                <p className="text-sm text-neutral-500">
                  上次更新：{new Date(existingReport.updatedAt).toLocaleString('zh-CN')}
                </p>
              )}
              <div className="flex gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-3 rounded-2xl border border-neutral-200 font-medium hover:bg-neutral-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || selectedProjects.length === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-neutral-900 text-white font-medium hover:bg-neutral-800 btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      {existingReport ? '更新日报' : '提交日报'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
