# 痕迹 - API 接口文档

## 基础信息

- Base URL: `/api/v1`
- 认证方式: JWT Bearer Token (`Authorization: Bearer <token>`)
- 数据格式: JSON
- 时间格式: ISO 8601

---

## 一、认证模块 `POST /api/v1/auth`

### 1.1 注册
```
POST /register
Body: { username, email, password }
Response: { token, user: { id, username, email } }
```

### 1.2 登录
```
POST /login
Body: { email, password }
Response: { token, user: { id, username, email } }
```

### 1.3 获取当前用户
```
GET /me (需要认证)
Response: { id, username, email, createdAt }
```

---

## 二、作品模块 `GET|POST|PUT|DELETE /api/v1/works`

### 2.1 作品数据结构
```typescript
Work {
  id: ObjectId;
  userId: ObjectId;           // 所属用户
  type: 'tv' | 'book' | 'movie' | 'other';
  title: string;               // 标题
  subtitle?: string;           // 副标题
  author?: string;             // 作者/导演
  cover?: string;              // 封面图片 URL
  description?: string;        // 简介
  totalEpisodes?: number;      // 总集数（剧集）
  totalPages?: number;         // 总页数（书籍）
  currentEpisode: number;      // 当前看到第几集
  currentPage: number;         // 当前读到第几页
  status: 'wish' | 'watching' | 'watched' | 'paused' | 'dropped';
  rating: 0 | 1 | 2 | 3 | 4 | 5;  // 印章评分
  startedAt?: Date;            // 开始时间
  finishedAt?: Date;           // 完成时间
  tags: ObjectId[];            // 标签 ID 列表
  moodColor?: string;          // 默认心情色（hex）
  noteCount: number;           // 笔记数量（冗余字段）
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 获取作品列表
```
GET /works (需要认证)
Query:
  - type: 'tv' | 'book' | 'all' (默认 all)
  - status: 'wish' | 'watching' | 'watched' | 'all' (默认 all)
  - tagId: ObjectId (可选)
  - search: string (关键词搜索标题/作者)
  - page: number (默认 1)
  - pageSize: number (默认 20)
  - sortBy: 'createdAt' | 'updatedAt' | 'rating' (默认 updatedAt)
  - sortOrder: 'asc' | 'desc' (默认 desc)

