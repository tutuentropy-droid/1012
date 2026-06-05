# 痕迹 - 扩展性规划

## 一、近期规划（v1.1 ~ v1.5）

### v1.1 - 数据增强
- [ ] 导入豆瓣阅读/豆瓣观影历史数据
- [ ] 接入 Open Library / TMDB 获取书籍/剧集元数据
- [ ] 作品封面自动抓取与本地缓存
- [ ] 导出功能：Markdown / PDF / 图片长卷

### v1.2 - 社交与分享
- [ ] 用户资料页（公开的阅读/观看记录）
- [ ] 分享单条笔记为图片（宣纸+印章样式）
- [ ] 好友动态（时间线式呈现）
- [ ] 作品推荐（基于标签与评分的协同过滤）

### v1.3 - 内容深化
- [ ] 书籍/剧集章节化管理
- [ ] 笔记引用原文段落（高亮关联）
- [ ] 时间线视图（按时间回顾所有痕迹）
- [ ] 思维导图式笔记关联

### v1.4 - 多媒体扩展
- [ ] 音乐/播客/电影追踪
- [ ] 游戏通关记录
- [ ] 展览/演出打卡
- [ ] 统一的"文化消费"数据模型

### v1.5 - 智能辅助
- [ ] AI 读书笔记摘要（接入 LLM）
- [ ] AI 年度报告文案生成
- [ ] 基于阅读习惯的推荐
- [ ] 笔记智能标签与归档

---

## 二、中期规划（v2.0）

### 数据层扩展
- [ ] 接入 Elasticsearch 做全文搜索与聚合
- [ ] Redis 缓存统计结果与热门数据
- [ ] 对象存储（OSS/S3）存放封面、长卷截图、用户上传图片
- [ ] 数据库读写分离

### 应用层扩展
- [ ] 微服务拆分：用户服务、内容服务、统计服务、推荐服务
- [ ] 消息队列（RabbitMQ/Kafka）异步处理统计与通知
- [ ] WebSocket 实时通知

### 多端扩展
- [ ] PWA 离线支持
- [ ] 小程序版（微信/支付宝）
- [ ] 原生移动端（React Native / Flutter）
- [ ] 桌面客户端（Electron）

---

## 三、长期愿景（v3.0+）

### 个人数字图书馆
- [ ] 电子书管理与阅读（EPUB/PDF）
- [ ] 书摘自动同步
- [ ] 个人知识图谱
- [ ] 跨平台内容统一归档

### 社区与文化
- [ ] 共读/共看活动
- [ ] 读书会线上空间
- [ ] 创作者入驻（作者/导演与读者互动）
- [ ] 数字藏品（年度长卷 mint 为 NFT，可选）

---

## 四、架构扩展点说明

### 4.1 搜索层

当前实现（MongoDB 全文索引）：
```
services/searchService.js → MongoDB $text query
```

未来扩展（Elasticsearch）：
```
services/searchService.js → Elasticsearch Client
                            ↓ (同步机制)
                     MongoDB Change Stream
```

只需替换 `searchService` 内部实现，对外 API 保持不变。

### 4.2 存储层

当前实现（本地文件系统）：
```
services/storageService.js → fs.writeFile(./uploads/...)
```

未来扩展（对象存储）：
```
services/storageService.js → AWS SDK / Aliyun OSS SDK
```

提供统一的 `upload()` / `getUrl()` / `delete()` 接口。

### 4.3 通知层

当前实现（无）：
```
预留 services/notificationService.js 空实现
```

未来扩展：
```
services/notificationService.js
  ├── emailProvider.js  (Nodemailer)
  ├── pushProvider.js   (Firebase / APNs)
  └── inboxProvider.js  (站内信)
```

通过策略模式选择推送渠道。

### 4.4 作品元数据源

当前实现（用户手动输入 + 简单搜索）：
```
services/metadataService.js
  └── localProvider.js (MongoDB + 用户录入)
```

未来扩展：
```
services/metadataService.js
  ├── tmdbProvider.js       (剧集/电影)
  ├── openLibraryProvider.js (书籍)
  ├── doubanProvider.js      (豆瓣)
  └── localProvider.js       (兜底)
```

统一的 Provider 接口：`search()` / `getDetail()` / `getCover()`。

---

## 五、数据模型扩展预留

在现有数据模型中预留以下字段，避免未来频繁迁移：

```js
// Work 模型
{
  metadata: { type: Map, default: {} },     // 第三方数据源 ID 映射
  externalIds: [{                            // 多平台 ID
    source: String,   // 'douban' | 'tmdb' | 'openlibrary'
    id: String
  }],
  customFields: { type: Map, default: {} }, // 用户自定义字段
}

// Note 模型
{
  attachments: [{ type: String }],          // 预留图片/音频附件
  references: [{                            // 预留引用关系
    type: String,     // 'quote' | 'link' | 'note'
    target: ObjectId
  }],
}

// User 模型
{
  preferences: { type: Map, default: {} },  // 用户偏好设置
  integrations: { type: Map, default: {} }, // 第三方账号绑定
}
```

---

## 六、插件化设计

统计与报告模块设计为可注册的插件体系：

```js
// 核心引擎
class ReportEngine {
  plugins = [];
  
  register(plugin) {
    this.plugins.push(plugin);
  }
  
  async generate(userId, year) {
    const context = { userId, year, data: await this.loadData(userId, year) };
    const sections = [];
    for (const plugin of this.plugins) {
      if (plugin.enabled) {
        sections.push(await plugin.render(context));
      }
    }
    return this.composeScroll(sections);
  }
}

// 插件示例
const ReadingCountPlugin = {
  name: 'reading-count',
  enabled: true,
  async render(ctx) {
    return {
      type: 'chart',
      title: '全年阅读量',
      data: computeReadingStats(ctx.data),
      visual: 'mountain'  // 山峦可视化
    };
  }
};
```

新增报告模块只需注册插件，无需修改核心代码。
