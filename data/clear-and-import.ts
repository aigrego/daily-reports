import { prisma } from '../src/lib/prisma';
import { generateSalt, encryptPassword } from '../src/lib/crypto';

// 日报数据
const reportData = {
  projects: [
    {
      name: 'Remittance One',
      description: '汇款服务平台 - 客户端和服务端开发',
      members: ['KD', '蒋松阳', '李陈', '徐华臣', '许奥运'],
    },
    {
      name: 'Asahi',
      description: '金融交易平台 - Leverage设置、Crypto/Commodity功能',
      members: ['LXY', 'ZSB', 'LZ'],
    },
    {
      name: 'Payment Gateway',
      description: '支付网关系统 - UI组件和模板开发',
      members: ['ZAQ', 'KD', 'ZSB'],
    },
    {
      name: 'FOX',
      description: 'MT4/MT5相关服务和活动系统',
      members: ['LK', 'SJZ'],
    },
    {
      name: 'RZ',
      description: '金融服务平台 - AUD支付和账户管理',
      members: ['KD', 'ZAQ'],
    },
    {
      name: 'OTSO',
      description: 'CRM系统维护',
      members: ['YLC'],
    },
    {
      name: 'Orbis',
      description: '测试问题修复',
      members: ['CY'],
    },
    {
      name: 'OX',
      description: 'AML反洗钱系统开发',
      members: ['YLC', 'CY'],
    },
  ],
  members: [
    { name: 'KD', department: '开发组', tasks: ['处理Remittance One 反馈退款相关的问题', '处理Orbis Apikey 反馈的接口相关问题', 'Gateway的 网关chart 需求联调和修改', 'RZ 客户提出的支持BC 支付AUD BSB 相关处理', 'RZ account Statement 如果改月没有交易补充account statement 信息记录'] },
    { name: '蒋松阳', department: '开发组-客户端', tasks: ['制定每日开发计划', '排查并解决 webhook 日志记录失效问题', '实现 refund 创建受益人逻辑', '实现 refund 提交逻辑', '修改 transactions info 根据交易类型显示不同字段', '修复 kyc 状态显示异常 bug'] },
    { name: '李陈', department: '开发组-客户端', tasks: ['修复 core function 页面响应式布局异常的bug', '修复 页面内容与路由实际意义不匹配的bug', '重新添加 contact us 页面', '重新添加 help center 页面', '添加 characteristic 页面', '添加 motion 以增强视觉效果'] },
    { name: '徐华臣', department: '开发组-服务端', tasks: ['添加 client 信息界面主动调整 daily limit 的相关组件', 'risk setting 补充平台默认限额，最大限额相关组件', '测试 client limit request 历史记录接口', '补充测试 admin 端 risk setting 相关限额信息的接口', '2fa 报错信息前端无法正常抛出信息的问题彻底的解决', '联调测试admin 端所有关于 risk daily limit 接口'] },
    { name: '许奥运', department: '测试组', tasks: ['对Remittance One App的新增功能进行验证', '对Top-up、send进行测试', '在线文档中记录相关BUG说明', '对之前存在的BUG进行回归测试'] },
    { name: 'LXY', department: '开发组', tasks: ['添加数据库控制的leverage设置', '添加数据库控制的Crypto，Commodity开关', '调整后端，增加Crypto，Commodity的type', '调整前后端api，调整账户显示问题', '测试与开发账户创建，Withdrawal流程'] },
    { name: 'ZSB', department: '开发组', tasks: ['修改asahi Withdrawal jp 银行查询报错的bug', '优化WithdrawalAccount界面操作流程', '测试验证WithdrawalAccount创建功能', '为gateway添加template：将已有的template整理为静态html'] },
    { name: 'LZ', department: '开发组', tasks: ['为相关的用户操作添加user interaction ip记录', 'Add ip for on login/withdrawal order with MT5', 'get the MT5 Mobile app login IP from MT5 server'] },
    { name: 'ZAQ', department: '开发组', tasks: ['Payment Gateway UI Components 添加（已完成）', 'RZ AUD Swfit出金修改及测试（已部署prod）'] },
    { name: 'LK', department: '开发组', tasks: ['解决 mt4 mock 服务器连不上的问题', '在 ox dev 配置 mock 服务器', '修改fox 的 dev 环境连接', '修复注册类型的活动bug', '部署到 dev 环境'] },
    { name: 'YLC', department: '开发组', tasks: ['修复OTSO CMR群里的两个BUG问题', 'OX AML页面部分跟API联调'] },
    { name: 'CY', department: '开发组', tasks: ['排查并修复orbis 测试中提出的问题', 'OX AML新增验证失败的workflow审批功能'] },
    { name: 'SJZ', department: '开发组', tasks: ['验证 Mock MT4 Service', '优化 @gx/crypto', '更新 @gx/gen 和 @gx/micro', '从昨天的日报中分析出项目、人员和日报条目，录入到数据库'] },
  ],
};

