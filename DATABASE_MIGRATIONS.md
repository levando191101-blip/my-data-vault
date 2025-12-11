# 数据库迁移说明

本项目新增了以下功能，需要应用数据库迁移：

## 🗑️ 迁移 1：回收站功能（软删除）

**文件：** `supabase/migrations/20251211_add_soft_delete.sql`

**内容：**
- 添加 `deleted_at` 列到 `materials` 表
- 创建索引以优化查询性能
- 创建自动清理函数（删除30天前的文件）

**SQL：**
```sql
-- Add deleted_at column to materials table for soft delete
ALTER TABLE public.materials ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance on non-deleted materials
CREATE INDEX idx_materials_deleted_at ON public.materials(user_id, deleted_at);

-- Create a function to auto-delete materials older than 30 days in trash
CREATE OR REPLACE FUNCTION auto_cleanup_trash()
RETURNS void AS $$
BEGIN
  DELETE FROM public.materials
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔗 迁移 2：分享功能

**文件：** `supabase/migrations/20251211_add_shares.sql`

**内容：**
- 创建 `shares` 表用于文件分享
- 配置 RLS 策略
- 创建索引

**SQL：**
```sql
-- Create shares table for file sharing
CREATE TABLE public.shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  password TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_downloads INTEGER,
  download_count INTEGER DEFAULT 0,
  allow_preview BOOLEAN DEFAULT TRUE,
  allow_download BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own shares"
ON public.shares FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shares for their materials"
ON public.shares FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shares"
ON public.shares FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shares"
ON public.shares FOR DELETE
USING (auth.uid() = user_id);

-- Public access policy for share codes
CREATE POLICY "Anyone can view share with valid code"
ON public.shares FOR SELECT
USING (share_code IS NOT NULL);

-- Create indexes
CREATE INDEX idx_shares_share_code ON public.shares(share_code);
CREATE INDEX idx_shares_material_id ON public.shares(material_id);
CREATE INDEX idx_shares_user_id ON public.shares(user_id);
```

---

## 📝 如何应用迁移

### 方法 1：Supabase Dashboard（推荐）

1. 打开 Supabase 项目：https://supabase.com/dashboard/project/cxthfywonlehyebgwaql
2. 进入 **SQL Editor**
3. 复制并运行 `20251211_add_soft_delete.sql` 的内容
4. 复制并运行 `20251211_add_shares.sql` 的内容
5. 确认执行成功

### 方法 2：Supabase CLI

```bash
# 确保已安装 Supabase CLI
supabase db push

# 或手动运行迁移
supabase db execute --file supabase/migrations/20251211_add_soft_delete.sql
supabase db execute --file supabase/migrations/20251211_add_shares.sql
```

---

## ✅ 验证迁移

运行以下 SQL 验证迁移是否成功：

```sql
-- 检查 deleted_at 列
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'materials' AND column_name = 'deleted_at';

-- 检查 shares 表
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'shares';

-- 检查索引
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('materials', 'shares');
```

---

## 🔄 可选：设置自动清理（Cron Job）

如果你的 Supabase 计划支持 pg_cron，可以设置定时清理：

```sql
-- 每天凌晨 2 点自动清理回收站
SELECT cron.schedule(
  'cleanup-trash',
  '0 2 * * *',
  'SELECT auto_cleanup_trash();'
);
```

**注意：** 免费计划可能不支持 pg_cron，需要手动调用函数或升级计划。

---

## ⚠️ 重要提示

1. 迁移会修改数据库结构，建议在测试环境先验证
2. 备份重要数据
3. 迁移不可回滚，请仔细检查 SQL 语句
4. 如果遇到错误，请检查是否有冲突的表或列

---

## 📊 新增功能概览

执行这些迁移后，你将获得：

✅ **回收站功能**
- 软删除文件（保留 30 天）
- 恢复已删除文件
- 永久删除
- 自动清理过期文件

✅ **分享功能（数据库支持）**
- 生成分享链接
- 密码保护
- 过期时间设置
- 下载次数限制
- 权限控制

---

**最后更新：** 2024-12-11

