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

// 2026-02-10 日报数据
const reportData = {
  date: '2026-02-10',
  reports: [
    {
      name: 'JSY',
      department: '开发组-客户端',
      projects: ['Remittance One'],
      completed: '1. 制定每日开发计划\n2. request change kyc全流程开发完成\n3. risk相关功能开发',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LC',
      department: '开发组-客户端',
      projects: ['Remittance One'],
      completed: '1. 完善官网项目文件结构与工程化配置\n2. 完善官网项目组件结构与必要组件\n3. 完成官网solution页面\n4. 完成官网about-us页面\n5. 基本完成官网contact-us页面\n6. 修复core function页面bug，完善视觉效果',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'XHC',
      department: '开发组-服务端',
      projects: ['Remittance One'],
      completed: '1. 完成User Risk Limit申请信息展示界面，支持查看申请详情\n2. 完成用户申请历史抽屉组件，实现历史申请记录的快速查看\n3. 完成当前申请同意/拒绝操作组件，支持审批流程在前端闭环\n4. 完成Client Risk Limit申请及申请记录相关接口开发\n5. 完成Risk Limit审批记录、同意、拒绝及当前用户申请记录接口，实现完整审批链路支持',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'XAY',
      department: '测试组',
      projects: ['Remittance One', 'FOX'],
      completed: '1. 对Remittance One App的Send、Market orders、Rate alert最新修改进行测试\n2. 对Fox admin活动模块进行测试\n3. 对之前沟通的相关细节部分进行测试验证\n4. 在在线文档中记录相关BUG说明\n5. 对之前存在的BUG进行回归测试',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LXY',
      department: '开发组',
      projects: ['Asahi', 'RZ'],
      completed: '1. 开发Withdrawal UI流程，增加passkey验证，限制非FX账户创建\n2. ATM deposit流程分析和开发设计\n3. RZ prod问题处理，email因为客户无法登陆展示切换为原本的\n4. Nicasia问题追踪处理',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'ZSB',
      department: '开发组',
      projects: ['Asahi'],
      completed: '1. 完成asahi Withdrawal account创建功能：包括界面展示，数据回填，创建，修改和重新提交\n2. 提交时添加了passKey的验证',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LZ',
      department: '开发组',
      projects: ['Asahi'],
      completed: '1. 调整CSVExportService实例化数据库只实例化asahiCrm库，有mtDB的read权限\n2. 修改数据库实例化的实现逻辑\n3. 将COB的CSV文件导出后端API部署到PROD环境进行测试\n4. 开始对相关的用户操作做IP记录到UserInteraction的功能',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'ZAQ',
      department: '开发组',
      projects: ['Payment Gateway'],
      completed: '1. Payment Gateway添加页面及图表接口联调(目前所有接口都已联调完成)\n2. UI Components页面添加（目前添加的不对，这个需要再调整）',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'KD',
      department: '开发组',
      projects: ['Payment Gateway', 'RZ', 'Remittance One', 'Orbis'],
      completed: '1. Gateway的网关chart需求联调和修改（剩余部分数据处理不影响使用）\n2. 处理RZ support客户邮件和其他反馈问题处理（邮件已发）\n3. Remittance one反馈的需求使用本地BSB和反馈的问题处理\n4. orbis客户反馈的问题处理',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LK',
      department: '开发组',
      projects: ['FOX'],
      completed: '1. 和海波测试活动功能在fox上\n2. 发现几个问题已修改\n3. fox碰到不能发送邮件、不能上传文件、mt服务器不能访问等问题',
      inProgress: '继续进行中的任务',
      problems: 'fox不能发送邮件、不能上传文件、mt服务器不能访问',
      tomorrowPlan: '建立mock的mt服务器，lc看一下邮件和文件上传的问题',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-10 日报数据...\n');

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
