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

// 2026-02-11 完整日报数据
const reportData = {
  date: '2026-02-11',
  reports: [
    {
      name: 'KD',
      department: '开发组',
      projects: ['Remittance One', 'Orbis', 'Payment Gateway', 'RZ'],
      completed: '1. 处理Remittance One 反馈退款相关的问题\n2. 处理Orbis Apikey 反馈的接口相关问题\n3. Gateway的网关chart需求联调和修改（剩余部分数据处理不影响使用）\n4. RZ客户提出的支持BC支付AUD BSB相关处理；AUD支持金额1以下支付（目前都已在prod部署和测试)和其他反馈的账户其他问题处理\n5. RZ account Statement如果改月没有交易补充account statement信息记录（目前接口已写,待测试和prod执行）',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'JSY',
      department: '开发组-客户端',
      projects: ['Remittance One'],
      completed: '1. 制定每日开发计划\n2. 排查并解决webhook日志记录失效问题\n3. 实现refund创建受益人逻辑\n4. 实现refund提交逻辑\n5. 修改transactions info根据交易类型显示不同字段\n6. 修复kyc状态显示异常bug',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LC',
      department: '开发组-客户端',
      projects: ['Remittance One'],
      completed: '1. 修复core function页面响应式布局异常的bug\n2. 修复页面内容与路由实际意义不匹配的bug\n3. 重新添加contact us页面\n4. 重新添加help center页面\n5. 添加characteristic页面\n6. 添加motion以增强视觉效果',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'XHC',
      department: '开发组-服务端',
      projects: ['Remittance One'],
      completed: '1. admin添加client信息界面主动调整daily limit的相关组件\n2. risk setting补充平台默认限额，最大限额相关组件\n3. 测试client limit request历史记录，在规定范围内主动调整自己的每日限额，相关接口\n4. 补充测试admin端risk setting相关限额信息的接口\n5. 2fa报错信息前端无法正常抛出信息的问题彻底的解决\n6. 联调测试admin端所有关于risk daily limit接口',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'XAY',
      department: '测试组',
      projects: ['Remittance One'],
      completed: '1. 对Remittance One App的新增功能进行验证\n2. 对Top-up、send进行测试\n3. 在在线文档中记录相关BUG说明\n4. 对之前存在的BUG进行回归测试',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LXY',
      department: '开发组',
      projects: ['Asahi'],
      completed: '1. 先加数据库控制的leverage设置\n2. 添加数据库控制的Crypto，Commodity开关\n3. 调整后端，增加Crypto，Commodity的type，调整前后端api，调整账户显示问题\n4. 测试与开发账户创建，Withdrawal流程',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'ZSB',
      department: '开发组',
      projects: ['Asahi', 'Payment Gateway'],
      completed: '1. 修改asahi Withdrawal jp银行查询报错的bug\n2. 优化WithdrawalAccount界面操作流程\n3. 测试验证WithdrawalAccount创建功能\n4. 为gateway添加template：将已有的template整理为静态html，调整优化html里面的内容，通过iframe嵌入页面',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LZ',
      department: '开发组',
      projects: ['Asahi'],
      completed: '1. 为相关的用户操作添加user interaction ip记录\n2. Add ip for on login/withdrawal order with MT5\n3. 从MT5 server获取MT5 Mobile app login IP并添加到client interactions（包括CRM login, mobile login, deposit, withdrawal, add withdrawal account, transfer funds等）',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'ZAQ',
      department: '开发组',
      projects: ['Payment Gateway', 'RZ'],
      completed: '1. Payment Gateway UI Components添加（已完成）\n2. RZ AUD Swift出金修改及测试（已部署prod）',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LK',
      department: '开发组',
      projects: ['FOX'],
      completed: '1. 解决昨天mt4 mock服务器连不上的问题（fox配置问题）\n2. 在ox dev配置好mock服务器\n3. 修改fox的dev环境连接成功\n4. 和测试测活动\n5. 修复注册类型活动的bug并部署到dev环境',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-11 完整日报数据...\n');

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
