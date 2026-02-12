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

// 2026-02-09 日报数据
const reportData = {
  date: '2026-02-09',
  reports: [
    {
      name: 'YLC',
      department: '开发组',
      projects: ['OTSO', 'Orbis'],
      completed: '1. Sale reports这里加三个Tab页面联调并部署\n2. 修复测试提出的页面细节修改',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'CY',
      department: '开发组',
      projects: ['OTSO', 'Orbis', 'Asahi'],
      completed: '1. OTSO新增sale佣金月度数据以及明细列表接\n2. 排查并修复orbis测试中提出的问题\n3. 协助排查asahi mt5连接失败的问题',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'SJZ',
      department: '开发组',
      projects: ['FOX', 'Asahi'],
      completed: '1. 优化@gx/crypto模块\n2. 用C++重写C#的账号加解密模块\n3. 支持mac arm64, mac x86 64, linux arm64, linux x86 64\n4. 配置docker实现多平台编译 - 目前还有点问题，在多个平台手动编译后更新到npm\n5. 调试Asahi的MT5问题 - MT5不能配置Login范围，6x开头的login应该是在MT服务器配置好的',
      inProgress: '继续进行中的任务',
      problems: 'MT5的API文档中有Login范围参数，但是实际上不支持会报错',
      tomorrowPlan: '明天继续完成剩余工作',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-09 日报数据...\n');

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
        .filter(p => report.projects.some(rp => 
          p.name.toLowerCase().includes(rp.toLowerCase()) || 
          rp.toLowerCase().includes(p.name.toLowerCase())
        ))
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
