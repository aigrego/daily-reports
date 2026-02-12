import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { User, Project, DailyReport, UserRole, FilterOptions, ViewMode } from '../types';
import { mockUsers, mockProjects, mockReports } from '../data/mockData';

interface AppContextType {
  // Current user
  currentUser: User | null;
  login: (user: User) => void;
  logout: () => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  getUserById: (id: string) => User | undefined;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
  getProjectById: (id: string) => Project | undefined;
  getUserProjects: (userId: string) => Project[];

  // Reports
  reports: DailyReport[];
  addReport: (report: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReport: (id: string, updates: Partial<DailyReport>) => void;
  deleteReport: (id: string) => void;
  getReportById: (id: string) => DailyReport | undefined;
  getUserReports: (userId: string) => DailyReport[];
  getProjectReports: (projectId: string) => DailyReport[];
  getTodayReport: (userId: string) => DailyReport | undefined;
  getFilteredReports: (filters: FilterOptions, viewMode: ViewMode) => DailyReport[];

  // Stats
  getStats: () => {
    totalReports: number;
    activeProjects: number;
    totalMembers: number;
    todayReports: number;
  };
  getLast7DaysStats: () => { date: string; count: number }[];

  // Permissions
  canViewAllReports: () => boolean;
  canManageProjects: () => boolean;
  canManageMembers: () => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [reports, setReports] = useState<DailyReport[]>(mockReports);

  // Auth
  const login = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  // Users
  const addUser = useCallback((user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === id ? { ...user, ...updates } : user))
    );
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }, []);

  const getUserById = useCallback(
    (id: string) => users.find((user) => user.id === id),
    [users]
  );

  // Projects
  const addProject = useCallback((project: Omit<Project, 'id' | 'createdAt'>) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    setProjects((prev) => [...prev, newProject]);
  }, []);

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((project) => (project.id === id ? { ...project, ...updates } : project))
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    setReports((prev) => prev.filter((report) => !report.projectIds.includes(id)));
  }, []);

  const archiveProject = useCallback((id: string) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, status: 'archived' as const } : project
      )
    );
  }, []);

  const getProjectById = useCallback(
    (id: string) => projects.find((project) => project.id === id),
    [projects]
  );

  const getUserProjects = useCallback(
    (userId: string) =>
      projects.filter(
        (project) => project.members.includes(userId) && project.status === 'active'
      ),
    [projects]
  );

  // Reports
  const addReport = useCallback((report: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newReport: DailyReport = {
      ...report,
      id: Date.now().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setReports((prev) => [...prev, newReport]);
  }, []);

  const updateReport = useCallback((id: string, updates: Partial<DailyReport>) => {
    setReports((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, ...updates, updatedAt: new Date().toISOString() } : report
      )
    );
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((report) => report.id !== id));
  }, []);

  const getReportById = useCallback(
    (id: string) => reports.find((report) => report.id === id),
    [reports]
  );

  const getUserReports = useCallback(
    (userId: string) =>
      reports
        .filter((report) => report.userId === userId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [reports]
  );

  const getProjectReports = useCallback(
    (projectId: string) =>
      reports
        .filter((report) => report.projectIds.includes(projectId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [reports]
  );

  const getTodayReport = useCallback(
    (userId: string) => {
      const today = new Date().toISOString().split('T')[0];
      return reports.find((report) => report.userId === userId && report.date === today);
    },
    [reports]
  );

  const getFilteredReports = useCallback(
    (filters: FilterOptions, viewMode: ViewMode) => {
      let filtered = [...reports];

      // Role-based filtering
      if (currentUser?.role === 'member') {
        filtered = filtered.filter((report) => report.userId === currentUser.id);
      }

      // Apply filters
      if (filters.projectId) {
        filtered = filtered.filter((report) => report.projectIds.includes(filters.projectId!));
      }

      if (filters.memberId) {
        filtered = filtered.filter((report) => report.userId === filters.memberId);
      }

      if (filters.startDate) {
        filtered = filtered.filter((report) => report.date >= filters.startDate!);
      }

      if (filters.endDate) {
        filtered = filtered.filter((report) => report.date <= filters.endDate!);
      }

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        filtered = filtered.filter(
          (report) =>
            report.completed.toLowerCase().includes(keyword) ||
            report.inProgress.toLowerCase().includes(keyword) ||
            report.problems.toLowerCase().includes(keyword) ||
            report.tomorrowPlan.toLowerCase().includes(keyword)
        );
      }

      // Sort by date desc
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return filtered;
    },
    [reports, currentUser]
  );

  // Stats
  const getStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      totalReports: reports.length,
      activeProjects: projects.filter((p) => p.status === 'active').length,
      totalMembers: users.length,
      todayReports: reports.filter((r) => r.date === today).length,
    };
  }, [reports, projects, users]);

  const getLast7DaysStats = useCallback(() => {
    const stats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = reports.filter((r) => r.date === dateStr).length;
      stats.push({
        date: dateStr.slice(5),
        count,
      });
    }
    return stats;
  }, [reports]);

  // Permissions
  const canViewAllReports = useCallback(() => {
    return currentUser?.role === 'lead' || currentUser?.role === 'admin';
  }, [currentUser]);

  const canManageProjects = useCallback(() => {
    return currentUser?.role === 'lead' || currentUser?.role === 'admin';
  }, [currentUser]);

  const canManageMembers = useCallback(() => {
    return currentUser?.role === 'admin';
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      login,
      logout,
      users,
      addUser,
      updateUser,
      deleteUser,
      getUserById,
      projects,
      addProject,
      updateProject,
      deleteProject,
      archiveProject,
      getProjectById,
      getUserProjects,
      reports,
      addReport,
      updateReport,
      deleteReport,
      getReportById,
      getUserReports,
      getProjectReports,
      getTodayReport,
      getFilteredReports,
      getStats,
      getLast7DaysStats,
      canViewAllReports,
      canManageProjects,
      canManageMembers,
    }),
    [
      currentUser,
      login,
      logout,
      users,
      addUser,
      updateUser,
      deleteUser,
      getUserById,
      projects,
      addProject,
      updateProject,
      deleteProject,
      archiveProject,
      getProjectById,
      getUserProjects,
      reports,
      addReport,
      updateReport,
      deleteReport,
      getReportById,
      getUserReports,
      getProjectReports,
      getTodayReport,
      getFilteredReports,
      getStats,
      getLast7DaysStats,
      canViewAllReports,
      canManageProjects,
      canManageMembers,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
