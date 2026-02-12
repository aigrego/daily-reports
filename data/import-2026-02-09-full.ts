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

// 2026-02-09 完整日报数据
const reportData = {
  date: '2026-02-09',
  reports: [
    {
      name: 'JSY',
      department: '开发组-客户端',
      projects: ['Remittance One'],
      completed: '1. 制定每日开发计划\n2. 与业务团队review app\n3. 开发客户端2FA多步验证逻辑\n4. 修复Bio ID开启状态失效bug\n5. 开发admin, app, request kyc api\n6. 开发图片预览组件',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LC',
      department: '开发组-客户端',
      projects: ['Remittance One'],
      completed: '1. App: 修复Two factor Auth页面图标可能无法显示的问题\n2. App: 修复部分页面拼写错误的问题\n3. Website: 搭建官网项目结构，添加tailwindcss和shadcn/ui\n4. Website: 完成基本布局与i18n切换\n5. Website: 完成首页',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'XHC',
      department: '开发组-服务端',
      projects: ['Remittance One'],
      completed: '1. 排查并修复TwoFA Email在关闭流程中未正确触发验证码发送的缺陷\n2. 对SMS验证码发送及校验流程进行完整验证\n3. 在Risk校验逻辑中新增单日累计交易金额达到3000的验证规则\n4. 分析MarkerOrder取消订单接口中TwoFA相关的错误返回结构问题',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'XAY',
      department: '测试组',
      projects: ['Remittance One'],
      completed: '1. 对Remittance One App的Check rate和交易详情最新修改进行测试\n2. 对之前沟通的相关细节部分进行测试验证\n3. 对OTST的活动模块新功能进行测试\n4. 在在线文档中记录相关BUG说明\n5. 对之前存在的BUG进行回归测试',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'LXY',
      department: '开发组',
      projects: ['Asahi', 'RZ'],
      completed: '1. 测试定位MT5账号创建失败的问题\n2. 开发Withdrawal流程，增加passkey验证，限制非FX账户创建\n3. 测试RZ新拿到的mail credentials, 目前已更新到prod',
      inProgress: '继续进行中的任务',
      problems: 'MT5账号创建失败问题到目前位置还没能创建',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'ZSB',
      department: '开发组',
      projects: ['Asahi'],
      completed: '1. asahi Withdrawal创建弹窗和展示界面\n2. 添加对应的api，联调api\n3. 配合处理MT5创建账号失败的问题\n4. 处理COB文件的Doc字段从KycIntegrationResult表解析json body获取证件类型值\n5. 根据TrustDoc文档的证件类型值做日文映射',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'ZAQ',
      department: '开发组',
      projects: ['Payment Gateway'],
      completed: '1. Payment Gateway Money In页面图表添加（未联调）\n2. Payment Gateway修改现有所有的Client端图表组件（替换为OX组件）（未联调）\n3. 添加汇率切换及页面金额计算',
      inProgress: '继续进行中的任务',
      problems: '',
      tomorrowPlan: '明天继续完成剩余工作',
    },
    {
      name: 'KD',
      department: '开发组',
      projects: ['Payment Gateway', 'RZ', 'Remittance One'],
      completed: '1. Gateway的网关chart需求联调和修改（未完）\n2. 处理RZ support客户邮件以及替换新的邮件账户（邮件待客户确认，服务已替换prod）\n3. Remittance one反馈的需求使用本地BSB和问题处理（银行账户目前服务商有问题未提供）',
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
      tomorrowPlan: '明天先建立一个mock的mt服务器，lc看一下邮件和文件上传的问题',
    },
  ],
};

async function importReports() {
  try {
    console.log('📅 导入 2026-02-09 完整日报数据...\n');

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
