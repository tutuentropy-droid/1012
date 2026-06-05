# 痕迹 · Henji

> 读书观剧，皆是人生。

一个充满中国古典美学的追剧追书记录网站。以宣纸为底，墨迹为痕，朱砂为印，记录你每一次开卷的心情。

## ✨ 特色

- **宣纸质感**：全页面采用手工宣纸纹理与墨色浓淡渐变
- **朱砂印章评分**：不用星星，盖一方朱印，分"上上品/上/中/次/下"
- **旧书页笔记**：笔记呈现古籍批注的质感，可在书页留白处随意落笔
- **折扇统计**：数据可视化成一把可展开的水墨折扇
- **墨点热力图**：每周活跃度以墨点疏密呈现，如梅花落纸
- **数字长卷年度报告**：全年数据横滑浏览，如徐徐展开的山水手卷
- **中国色心情**：月白、黛蓝、朱柿、鹅黄...以传统色记录每份心情

## 🏗️ 架构

```
痕迹/
├── docs/                     # 架构与设计文档
│   ├── ARCHITECTURE.md       # 系统架构图与技术选型
│   ├── DESIGN.md             # 中国古典美学设计规范
│   ├── API.md                # 后端接口文档
│   └── EXTENSION.md          # 扩展性规划
├── server/                   # Node.js + Express + MongoDB 后端
│   └── src/
│       ├── config/           # 配置（数据库、日志）
│       ├── models/           # Mongoose 数据模型
│       ├── routes/           # API 路由
│       ├── controllers/      # 请求处理
│       ├── services/         # 业务逻辑
│       ├── middleware/       # 中间件（认证、错误处理）
│       ├── data/             # 种子数据（中国色、标签）
│       └── utils/            # 工具函数
└── client/                   # React 18 + Vite + TypeScript 前端
    └── src/
        ├── styles/           # 古典美学样式体系
        ├── components/       # 特色 UI 组件
        │   ├── SealStamp/       # 朱砂印章评分
        │   ├── OldBookPage/     # 旧书页笔记
        │   ├── FoldingFan/      # 折扇统计面板
        │   ├── InkHeatmap/      # 墨点热力图
        │   ├── ChineseColorPicker/ # 中国色心情选择
        │   ├── InkScroll/       # 数字长卷（年度报告）
        │   └── WorkCard/        # 作品卡片
        └── pages/            # 页面
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- MongoDB >= 7（本地运行或 MongoDB Atlas）

### 1. 安装依赖

```bash
# 全局安装
npm install

# 或分别安装
cd server && npm install
cd ../client && npm install
```

### 2. 配置环境变量

后端已自带开发环境配置 `.env`，如需修改可参照 `server/.env.example`。

### 3. 启动 MongoDB

确保本地 MongoDB 服务运行在默认端口 `27017`，或修改 `MONGO_URI`。

### 4. 植入测试数据（可选）

```bash
npm run seed
# 测试账号：demo@henji.app / 123456
```

### 5. 启动开发环境

```bash
# 同时启动前后端
npm run dev

# 或分别启动
npm run dev:server   # 后端 http://localhost:5001
npm run dev:client   # 前端 http://localhost:5173
```

浏览器打开 http://localhost:5173 即可使用。

## 🧩 功能模块

| 模块 | 功能 |
|------|------|
| 作品管理 | 搜索、分类（剧集/书籍/电影/其他）、状态（想看/在看/已看/搁置/弃坑） |
| 进度追踪 | 记录看到第几集、读到第几页，自动计算进度百分比 |
| 印章评分 | 0~5 档朱砂印章式评分 |
| 笔记批注 | 旧书页质感笔记，可关联具体章节/集数/页码 |
| 标签管理 | 自定义签花，作品打标签 |
| 中国色心情 | 每次写笔记或改状态时可选一种中国色记录心情 |
| 统计概览 | 折扇面板展示作品分布、类型、状态等多维统计 |
| 墨点热力图 | 近一年每日活动量以墨点疏密呈现 |
| 月度统计 | 十二月令式的月度完卷与批注统计 |
| 年度长卷 | 可横向拖动浏览的数字手卷式年度报告 |

## 📚 文档

详细文档请查看 [`docs/`](./docs/) 目录：

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - 系统架构、技术选型、目录结构
- [DESIGN.md](./docs/DESIGN.md) - 中国古典美学设计规范（色彩、字体、动效）
- [API.md](./docs/API.md) - 后端 RESTful API 接口文档
- [EXTENSION.md](./docs/EXTENSION.md) - 未来功能与扩展性规划

## 🔧 技术栈

### 前端
- React 18 + TypeScript
- Vite 5
- React Router v6
- Zustand（轻量状态管理）
- Axios
- Day.js

### 后端
- Node.js 20 + Express
- MongoDB 7 + Mongoose 8
- JWT 认证
- Joi 参数校验
- Winston 日志
- Helmet + rate-limit 安全防护

## 🎨 设计理念

> 于留白处见天地，于墨痕间见人心。

整体设计取意中国传统手卷与古籍版式，追求沉静、克制、留白、余韵。每一个交互都如提笔落墨，留下可追溯的"痕迹"。

详细设计规范见 [`docs/DESIGN.md`](./docs/DESIGN.md)。

## 📝 License

MIT
