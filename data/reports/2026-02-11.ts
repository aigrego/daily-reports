import { prisma } from '../../src/lib/prisma';
import { generateSalt, encryptPassword } from '../../src/lib/crypto';

interface ParsedProject {
  name: string;
  description: string;
  members: string[];
}

interface ParsedMember {
  name: string;
  department: string;
  tasks: string[];
}

interface ParsedReport {
  memberName: string;
  projectName: string;
  date: string;
  tasks: string[];
}

const reportText = `
11/2/2026:
FND:

Remitance One:
KD:
处理Remittance One 反馈退款相关的问题;处理Orbis Apikey 反馈的接口相关问题处理;

客户端
蒋松阳 tail
制定每日开发计划
排查并解决 webhook 日志记录失效问题
实现 refund 创建受益人逻辑
实现 refund 提交 逻辑
修改 transactions info 根据交易类型显示不同 字段
修复 kyc 状态显示 异常 bug

李陈 Charles
修复 core function 页面响应式布局异常的bug
修复 页面内容与路由实际意义不匹配的bug
重新添加 contact us 页面
重新添加 help center 页面
添加 characteristic 页面
添加 motion 以增强视觉效果

服务端
徐华臣
admin 
添加 client 信息界面主动调整 daily limit 的相关组件
risk setting 补充平台默认限额，最大限额相关组件

Server
测试 client limit request 历史记录，在规定范围内主动调整自己的每日限额，相关接口
补充测试 admin 端 risk setting 相关限额信息的接口
2fa 报错信息前端无法正常抛出信息的问题彻底的解决
联调测试admin 端所有关于 risk daily limit 接口

许奥运
对Remittance One App的 新增功能进行验证，对Top-up、send进行测试，同时在在线文档中记录相关BUG说明，对之前存在的BUG进行回归测试。

Asahi:
LXY:
1.先加数据库控制的leverage设置。
2.添加数据库控制的Crypto，Commodity开关
3.调整后端，增加Crypto，Commodity的type，调整前后端api，调整账户显示问题。
4.测试与开发账户创建，Withdrawal流程。

ZSB:
修改asahi Withdrawal jp 银行查询报错的bug。优化WithdrawalAccount界面操作流程。测试验证WithdrawalAccount创建功能。

LZ:
为相关的用户操作添加user interaction ip记录
Add ip for on login/withdrawal order with MT5, Also need to get the MT5 Mobile app login IP from MT5 server (and add ip into into client interactions, including CRM login, mobile login, deposit, withdrwal, add withdrawal account, transfer funds, etc)

Payment Gateway:
ZAQ:
1.Payment Gateway UI Components 添加（已完成）

KD:
1.Gateway的 网关chart 需求联调和修改（剩余部分数据处理 不影响使用）；

ZSB:
为gateway添加template：将已有的template整理为静态html，调整优化html里面的内容，通过iframe嵌入页面。

FOX:
LK:
今天早上先解决了昨天 mt4 mock 服务器连不上的问题，是因为 fox 的配置问题，经过一系列的查询和看 mfc 的代码，确定了最新的格式并连上。然后下午先在 ox dev 配置好了 mock 服务器，然后修改fox 的 dev 环境连接成功。然后开始和测试测活动。但是之前因为一直没有触发所以在注册类型的活动有个bug，已经修复成功并且部署到了 dev 环境。明天就是更多测试。

RZ:
KD：
1.RZ 客户提出的支持BC 支付AUD BSB 相关处理;AUD 支持金额1以下支付（目前都已在prod 部署和测试)和其他反馈的账户其他问题处理；
2.RZ account Statement 如果改月没有交易补充account statement 信息记录（目前接口已写,待测试和prod 执行）;

ZAQ:
1.RZ AUD Swfit出金修改及测试 （已部署prod）

11/2/2026:
OTSO：
YLC：修复OTSO CMR群里的两个BUG问题 - 已经修复更新

Orbis:
CY: 排查并修复orbis 测试中提出的问题

OX:
YLC: OX AML页面部分跟API联调 - 已经完成，明早更新
CY: OX AML新增验证失败的workflow审批功能(和磊成以及联调通过并验证，明天部署prod)

FOX：
SJZ:
验证 Mock MT4 Service
优化 @gx/crypto
更新 @gx/gen 和 @gx/micro (使用 @gx/crypto 替换 C# 生成项目许可文件) - 明天在验证下就可以发布了
从昨天的日报中分析出项目、人员和日报条目，录入到数据库
`;

