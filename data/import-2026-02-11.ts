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

// 2026-02-11 日报数据
const reportData = {
  date: '2026-02-11',
  reports: [
    {
      name: 'YLC',
      department: '开发组',
      projects: ['OTSO', 'OX'],
      completed: '1. 修复OTSO CMR群里的两个BUG问题 - 已经修复更新\n2. OX AML页面部分跟API联调 - 已经完成，明早更新',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'CY',
      department: '开发组',
      projects: ['Orbis', 'OX'],
      completed: '1. 排查并修复orbis 测试中提出的问题\n2. OX AML新增验证失败的workflow审批功能(和磊成以及联调通过并验证，明天部署prod)',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'SJZ',
      department: '开发组',
      projects: ['FOX'],
      completed: '1. 验证 Mock MT4 Service\n2. 优化 @gx/crypto\n3. 更新 @gx/gen 和 @gx/micro (使用 @gx/crypto 替换 C# 生成项目许可文件) - 明天在验证下就可以发布了',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-11 日报数据...\n');

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
