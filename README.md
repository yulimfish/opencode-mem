# opencode-mem — Paper & Ink 定制版

> 基于 [tickernelz/opencode-mem](https://github.com/tickernelz/opencode-mem) v2.26.0 的 Yulimfish 定制 fork。
> 保留上游全部功能，在源码层移植记忆演进系统（P1/P2），并以 Paper & Ink 视觉风格重制 WebUI。

## 这是什么

给 OpenCode 编码代理提供持久化记忆的插件。本地 Turso/libSQL 向量搜索，无需外部数据库。

**本 fork 相对上游的增强：**

| 特性               | 说明                                                                              |
| ------------------ | --------------------------------------------------------------------------------- |
| 记忆暂存（P1）     | 新记忆可标记为 `staged`，不进入检索/注入，WebUI 中可审查后批准                    |
| 软失效（P1）       | 合并/冲突后的历史记忆保留原文与向量，检索排除，不物理删除                         |
| 记忆合并（P1）     | `POST /api/memories/merge` 端点，多条记忆合并为一条，原条软失效                   |
| 证据链字段（P1）   | `source` / `authority` / `observed_at` / `valid_until`，为记忆可信度分级预留      |
| 会话捕获修复（P1） | per-session 空闲防抖 + per-session 捕获锁，修复多会话互顶漏捕；子代理会话跳过捕获 |
| outcome 打标（P1） | 自动捕获的摘要支持 `success` / `rework` / `corrected` / `none` 结果标记           |
| 混合注入检索（P2） | 综合相关性、时效性、权威度、注入频率的复合评分 + MMR 多样性选择 + token 预算截断  |
| Paper & Ink WebUI  | 衬线标题、纸张纹理、暖色卡片的视觉风格                                            |
| 图谱页             | 记忆—提示词关联图谱，支持搜索、筛选、详情面板                                     |

## 与 OpenChamber 扩展配合使用

本项目是记忆系统本体，负责记忆存储、捕获、检索与注入，并提供独立 WebUI 作为完整管理台。若你使用 OpenChamber，也可以安装配套的 [openchamber-memory-graph-ui](https://github.com/yulimfish/openchamber-memory-graph-ui)：它通过本地受限 API 提供 OpenChamber 内的浏览、搜索、管理与图谱入口，不另建记忆存储或替代本插件的核心逻辑。两个界面连接同一套记忆数据，可按工作场景任选或搭配使用。

## 安装

通过 `opencode-workflow-kit` 安装（推荐）：

```bash
bash install.sh
```

或手动安装：

```bash
npm install "github:Yulimfish/opencode-mem#yulimfish/paper-ink"
```

然后在 `opencode.jsonc` 中指定插件入口：

```jsonc
{
  "plugin": ["./node_modules/@yulimfish/opencode-mem/dist/plugin.js"],
}
```

## 配置

配置文件位于 `~/.config/opencode/opencode-mem.jsonc`（首次启动自动生成模板）。

**必须配置至少一种 AI provider**（用于自动捕获和用户画像学习）：

```jsonc
{
  // 推荐：使用 OpenCode 已认证的 provider
  "opencodeProvider": "anthropic",
  "opencodeModel": "claude-haiku-4-5-20251001",
}
```

或手动配置：

```jsonc
{
  "memoryProvider": "openai-chat",
  "memoryModel": "gpt-4o-mini",
  "memoryApiUrl": "https://api.openai.com/v1",
  "memoryApiKey": "sk-...",
}
```

**本 fork 新增的检索配置（可选）：**

```jsonc
{
  "retrieval": {
    "gateEnabled": true, // 启用注入门控
    "candidates": 20, // 混合检索候选数量
    "minScore": 0.3, // 最低相似度阈值
    "injectionTokenBudget": 2048, // 注入 token 预算
    "injectProfileTokenBudget": 1024, // 画像注入 token 预算
  },
}
```

完整配置项参见配置模板或上游 [README](https://github.com/tickernelz/opencode-mem#configuration)。

## 数据迁移警告

从 v2.19.4 或更早版本升级到本 fork（v2.26.0 基座）时，**存储格式会从 SQLite + USearch 迁移到 Turso/libSQL**。

- 首次启动时自动迁移，原始数据备份为 `.legacy.bak`
- **强烈建议迁移前手动备份 `~/.opencode-mem/data/` 目录**
- P1 的暂存/软失效/注入计数字段会在迁移中保留

## 开发

```bash
# 安装依赖（根目录 + web 目录）
bun install && cd web && bun install && cd ..

# 构建（TypeScript + Vite 前端）
bun run build

# 测试
bun test

# 类型检查
bun run typecheck

# 前端开发服务器
bun run web:dev
```

## 跟随上游

本 fork 基于 `tickernelz/opencode-mem` 的 `v2.26.0` 标签。升级上游时：

1. 在新分支上 merge 上游新版本
2. 解决 `src/services/turso/` 和 `src/index.ts` 的冲突（P1/P2 逻辑在这些文件中）
3. 检查 `web/src/` 是否有新增页面需要适配 Paper & Ink 风格
4. 运行 `bun run typecheck && bun test && bun run build` 验证
5. P1/P2 已移植到 TypeScript 源码，不再依赖 dist 补丁重放

旧的 v2.19.4 dist 补丁保存在 `patches/` 目录中，仅作历史参考，不参与构建。

## 许可证

MIT — 与上游一致。

## 致谢

- 上游项目：[tickernelz/opencode-mem](https://github.com/tickernelz/opencode-mem)
- 安装工具：[Yulimfish/opencode-workflow-kit](https://github.com/Yulimfish/opencode-workflow-kit)