async function parseAndImportReport() {
  console.log('📊 开始解析日报...\n');

  // 提取项目
  const projects: ParsedProject[] = [
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
  ];

  // 提取成员信息
  const members: ParsedMember[] = [
    {
      name: 'KD',
      department: '技术部',
      tasks: [
        '处理Remittance One 反馈退款相关的问题',
        '处理Orbis Apikey 反馈的接口相关问题',
        'Gateway的 网关chart 需求联调和修改',
        'RZ 客户提出的支持BC 支付AUD BSB 相关处理',
        'RZ account Statement 如果改月没有交易补充account statement 信息记录',
      ],
    },
    {
      name: '蒋松阳',
      department: '技术部-客户端',
      tasks: [
        '制定每日开发计划',
        '排查并解决 webhook 日志记录失效问题',
        '实现 refund 创建受益人逻辑',
        '实现 refund 提交逻辑',
        '修改 transactions info 根据交易类型显示不同字段',
        '修复 kyc 状态显示异常 bug',
      ],
    },
    {
      name: '李陈',
      department: '技术部-客户端',
      tasks: [
        '修复 core function 页面响应式布局异常的bug',
        '修复 页面内容与路由实际意义不匹配的bug',
        '重新添加 contact us 页面',
        '重新添加 help center 页面',
        '添加 characteristic 页面',
        '添加 motion 以增强视觉效果',
      ],
    },
    {
      name: '徐华臣',
      department: '技术部-服务端',
      tasks: [
        '添加 client 信息界面主动调整 daily limit 的相关组件',
        'risk setting 补充平台默认限额，最大限额相关组件',
        '测试 client limit request 历史记录接口',
        '补充测试 admin 端 risk setting 相关限额信息的接口',
        '2fa 报错信息前端无法正常抛出信息的问题彻底的解决',
        '联调测试admin 端所有关于 risk daily limit 接口',
      ],
    },
    {
      name: '许奥运',
      department: '测试部',
      tasks: [
        '对Remittance One App的新增功能进行验证',
        '对Top-up、send进行测试',
        '在线文档中记录相关BUG说明',
        '对之前存在的BUG进行回归测试',
      ],
    },
    {
      name: 'LXY',
      department: '技术部',
      tasks: [
        '添加数据库控制的leverage设置',
        '添加数据库控制的Crypto，Commodity开关',
        '调整后端，增加Crypto，Commodity的type',
        '调整前后端api，调整账户显示问题',
        '测试与开发账户创建，Withdrawal流程',
      ],
    },
    {
      name: 'ZSB',
      department: '技术部',
      tasks: [
        '修改asahi Withdrawal jp 银行查询报错的bug',
        '优化WithdrawalAccount界面操作流程',
        '测试验证WithdrawalAccount创建功能',
        '为gateway添加template：将已有的template整理为静态html',
      ],
    },
    {
      name: 'LZ',
      department: '技术部',
      tasks: [
        '为相关的用户操作添加user interaction ip记录',
        'Add ip for on login/withdrawal order with MT5',
        'get the MT5 Mobile app login IP from MT5 server',
      ],
    },
    {
      name: 'ZAQ',
      department: '技术部',
      tasks: [
        'Payment Gateway UI Components 添加（已完成）',
        'RZ AUD Swfit出金修改及测试（已部署prod）',
      ],
    },
    {
      name: 'LK',
      department: '技术部',
      tasks: [
        '解决 mt4 mock 服务器连不上的问题',
        '在 ox dev 配置 mock 服务器',
        '修改fox 的 dev 环境连接',
        '修复注册类型的活动bug',
        '部署到 dev 环境',
      ],
    },
    {
      name: 'YLC',
      department: '技术部',
      tasks: [
        '修复OTSO CMR群里的两个BUG问题',
        'OX AML页面部分跟API联调',
      ],
    },
    {
      name: 'CY',
      department: '技术部',
      tasks: [
        '排查并修复orbis 测试中提出的问题',
        'OX AML新增验证失败的workflow审批功能',
      ],
    },
    {
      name: 'SJZ',
      department: '技术部',
      tasks: [
        '验证 Mock MT4 Service',
        '优化 @gx/crypto',
        '更新 @gx/gen 和 @gx/micro',
        '从昨天的日报中分析出项目、人员和日报条目，录入到数据库',
      ],
    },
  ];

  console.log('📋 解析结果：');
  console.log(`  项目数: ${projects.length}`);
  console.log(`  成员数: ${members.length}`);
  console.log('');

  // 显示项目列表
  console.log('📁 项目列表：');
  projects.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name}`);
    console.log(`     描述: ${p.description}`);
    console.log(`     成员: ${p.members.join(', ')}`);
  });
  console.log('');

  // 显示成员列表
  console.log('👥 成员列表：');
  members.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} (${m.department})`);
    console.log(`     任务数: ${m.tasks.length}`);
  });
  console.log('');

  // 开始导入到数据库
  console.log('💾 开始导入到数据库...\n');

  try {
    // 1. 创建用户
    console.log('👤 创建用户...');
    const createdUsers: Record<string, any> = {};
    
    for (const member of members) {
      // 生成独立盐值并加密密码
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
      console.log(`  ✓ ${user.name} (${user.department})`);
    }
    console.log('');

    // 2. 创建项目
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

    // 3. 创建日报
    console.log('📝 创建日报...');
    const date = '2026-02-11';
    let reportCount = 0;

    for (const member of members) {
      const user = createdUsers[member.name];
      if (!user) continue;

      // 找出该成员参与的项目
      const userProjects = projects
        .filter(p => p.members.includes(member.name))
        .map(p => createdProjects[p.name]?.id)
        .filter(Boolean);

      if (userProjects.length === 0) continue;

      // 格式化任务
      const completed = member.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n');

      const report = await prisma.report.create({
        data: {
          userId: user.id,
          date: date,
          completed: completed,
          inProgress: '继续进行中的任务',
          problems: '',
          tomorrowPlan: '明天继续完成剩余工作',
          projects: {
            create: userProjects.map(projectId => ({ projectId })),
          },
        },
      });
      reportCount++;
      console.log(`  ✓ ${user.name} - ${member.tasks.length} 项任务`);
    }

    console.log('');
    console.log('✅ 导入完成！');
    console.log(`  创建用户: ${Object.keys(createdUsers).length}`);
    console.log(`  创建项目: ${Object.keys(createdProjects).length}`);
    console.log(`  创建日报: ${reportCount}`);
    console.log('');
    console.log('🎉 所有数据已成功导入数据库！');
    
  } catch (error) {
    console.error('❌ 导入失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

parseAndImportReport();