async function clearAndImport() {
  console.log('🧹 清空旧数据并重新导入...\n');

  try {
    // 1. 清空数据（按依赖顺序）
    console.log('🗑️  清空旧数据...');
    await prisma.reportProject.deleteMany();
    await prisma.report.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('✅ 旧数据已清空\n');

    const { projects, members } = reportData;

    // 2. 创建用户（使用独立盐值加密）
    console.log('👤 创建用户...');
    const createdUsers: Record<string, any> = {};
    
    for (const member of members) {
      const salt = generateSalt();
      const encryptedPassword = encryptPassword('Dev123!', salt);

      const user = await prisma.user.create({
        data: {
          name: member.name,
          displayName: member.name,
          department: member.department,
          role: 'member',
          password: encryptedPassword,
          passwordSalt: salt,
        },
      });
      createdUsers[member.name] = user;
      console.log(`  ✓ ${user.name} (${user.department}) - 盐值: ${salt.slice(0, 16)}...`);
    }
    console.log('');

    // 3. 创建项目
    console.log('📁 创建项目...');
    const createdProjects: Record<string, any> = {};
    const projectColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      const memberIds = proj.members
        .map(name => createdUsers[name]?.id)
        .filter(Boolean);

      const project = await prisma.project.create({
        data: {
          name: proj.name,
          description: proj.description,
          color: projectColors[i % projectColors.length],
          status: 'active',
          members: {
            create: memberIds.map(userId => ({ userId })),
          },
        },
      });
      createdProjects[proj.name] = project;
      console.log(`  ✓ ${project.name} (${memberIds.length} 成员)`);
    }
    console.log('');

    // 4. 创建日报
    console.log('📝 创建日报...');
    const date = '2026-02-11';
    let reportCount = 0;

    for (const member of members) {
      const user = createdUsers[member.name];
      if (!user) continue;

      const userProjects = projects
        .filter(p => p.members.includes(member.name))
        .map(p => createdProjects[p.name]?.id)
        .filter(Boolean);

      if (userProjects.length === 0) continue;

      const completed = member.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');

      await prisma.report.create({
        data: {
          userId: user.id,
          date: date,
          completed: completed,
          inProgress: '继续进行中的任务',
          problems: '',
          tomorrowPlan: '明天继续完成剩余工作',
          projects: {
            create: userProjects.map(pid => ({ project: { connect: { id: pid } } })),
          },
        },
      });
      reportCount++;
      console.log(`  ✓ ${user.name} - ${member.tasks.length} 项任务`);
    }

    console.log('\n✅ 导入完成！');
    console.log(`  创建用户: ${Object.keys(createdUsers).length}`);
    console.log(`  创建项目: ${Object.keys(createdProjects).length}`);
    console.log(`  创建日报: ${reportCount}`);
    console.log('\n🔐 所有密码已使用独立盐值加密');
    console.log('   默认密码: Dev123!');

  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAndImport();
