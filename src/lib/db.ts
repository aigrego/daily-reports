import { prisma } from './prisma';
import { encryptPassword, verifyPassword, generateSalt, reencryptPassword } from './crypto';

// Re-export types
export type UserRole = 'member' | 'lead' | 'admin';
export type ProjectStatus = 'active' | 'archived';
export { encryptPassword, verifyPassword, generateSalt, reencryptPassword };

// User operations
export async function getUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return users;
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });
  return user;
}

export async function getUserWithPassword(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  return user;
}

export async function createUser(data: {
  name: string;
  displayName?: string;
  department: string;
  role: UserRole;
  password: string;
}) {
  // 生成独立盐值并加密密码
  const salt = generateSalt();
  const encryptedPassword = encryptPassword(data.password, salt);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: encryptedPassword,
      passwordSalt: salt,
    },
    select: {
      id: true,
      name: true,
      displayName: true,
      department: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });
  return user;
}

export async function updateUser(
  id: string,
  updates: Partial<{
    name: string;
    displayName: string;
    department: string;
    role: UserRole;
    password: string;
  }>
) {
  const updateData: any = { ...updates };

  // 如果更新密码，需要重新生成盐值并加密
  if (updates.password) {
    const { encryptedPassword, salt } = reencryptPassword(updates.password);
    updateData.password = encryptedPassword;
    updateData.passwordSalt = salt;
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      displayName: true,
      department: true,
      role: true,
      avatar: true,
      createdAt: true,
    },
  });
  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });
}

// Project operations
export async function getProjects() {
  const projects = await prisma.project.findMany({
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects.map((p) => ({
    ...p,
    members: p.members.map((m) => m.userId),
  }));
}

export async function getProjectById(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  if (!project) return null;

  return {
    ...project,
    members: project.members.map((m) => m.userId),
  };
}

export async function createProject(data: {
  name: string;
  description: string;
  color: string;
  members: string[];
}) {
  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      color: data.color,
      status: 'active',
      members: {
        create: data.members.map((userId) => ({
          userId,
        })),
      },
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  return {
    ...project,
    members: project.members.map((m) => m.userId),
  };
}

export async function updateProject(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    color: string;
    members: string[];
    status: ProjectStatus;
  }>
) {
  const { members, ...projectData } = updates;

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...projectData,
      ...(members && {
        members: {
          deleteMany: {},
          create: members.map((userId) => ({
            userId,
          })),
        },
      }),
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  return {
    ...project,
    members: project.members.map((m) => m.userId),
  };
}

export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  });
}

// Report operations
export async function getReports(filters?: {
  userId?: string;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}) {
  const where: any = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.projectId) {
    where.projects = {
      some: {
        projectId: filters.projectId,
      },
    };
  }

  if (filters?.startDate || filters?.endDate) {
    where.date = {};
    if (filters.startDate) where.date.gte = filters.startDate;
    if (filters.endDate) where.date.lte = filters.endDate;
  }

  if (filters?.keyword) {
    where.OR = [
      { completed: { contains: filters.keyword } },
      { inProgress: { contains: filters.keyword } },
      { problems: { contains: filters.keyword } },
      { tomorrowPlan: { contains: filters.keyword } },
    ];
  }

  const reports = await prisma.report.findMany({
    where,
    include: {
      projects: {
        select: {
          projectId: true,
        },
      },
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  return reports.map((r) => ({
    ...r,
    projectIds: r.projects.map((p) => p.projectId),
  }));
}

export async function getReportById(id: string) {
  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      projects: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!report) return null;

  return {
    ...report,
    projectIds: report.projects.map((p) => p.projectId),
  };
}

export async function getTodayReport(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const report = await prisma.report.findFirst({
    where: {
      userId,
      date: today,
    },
    include: {
      projects: {
        select: {
          projectId: true,
        },
      },
    },
  });

  if (!report) return null;

  return {
    ...report,
    projectIds: report.projects.map((p) => p.projectId),
  };
}

export async function createReport(data: {
  userId: string;
  date: string;
  projectIds: string[];
  completed: string;
  inProgress: string;
  problems: string;
  tomorrowPlan: string;
}) {
  const { projectIds, ...reportData } = data;

  const report = await prisma.report.create({
    data: {
      ...reportData,
      projects: {
        create: projectIds.map((projectId) => ({
          projectId,
        })),
      },
    },
    include: {
      projects: {
        select: {
          projectId: true,
        },
      },
    },
  });

  return {
    ...report,
    projectIds: report.projects.map((p) => p.projectId),
  };
}

export async function updateReport(
  id: string,
  updates: Partial<{
    projectIds: string[];
    completed: string;
    inProgress: string;
    problems: string;
    tomorrowPlan: string;
  }>
) {
  const { projectIds, ...reportData } = updates;

  const report = await prisma.report.update({
    where: { id },
    data: {
      ...reportData,
      ...(projectIds && {
        projects: {
          deleteMany: {},
          create: projectIds.map((projectId) => ({
            projectId,
          })),
        },
      }),
    },
    include: {
      projects: {
        select: {
          projectId: true,
        },
      },
    },
  });

  return {
    ...report,
    projectIds: report.projects.map((p) => p.projectId),
  };
}

export async function deleteReport(id: string) {
  await prisma.report.delete({
    where: { id },
  });
}

// User projects
export async function getUserProjects(userId: string) {
  const projects = await prisma.project.findMany({
    where: {
      status: 'active',
      members: {
        some: {
          userId,
        },
      },
    },
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  });

  return projects.map((p) => ({
    ...p,
    members: p.members.map((m) => m.userId),
  }));
}

// Stats operations
export async function getStats() {
  const today = new Date().toISOString().split('T')[0];

  const [totalReports, activeProjects, totalMembers, todayReports] = await Promise.all([
    prisma.report.count(),
    prisma.project.count({ where: { status: 'active' } }),
    prisma.user.count(),
    prisma.report.count({ where: { date: today } }),
  ]);

  return {
    totalReports,
    activeProjects,
    totalMembers,
    todayReports,
  };
}

export async function getLast7DaysStats() {
  const stats = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const count = await prisma.report.count({
      where: { date: dateStr },
    });

    stats.push({
      date: dateStr.slice(5),
      count,
    });
  }

  return stats;
}

