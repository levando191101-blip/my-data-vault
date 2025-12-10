# Git 工作流程指南

本文档说明如何在 Lovable 和 Cursor 之间同步代码。

## 🔗 当前连接状态

✅ **已连接到 GitHub 仓库**
- 仓库地址：`https://github.com/levando191101-blip/my-data-vault.git`
- 当前分支：`main`
- 状态：已同步

---

## 📋 基本工作流程

### 场景 1：Lovable 更新了代码，你想在 Cursor 中看到

```bash
# 拉取最新代码
git pull origin main
```

**说明：**
- Lovable 修改代码后会自动推送到 GitHub
- 执行 `git pull` 可以获取这些更新
- 建议每天开始工作前执行一次

---

### 场景 2：你在 Cursor 中修改了代码，想同步到 Lovable

```bash
# 1. 查看修改了哪些文件
git status

# 2. 添加所有修改的文件
git add .

# 3. 提交修改（写有意义的描述）
git commit -m "添加用户头像上传功能"

# 4. 推送到 GitHub
git push origin main
```

**说明：**
- 推送到 GitHub 后，Lovable 会自动同步
- 通常几分钟内 Lovable 就能看到你的修改
- 提交信息要写清楚，方便以后查看历史

---

### 场景 3：两边都修改了代码（冲突处理）

如果 Lovable 和你都修改了同一个文件，可能会出现冲突：

```bash
# 1. 先提交你的本地修改
git add .
git commit -m "我的修改"

# 2. 拉取远程代码
git pull origin main

# 3. 如果有冲突，Git 会提示
# 例如：
# Auto-merging src/App.tsx
# CONFLICT (content): Merge conflict in src/App.tsx

# 4. 打开冲突的文件，你会看到类似这样的标记：
# <<<<<<< HEAD
# 你的代码
# =======
# Lovable 的代码
# >>>>>>> origin/main

# 5. 手动解决冲突：
#    - 删除冲突标记（<<<<<<<, =======, >>>>>>>）
#    - 保留你想要的代码
#    - 保存文件

# 6. 标记冲突已解决
git add .

# 7. 完成合并
git commit -m "解决合并冲突"

# 8. 推送到 GitHub
git push origin main
```

**避免冲突的建议：**
- 在 Cursor 工作前先 `git pull` 获取最新代码
- 修改完成后及时 `git push`
- 如果可能，避免同时修改同一个文件

---

## 🛠️ 常用 Git 命令

### 查看状态
```bash
# 查看当前状态
git status

# 查看修改了哪些文件
git diff

# 查看提交历史
git log --oneline -10
```

### 撤销修改
```bash
# 撤销未暂存的修改（危险：会丢失修改）
git restore <文件名>

# 撤销所有未暂存的修改
git restore .

# 撤销已暂存但未提交的修改
git restore --staged <文件名>
```

### 查看历史
```bash
# 查看提交历史（简洁版）
git log --oneline

# 查看某个文件的修改历史
git log src/App.tsx

# 查看具体某次提交的修改内容
git show <commit-id>
```

---

## 📝 提交信息规范

好的提交信息应该：
- ✅ 清楚描述做了什么
- ✅ 用中文或英文都可以
- ✅ 简洁明了

**示例：**
```bash
# ✅ 好的提交信息
git commit -m "修复登录页面的邮箱验证逻辑"
git commit -m "添加用户头像上传功能"
git commit -m "优化材料列表的加载性能"

# ❌ 不好的提交信息
git commit -m "修改"
git commit -m "更新"
git commit -m "fix"
```

---

## 🔍 检查同步状态

### 检查是否有远程更新
```bash
# 获取远程更新信息（不合并）
git fetch origin

# 查看本地和远程的差异
git log HEAD..origin/main --oneline
```

### 检查本地是否有未推送的提交
```bash
# 查看本地有但远程没有的提交
git log origin/main..HEAD --oneline
```

---

## ⚠️ 注意事项

1. **不要强制推送**：除非你知道在做什么，否则不要使用 `git push --force`
2. **定期拉取**：每天开始工作前执行 `git pull`
3. **及时推送**：修改完成后及时 `git push`，避免代码丢失
4. **提交前检查**：使用 `git status` 确认要提交的文件
5. **环境变量**：`.env` 文件不会被提交（已在 `.gitignore` 中），这是安全的

---

## 🆘 遇到问题？

### 问题：`git pull` 失败，提示需要先提交
**解决：**
```bash
# 先提交或暂存你的修改
git add .
git commit -m "临时提交"

# 然后再拉取
git pull origin main
```

### 问题：推送被拒绝
**解决：**
```bash
# 先拉取最新代码
git pull origin main

# 解决可能的冲突后
git push origin main
```

### 问题：想放弃所有本地修改，恢复到最后一次提交
**解决：**
```bash
# ⚠️ 警告：这会丢失所有未提交的修改
git restore .
```

---

## 📚 相关资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 仓库](https://github.com/levando191101-blip/my-data-vault)
- [Lovable 项目](https://lovable.dev/projects/518288a6-4d0e-4d83-a4f4-07ffd156b3ea)

