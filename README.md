# Vue3 网易云音乐

基于 Vue 3 + Vite + TypeScript 仿写的网易云音乐 Web 应用，集成 AI 聊天助手。

## 功能

- **音乐馆** — 推荐歌单、新歌、歌手榜单（轮播图）
- **搜索** — 按关键词搜索歌曲、歌手、专辑
- **歌单详情** — 展示歌单内全部歌曲
- **播放器** — 在线播放、歌词同步滚动（二分查找高亮）
- **扫码登录** — 网易云 APP 二维码登录，自动同步用户信息
- **我的音乐** — 登录后查看个人歌单
- **AI 聊天** — 集成本地 Ollama 大模型，支持智能歌曲推荐，可拖拽/缩放面板

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3、Vue Router 5、Pinia、TypeScript |
| 构建工具 | Vite 8 |
| 网络请求 | Axios |
| 后端 API | [NeteaseCloudMusicApi](https://github.com/Rocket1184/NeteaseCloudMusicApi) (Enhanced) |
| AI | Ollama (qwen3.5:9b) |

## 项目结构

```
源码/
├── NCMusic/                # 前端项目
│   ├── src/
│   │   ├── api/            # 接口层（axios 实例、搜索、AI）
│   │   ├── components/ai/  # AI 聊天面板组件
│   │   ├── stores/         # Pinia 状态管理（user、ai）
│   │   ├── views/          # 页面组件
│   │   ├── router/         # 路由配置
│   │   └── assets/         # 静态资源
│   └── vite.config.ts
├── api-enhanced-main/      # 后端 API 服务
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 20.19.0
- pnpm
- Ollama（AI 功能需要）

### 1. 启动后端 API

```bash
cd api-enhanced-main
pnpm install
pnpm dev
```

后端默认运行在 `http://localhost:3000`。

### 2. 启动前端

```bash
cd NCMusic
pnpm install
pnpm dev
```

### 3. 启动 AI 服务（可选）

安装 [Ollama](https://ollama.ai) 并拉取模型：

```bash
ollama pull qwen3.5:9b
```

前端通过 Vite 代理 `/api/ollama` 转发到 `http://localhost:11434/api`，无需额外配置跨域。

## 开发命令

```bash
pnpm dev          # 开发服务器
pnpm build        # 类型检查 + 构建
pnpm type-check   # 仅类型检查
pnpm format       # Prettier 格式化
```
