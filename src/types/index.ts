export type UserRole = 'member' | 'lead' | 'admin';

export interface User {
  id: string;
  name: string;
  department: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export type ProjectStatus = 'active' | 'archived';

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  members: string[];
  status: ProjectStatus;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  userId: string;
  projectIds: string[];
  date: string;
  completed: string;
  inProgress: string;
  problems: string;
  tomorrowPlan: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'project' | 'member' | 'date';

export interface FilterOptions {
  projectId?: string;
  memberId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export const PROJECT_COLORS = [
  '#0a0a0a',
  '#525252',
  '#737373',
  '#a3a3a3',
  '#d4d4d4',
  '#171717',
  '#262626',
  '#404040',
  '#737373',
  '#a3a3a3',
];

export const REPORT_TEMPLATES = {
  normal: {
    name: '常规工作日',
    completed: '1. \n2. \n3. ',
    inProgress: '1. \n2. ',
    problems: '',
    tomorrowPlan: '1. \n2. \n3. ',
  },
  busy: {
    name: '忙碌工作日',
    completed: '今日完成：\n\n1. \n2. \n3. \n4. \n5. ',
    inProgress: '进行中：\n\n1. ',
    problems: '',
    tomorrowPlan: '明日计划：\n\n1. \n2. ',
  },
  light: {
    name: '轻松工作日',
    completed: '今日工作：\n\n',
    inProgress: '',
    problems: '',
    tomorrowPlan: '明日安排：\n\n',
  },
};
