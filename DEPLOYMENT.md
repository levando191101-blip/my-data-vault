# 部署指南

本项目支持两种部署方式：**Lovable 直接发布** 和 **Vercel 部署**。

## 📦 方式一：Lovable 直接发布（推荐新手）

### 优点
- ✅ 最简单，一键发布
- ✅ 自动更新（Lovable 修改后自动重新部署）
- ✅ 无需额外配置

### 步骤
1. 访问你的 Lovable 项目：https://lovable.dev/projects/518288a6-4d0e-4d83-a4f4-07ffd156b3ea
2. 点击右上角 **"Share"** → **"Publish"**
3. Lovable 会自动部署并给你一个公开网址
4. 完成！其他人可以通过这个网址访问你的网站

### 注意事项
- Lovable 会自动管理环境变量
- 修改代码后，Lovable 会自动重新部署
- 免费版可能有使用限制

---

## 🚀 方式二：Vercel 部署（推荐需要更多控制时使用）

### 优点
- ✅ 完全控制部署配置
- ✅ 自定义域名
- ✅ 详细的部署日志
- ✅ 环境变量管理
- ✅ 免费额度充足

### 步骤

#### 1. 准备环境变量

复制 `.env.example` 文件并重命名为 `.env`：

```bash
# Windows PowerShell
Copy-Item .env.example .env
```

然后编辑 `.env` 文件，填入你的 Supabase 配置：
- `VITE_SUPABASE_URL`：从 Supabase 控制台获取
- `VITE_SUPABASE_PUBLISHABLE_KEY`：从 Supabase 控制台获取

**如何获取 Supabase 配置：**
1. 登录 [Supabase](https://supabase.com)
2. 进入你的项目
3. 点击左侧 **Settings** → **API**
4. 找到：
   - **Project URL** → 这就是 `VITE_SUPABASE_URL`
   - **anon/public key** → 这就是 `VITE_SUPABASE_PUBLISHABLE_KEY`

#### 2. 注册 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录（推荐）

#### 3. 导入项目

1. 在 Vercel 点击 **"Add New..."** → **"Project"**
2. 选择你的 GitHub 仓库：`levando191101-blip/my-data-vault`
3. 点击 **"Import"**

#### 4. 配置环境变量

在 Vercel 项目设置中：
1. 进入 **Settings** → **Environment Variables**
2. 添加以下变量：
   - `VITE_SUPABASE_URL` = 你的 Supabase URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = 你的 Supabase Key
3. 选择环境：**Production**, **Preview**, **Development**（全选）
4. 点击 **Save**

#### 5. 部署

1. Vercel 会自动检测到这是 Vite 项目
2. 确认配置：
   - **Framework Preset**: Vite（自动识别）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `dist`（默认）
   - **Install Command**: `npm install`（默认）
3. 点击 **"Deploy"**
4. 等待部署完成（通常 1-2 分钟）

#### 6. 完成

部署完成后，Vercel 会给你一个网址，例如：
- `my-data-vault.vercel.app`
- 或者你自定义的域名

---

## 🔄 日常使用流程

### 在 Cursor 中修改代码后

```bash
# 1. 查看修改
git status

# 2. 添加修改的文件
git add .

# 3. 提交修改（写有意义的描述）
git commit -m "修复登录页面的验证逻辑"

# 4. 推送到 GitHub
git push origin main
```

**自动部署：**
- **Lovable 发布**：Lovable 会自动检测 GitHub 更新并重新部署
- **Vercel 部署**：Vercel 会自动检测 GitHub 更新并重新部署

### 从 Lovable 获取最新代码

```bash
# 拉取最新代码
git pull origin main
```

---

## 🔀 两种方式可以同时使用

你可以同时使用两种部署方式：
- **Lovable 发布**：用于快速测试和展示
- **Vercel 部署**：用于生产环境和自定义配置

两个部署互不影响，可以访问不同的网址。

---

## ❓ 常见问题

### Q: 部署后网站无法访问？
A: 检查环境变量是否正确配置，特别是 Supabase 的 URL 和 Key。

### Q: 修改代码后网站没有更新？
A: 确保你已经执行了 `git push`，并且部署平台已经检测到更新。

### Q: 如何查看部署日志？
- **Lovable**：在项目设置中查看
- **Vercel**：在 Vercel 控制台的 Deployments 页面查看

### Q: 如何回滚到之前的版本？
- **Lovable**：在项目设置中查看历史版本
- **Vercel**：在 Deployments 页面点击之前的部署，选择 "Promote to Production"

---

## 📚 相关链接

- [Lovable 项目](https://lovable.dev/projects/518288a6-4d0e-4d83-a4f4-07ffd156b3ea)
- [GitHub 仓库](https://github.com/levando191101-blip/my-data-vault)
- [Supabase 文档](https://supabase.com/docs)
- [Vercel 文档](https://vercel.com/docs)

