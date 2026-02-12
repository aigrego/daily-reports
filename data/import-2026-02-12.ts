import { prisma } from '../src/lib/prisma';

// 名字映射表（缩写 -> 中文名）
const nameMapping: Record<string, string> = {
  'CY': '成煜',
  'YLC': '杨磊成',
  'LZ': '李振',
  'LK': '刘珂',
  'XAY': '许奥运',
  'LC': '李陈',
  'LXY': '李星宇',
  'ZAQ': '张阿强',
  'XHC': '徐华臣',
  'KD': '康达',
  'JSY': '蒋松阳',
  'ZSB': '赵世彪',
  'SJZ': '孙俊召',
};

// 2026-02-12 日报数据
const reportData = {
  date: '2026-02-12',
  reports: [
    {
      name: 'CY',
      department: '开发组',
      projects: ['Orbis', 'OX'],
      completed: '1. 排查并修复orbis 测试中提出的问题(现在服务端剩下的基本都是报表数据不一致的问题)\n2. 定位elliptic相关接口调用失败的问题',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'YLC',
      department: '开发组',
      projects: ['Orbis', 'OX', 'OTSO'],
      completed: '1. 修改了一下Orbis新提出来的前端问题\n2. 部署 OX AML 部分\n3. 处理了一下otso昨天Kerr提出来的组修改的问题\n4. 处理他们早上提出来的时间选择问题',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'SJZ',
      department: '开发组',
      projects: ['FOX'],
      completed: '1. 优化 @gx/* 框架，增加PRD文档，增加单元测试。使用pnpm workspaces 和 submodules 管理多个模块\n2. 检索MT5 API文档，查看OTP的配置',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-12 日报数据...\n');

    const { date, reports } = reportData;
    let reportCount = 0;
    let skipCount = 0;

    for (const report of reports) {
      // 查找用户（使用名字映射）
      const chineseName = nameMapping[report.name] || report.name;
      const user = await prisma.user.findFirst({
        where: { name: chineseName },
      });

      if (!user) {
        console.log(`  ⚠️ 跳过: 用户 "${report.name}" (${chineseName}) 不存在`);
        skipCount++;
        continue;
      }

      // 检查是否已有当天的日报
      const existingReport = await prisma.report.findFirst({
        where: {
          userId: user.id,
          date: date,
        },
      });

      if (existingReport) {
        console.log(`  ⚠️ 跳过: ${report.name} 在 ${date} 已有日报`);
        skipCount++;
        continue;
      }

      // 查找用户参与的项目
      const userProjects = await prisma.project.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      });

      // 匹配日报中提到的项目
      const projectIds = userProjects
        .filter(p => report.projects.some(rp => p.name.toLowerCase().includes(rp.toLowerCase()) || rp.toLowerCase().includes(p.name.toLowerCase())))
        .map(p => p.id);

      // 创建日报
      await prisma.report.create({
        data: {
          userId: user.id,
          date: date,
          completed: report.completed,
          inProgress: report.inProgress,
          problems: report.problems,
          tomorrowPlan: report.tomorrowPlan,
          projects: {
            create: projectIds.map(pid => ({ project: { connect: { id: pid } } })),
          },
        },
      });

      reportCount++;
      console.log(`  ✓ ${report.name} - ${report.projects.join(', ')}`);
    }

    console.log('\n✅ 导入完成！');
    console.log(`  成功导入: ${reportCount} 条日报`);
    console.log(`  跳过: ${skipCount} 条`);

  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importReports();
