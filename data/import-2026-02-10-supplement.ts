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

// 2026-02-10 补充日报数据
const reportData = {
  date: '2026-02-10',
  reports: [
    {
      name: 'SJZ',
      department: '开发组',
      projects: ['OTSO', 'OX', 'FOX'],
      completed: '1. 修复"清理超期入金请求"订单定时任务 - 之前启动了debug模式\n2. 修复CRM-647, Local bank transfer currency\n3. 调试@gx/crypto - 跨平台编译还有点问题\n4. 调试@gx/metaquotes - MT4 mock服务，DevOps把MT4 Demo外网IP禁用了，刘珂做了Mock服务，调试好明天给他们用',
      inProgress: '继续进行中的任务',
      problems: '@gx/crypto跨平台编译有点问题',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'CY',
      department: '开发组',
      projects: ['OTSO', 'OX'],
      completed: '1. OTSO排查并修复群里提到的问题\n2. 修复OTSO sale adjustment功能\n3. 处理OX notion-645(明天上午和磊成进行联调)',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天上午和磊成进行联调',
    },
    {
      name: 'YLC',
      department: '开发组',
      projects: ['OX', 'FOX'],
      completed: '1. CRM-646，(P2) Ox SVG - US signing up with no IB - 已完成\n2. 修复邮件和上传的配置 - 方便刘珂和海波测试',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: 'CRM-645明天还需再调试下',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-10 补充日报数据...\n');

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
