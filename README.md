# Luck

基于 Vue 3 + Vite 的抽奖系统，支持人员管理、奖品配置等功能。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 框架**: Tailwind CSS + DaisyUI
- **状态管理**: Pinia
- **路由**: Vue Router
- **国际化**: Vue I18n (支持中文/英文)

## 功能特性

- **抽奖功能**: 支持多种奖项配置，随机公平抽奖
- **人员管理**: Excel 模板导入/导出，人员信息管理
- **奖品配置**: 灵活的奖品设置，支持图片上传
- **界面定制**: 主题切换、颜色配置、图案设置
- **音乐管理**: 支持音乐上传和播放控制
- **响应式设计**: 适配不同屏幕尺寸
- **多语言支持**: 中文/英文切换
- **数据持久化**: 本地存储，数据不丢失

## 开发

### 环境要求

- Node.js >= 18
- pnpm >= 8 (推荐使用 pnpm)

### 安装依赖

```bash
pnpm install
```

### 开发运行

```bash
pnpm dev
```

开发服务器将在 `http://localhost:6719` 启动

### 构建

#### 标准构建（用于 Web 部署）

```bash
pnpm build
```

构建产物将输出到 `dist` 目录

本项目 fork 自 https://github.com/LOG1997/log-lottery

## 部署

### Cloudflare Workers Static Assets

项目使用 `wrangler.jsonc` 将 Vite 的 `dist` 目录作为 Workers Static Assets 部署，并为 Vue Router 启用了 SPA fallback。Wrangler 已作为项目开发依赖安装，无需全局安装。

Cloudflare Workers Builds 的 Node.js 版本已通过 `.node-version` 固定为 `22.16.0`。

1. **安装依赖并登录 Cloudflare**
   ```bash
   pnpm install --frozen-lockfile
   pnpm exec wrangler login
   ```

2. **本地预览 Cloudflare 路由行为**
   ```bash
   pnpm build
   pnpm preview:cloudflare
   ```

3. **构建并部署**
   ```bash
   pnpm deploy
   ```

#### 重要配置说明

**1. Base 路径配置**

当前 `vite.config.ts` 中，非 file 模式的 base 路径是 `/`。

**如果部署到 Cloudflare Workers 的根路径（推荐）：**
- 当前配置已正确：`base: mode === 'file' ? './' : '/'`

**如果部署到子路径（如 `/log-lottery/`）：**
- 需要修改 `vite.config.ts` 中的 base 配置为 `/log-lottery/`
- 或者使用自定义域名，然后保持为 `/`

**2. Vue Router 配置**

项目使用 Vue Router History 模式。`wrangler.jsonc` 中的 `not_found_handling: "single-page-application"` 会把未知的页面导航交给 `index.html`，无需额外 Worker 代码。

SheetJS 依赖按官方建议固定在 `vendor/xlsx-0.20.3.tgz`，避免部署构建依赖外部 CDN，并由锁文件记录完整性。

**3. API 请求配置**

如果项目需要调用后端 API：
- 开发环境：使用 Vite 代理（`/api` → `VITE_BASE_URL`）
- 生产环境：需要配置实际的 API 地址
- 可以通过环境变量 `VITE_BASE_URL` 配置

#### 自定义域名与持续部署

可在 Workers 项目的 Settings → Domains & Routes 添加自定义域名。使用 Cloudflare Builds 或外部 CI 时，构建命令为 `pnpm build`，部署命令为 `pnpm exec wrangler deploy`。

#### 注意事项

1. **构建命令**: 确保使用 `pnpm build` 或 `npm run build`（不是 `build:file`）
2. **输出目录**: 确保是 `dist`（不是 `dist-file`）
3. **依赖安装**: CI 使用 `pnpm install --frozen-lockfile`，确保部署可复现
4. **配置文件**: 修改 `wrangler.jsonc` 后先执行 `pnpm preview:cloudflare` 验证

#### 故障排除

**构建失败**
- 检查构建命令是否正确
- 检查 Node 版本是否兼容
- 查看构建日志中的错误信息

**路由 404 错误**
- 检查 `wrangler.jsonc` 的 `assets.directory` 和 `not_found_handling`
- 检查 Vue Router 的 base 配置

**API 请求失败**
- 检查 CORS 配置
- 确认 API 地址配置正确
- 考虑使用 Cloudflare Workers 作为 API 代理


## 项目结构

```
luck/
├── public/              # 静态资源
│   ├── images/         # 图片资源
│   ├── _redirects      # Cloudflare Pages 兼容重定向规则
│   ├── _headers        # Cloudflare 安全头和静态资源缓存规则
│   └── favicon.svg     # 网站图标
├── src/
│   ├── api/            # API 请求
│   ├── assets/       # 资源文件
│   ├── components/   # 组件
│   ├── hooks/        # 组合式函数
│   ├── layout/       # 布局组件
│   ├── locales/      # 国际化文件
│   ├── router/       # 路由配置
│   ├── store/        # 状态管理
│   ├── utils/        # 工具函数
│   └── views/        # 页面组件
├── wrangler.jsonc    # Cloudflare Workers Static Assets 配置
└── vite.config.ts    # Vite 配置
```

## 使用说明

详细的使用说明请查看应用内的"操作说明"页面，或查看 `public/readme-zhCn.md` 和 `public/readme-en.md`

## 许可证

MIT License