export async function getUserStats(userId: string) {
  const [userReports, userProjects] = await Promise.all([
    prisma.report.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    }),
    prisma.projectMember.count({
      where: {
        userId,
        project: {
          status: 'active',
        },
      },
    }),
  ]);

  return {
    reportCount: userReports.length,
    projectCount: userProjects,
    lastReport: userReports[0]?.date || null,
  };
}

export async function getProjectStats(projectId: string) {
  const [reportCount, memberCount] = await Promise.all([
    prisma.reportProject.count({
      where: { projectId },
    }),
    prisma.report.groupBy({
      by: ['userId'],
      where: {
        projects: {
          some: {
            projectId,
          },
        },
      },
    }).then((groups) => groups.length),
  ]);

  return {
    reportCount,
    memberCount,
  };
}

// Seed data
export async function seedDatabase() {
  const userCount = await prisma.user.count();
  if (userCount > 0) return;

  // Create users with encrypted passwords
  const users = await Promise.all([
    createUser({
      name: '张三',
      department: '开发组',
      role: 'lead',
      password: 'Dev123!',
    }),
    createUser({
      name: '李四',
      department: '开发组',
      role: 'member',
      password: 'Dev123!',
    }),
    createUser({
      name: '王五',
      department: '测试组',
      role: 'member',
      password: 'Dev123!',
    }),
    createUser({
      name: '赵六',
      department: '设计组',
      role: 'member',
      password: 'Dev123!',
    }),
    createUser({
      name: '孙七',
      department: '管理层',
      role: 'admin',
      password: 'Dev123!',
    }),
  ]);

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        name: '官网重构',
        description: '公司官网前端重构项目',
        color: '#0a0a0a',
        status: 'active',
        members: {
          create: [
            { userId: users[0].id },
            { userId: users[1].id },
            { userId: users[3].id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        name: 'APP 2.0',
        description: '移动端APP新版本开发',
        color: '#525252',
        status: 'active',
        members: {
          create: [
            { userId: users[0].id },
            { userId: users[1].id },
            { userId: users[2].id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        name: '数据分析平台',
        description: '内部数据分析系统',
        color: '#737373',
        status: 'active',
        members: {
          create: [
            { userId: users[0].id },
            { userId: users[2].id },
          ],
        },
      },
    }),
    prisma.project.create({
      data: {
        name: '旧系统维护',
        description: '历史系统维护与bug修复',
        color: '#a3a3a3',
        status: 'archived',
        members: {
          create: [{ userId: users[1].id }],
        },
      },
    }),
  ]);

  // Create sample reports
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  await Promise.all([
    prisma.report.create({
      data: {
        userId: users[0].id,
        date: today,
        completed: '1. 完成首页响应式布局\n2. 修复导航栏bug\n3. 优化页面加载速度',
        inProgress: '1. 用户中心页面开发\n2. API接口对接',
        problems: '第三方登录接口文档不完整，需要和产品确认',
        tomorrowPlan: '1. 继续用户中心开发\n2. 完成登录功能\n3. 代码评审',
        projects: {
          create: [
            { projectId: projects[0].id },
            { projectId: projects[1].id },
          ],
        },
      },
    }),
    prisma.report.create({
      data: {
        userId: users[1].id,
        date: today,
        completed: '1. 完成商品列表页面\n2. 实现搜索功能',
        inProgress: '1. 购物车功能开发',
        problems: '',
        tomorrowPlan: '1. 完成购物车功能\n2. 联调测试',
        projects: {
          create: [{ projectId: projects[0].id }],
        },
      },
    }),
    prisma.report.create({
      data: {
        userId: users[0].id,
        date: yesterday,
        completed: '1. 搭建项目框架\n2. 配置路由和状态管理\n3. 完成登录页面',
        inProgress: '1. 首页开发',
        problems: '',
        tomorrowPlan: '1. 继续首页开发\n2. 组件库选型',
        projects: {
          create: [{ projectId: projects[1].id }],
        },
      },
    }),
  ]);
}