Response:
{
  items: Work[],
  pagination: { page, pageSize, total, totalPages }
}
```

### 2.3 获取单个作品详情
```
GET /works/:id (需要认证)
Response: Work & { notes: Note[] }
```

### 2.4 新增作品
```
POST /works (需要认证)
Body: Partial<Work> (type, title 必填)
Response: Work
```

### 2.5 更新作品
```
PUT /works/:id (需要认证)
Body: Partial<Work>
Response: Work
```

### 2.6 删除作品
```
DELETE /works/:id (需要认证)
Response: { success: true }
```

### 2.7 更新进度
```
PUT /works/:id/progress (需要认证)
Body: {
  currentEpisode?: number,
  currentPage?: number,
  status?: Work['status'],
  moodColor?: string
}
Response: Work
```

### 2.8 评分（盖印）
```
PUT /works/:id/rating (需要认证)
Body: { rating: 0 | 1 | 2 | 3 | 4 | 5, moodColor?: string }
Response: Work
```

---

## 三、笔记模块 `GET|POST|PUT|DELETE /api/v1/notes`

### 3.1 笔记数据结构
```typescript
Note {
  id: ObjectId;
  userId: ObjectId;
  workId: ObjectId;           // 关联作品
  content: string;             // 笔记内容（支持 Markdown）
  moodColor?: string;          // 中国色心情
  location?: {                 // 记录位置
    episode?: number,          // 第几集
    page?: number,             // 第几页
    chapter?: string,          // 章节名
  };
  isPrivate: boolean;          // 是否私密
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 获取笔记列表
```
GET /notes (需要认证)
Query:
  - workId: ObjectId (可选，按作品过滤)
  - moodColor: string (可选，按心情色过滤)
  - page, pageSize, sortBy, sortOrder

Response: { items: Note[], pagination }
```

### 3.3 获取单条笔记
```
GET /notes/:id (需要认证)
Response: Note & { work: { id, title, type } }
```

### 3.4 新增笔记
```
POST /notes (需要认证)
Body: { workId, content, moodColor?, location?, isPrivate? }
Response: Note
```

### 3.5 更新笔记
```
PUT /notes/:id (需要认证)
Body: Partial<Note>
Response: Note
```

### 3.6 删除笔记
```
DELETE /notes/:id (需要认证)
Response: { success: true }
```

---

## 四、标签模块 `GET|POST|PUT|DELETE /api/v1/tags`

### 4.1 标签数据结构
```typescript
Tag {
  id: ObjectId;
  userId: ObjectId;
  name: string;
  color?: string;              // 标签颜色
  workCount: number;           // 作品数量（冗余）
  createdAt: Date;
}
```

### 4.2 接口
```
GET    /tags              获取所有标签
POST   /tags              新建标签 { name, color? }
PUT    /tags/:id          更新标签
DELETE /tags/:id          删除标签（同时移除所有作品的此标签）
```

---

## 五、统计模块 `GET /api/v1/stats`

### 5.1 概览统计
```
GET /stats/overview (需要认证)
Response: {
  totalWorks: number,          // 作品总数
  totalNotes: number,          // 笔记总数
  watchedThisYear: number,     // 今年看完/读完
  watchingNow: number,         // 正在进行中
  byType: { tv: number, book: number, movie: number, other: number },
  byStatus: { wish, watching, watched, paused, dropped },
  moodDistribution: [          // 心情色分布
    { color: string, name: string, count: number }
  ],
  totalReadingTime?: number,   // 估算总阅读/观看时长（分钟）
}
```

### 5.2 周热力图数据
```
GET /stats/weekly-heatmap (需要认证)
Query:
  - weeks: number (默认 52，近一年)

Response: {
  weeks: [
    {
      weekStart: string (ISO date),
      days: [
        { date: string, activityCount: number }  // 7天
      ]
    }
  ],
  maxActivity: number        // 用于墨点浓度归一化
}
```

### 5.3 月度统计
```
GET /stats/monthly (需要认证)
Query:
  - year: number (默认 当前年)

Response: {
  months: [
    {
      month: 1-12,
      worksCompleted: number,
      notesCount: number,
      avgRating: number,
      topMood: string
    }
  ]
}
```

### 5.4 年度报告
```
GET /stats/annual-report/:year (需要认证)
Response: {
  year: number,
  summary: {
    worksAdded: number,
    worksCompleted: number,
    totalNotes: number,
    totalEpisodesWatched: number,
    totalPagesRead: number
  },
  topRated: Work[],
  mostNotes: Work[],
  monthlyBreakdown: (同 5.3),
  moodTimeline: [
    { date: string, color: string, workId, noteId? }
  ],
  tagsCloud: [ { tagId, tagName, count } ],
  wordCloud: string[],        // 笔记高频词
  milestones: [
    { date: string, type: string, text: string }
  ]
}
```

---

## 六、中国色模块 `GET /api/v1/colors`

### 6.1 获取所有中国色
```
GET /colors (公开)
Response: [
  { name: string, hex: string, desc: string }
]
```

---

## 七、搜索模块 `GET /api/v1/search`

### 7.1 全局搜索
```
GET /search (需要认证)
Query:
  - q: string (关键词)
  - scope: 'all' | 'works' | 'notes' | 'tags' (默认 all)

Response: {
  works: Work[],
  notes: Note[],
  tags: Tag[]
}
```

---

## 八、错误响应格式

所有错误统一返回：
```json
{
  "error": {
    "code": "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "INTERNAL_ERROR",
    "message": "错误说明",
    "details": {}
  }
}
```

HTTP 状态码：
- 200: 成功
- 201: 创建成功
- 400: 参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 429: 请求过多
- 500: 服务器错误
