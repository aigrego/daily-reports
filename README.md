# Daily Report 日报系统

一款面向团队的极简日报管理系统，采用黑白设计风格，帮助团队高效汇报与汇总工作进展。

![Tech Stack](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=white)
![Tech Stack](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tech Stack](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)

## 功能特性

- **概览仪表盘** - 实时统计数据、7天趋势图表、今日日报、未提交提醒
- **写日报** - 支持多项目、快速模板、覆盖提交
- **汇总查看** - 按项目/人员/日期三种视图，多维度筛选
- **项目管理** - 创建、编辑、归档、删除，成员与颜色设置
- **成员管理** - 添加、编辑、删除，角色权限分配
- **权限控制** - 成员、负责人、管理员三级权限体系
- **密码登录** - 模拟密码验证，预留API接口

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router 6
- **UI组件**: Radix UI (Dialog, Dropdown, Select等)
- **图标**: Lucide React
- **图表**: Recharts
- **样式**: Tailwind CSS 3

## 快速开始

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 默认用户

系统预置5个测试用户，登录时选择用户并输入密码即可体验：

| 用户 | 角色 | 部门 | 密码 |
|------|------|------|------|
| 张三 | 负责人 | 技术部 | zhangsan123 |
| 李四 | 成员 | 技术部 | lisi123 |
| 王五 | 成员 | 产品部 | wangwu123 |
| 赵六 | 成员 | 设计部 | zhaoliu123 |
| 孙七 | 管理员 | 管理层 | sunqi123 |

## 项目结构

```
daily-report/
├── docs/
│   └── PRD.md              # 产品需求文档
├── src/
│   ├── components/         # 公共组件
│   ├── pages/              # 页面组件
│   ├── contexts/           # 状态管理
│   ├── data/               # 模拟数据
│   ├── types/              # TypeScript类型
│   └── styles/             # 全局样式
├── public/                 # 静态资源
└── package.json
```

## 设计规范

- **主题**: 黑白极简风格 + 彩色图标
- **圆角**: 大圆角设计 (16px-24px)
- **卡片**: 卡片式布局，阴影层次
- **动效**: 鼠标hover动效，平滑过渡
- **图标**: 渐变色背景图标（蓝、绿、紫、青、琥珀等）

## 角色权限

| 功能 | 成员 | 负责人 | 管理员 |
|------|------|--------|--------|
| 概览仪表盘 | ✅ | ✅ | ✅ |
| 写日报 | ✅ | ✅ | ✅ |
| 查看汇总 | 仅自己 | ✅ | ✅ |
| 项目管理 | - | ✅ | ✅ |
| 成员管理 | - | - | ✅ |

## 已完成

- ✅ 完整的日报系统功能
- ✅ 黑白风格UI + 彩色图标
- ✅ 登录页面带密码验证
- ✅ 三级权限控制（成员/负责人/管理员）
- ✅ 5个预设测试用户
- ✅ 响应式布局
- ✅ 平滑动画效果

## 后续可优化方向

- [ ] 接入真实后端API
- [ ] 添加数据持久化（数据库）
- [ ] 用户头像上传
- [ ] 日报评论功能
- [ ] 更多图表统计（周报/月报）
- [ ] 邮件提醒功能
- [ ] 导出日报（PDF/Excel）
- [ ] 暗黑模式
- [ ] 移动端适配优化
- [ ] 单元测试和E2E测试

## 文档

- [产品需求文档 (PRD)](./docs/PRD.md)

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
