# 🚀 阶段二性能优化部署指南

## 📊 **优化效果**

| 优化项 | 优化前 | 优化后（预期） | 提升 |
|--------|--------|---------------|------|
| **Materials 查询** | 2-4秒 | 558ms → **< 200ms** | 90%+ ↓ |
| **Categories 查询** | N/A | 748ms → **< 200ms** | 73% ↓ |
| **总加载时间** | 2-4秒 | **< 400ms** | 80%+ ↓ |

---

## ⚠️ **部署步骤**

### **步骤 1: 执行数据库迁移**

在 **Supabase SQL Editor** 或 **Lovable Cloud 数据库面板** 中**依次执行**以下 SQL：

#### **迁移 1: Materials 优化（如果还没执行）**

```sql
-- 文件：supabase/migrations/20251214_create_get_materials_with_tags_function.sql

CREATE OR REPLACE FUNCTION get_materials_with_tags(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT,
  file_size BIGINT,
  mime_type TEXT,
  category_id UUID,
  sort_order INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  tags JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    m.title,
    m.description,
    m.file_name,
    m.file_path,
    m.file_type,
    m.file_size,
    m.mime_type,
    m.category_id,
    m.sort_order,
    m.created_at,
    m.updated_at,
    m.deleted_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', t.id,
            'name', t.name,
            'color', t.color
          )
        )
        FROM material_tags mt
        INNER JOIN tags t ON mt.tag_id = t.id
        WHERE mt.material_id = m.id
      ),
      '[]'::jsonb
    ) AS tags
  FROM materials m
  WHERE m.user_id = user_id_param
    AND m.deleted_at IS NULL
  ORDER BY m.sort_order ASC, m.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_materials_with_tags TO authenticated;
```

#### **迁移 2: Categories 优化（新增！）**

```sql
-- 文件：supabase/migrations/20251214_create_get_categories_optimized.sql

-- 1. 添加索引
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- 2. 创建优化函数
CREATE OR REPLACE FUNCTION get_user_categories(user_id_param UUID)
RETURNS SETOF categories
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT *
  FROM categories
  WHERE user_id = user_id_param
  ORDER BY parent_id NULLS FIRST, name ASC;
$$;

GRANT EXECUTE ON FUNCTION get_user_categories TO authenticated;

COMMENT ON FUNCTION get_user_categories IS '优化的 categories 查询函数，使用索引加速';
```

---

### **步骤 2: 验证迁移成功**

在 SQL Editor 中执行测试（替换为您的 user_id）：

```sql
-- 测试 Materials 函数
SELECT COUNT(*) FROM get_materials_with_tags('your-user-id-here');

-- 测试 Categories 函数
SELECT COUNT(*) FROM get_user_categories('your-user-id-here');
```

如果两个查询都返回数字（即使是 0），说明函数创建成功！

---

### **步骤 3: 前端自动部署**

- ✅ 代码已推送到 GitHub
- 🔄 Vercel 将自动部署（2-3 分钟）
- 📍 https://my-data-vault-iota.vercel.app/

---

## 🧪 **测试验证**

### **1. 性能测试**

打开浏览器 **开发者工具（F12）** → **Network** 标签页：

1. 访问"我的资料"页面
2. 观察以下请求：
   - `get_materials_with_tags`: 应该 **< 200ms**
   - `get_user_categories`: 应该 **< 200ms**
3. ✅ 总加载时间应该 **< 400ms**

### **2. 对比测试**

| 请求 | 阶段一 | 阶段二（预期） | 提升 |
|------|--------|---------------|------|
| Materials | 558ms | < 200ms | 64% ↓ |
| Categories | 748ms | < 200ms | 73% ↓ |
| **总计** | **1306ms** | **< 400ms** | **69% ↓** |

---

## 💡 **优化原理**

### **Materials 优化**
- ❌ 原方案：3次查询 + O(N*M) 前端计算
- ✅ 新方案：1次 RPC + 数据库聚合

### **Categories 优化**
- ❌ 原方案：全表扫描 + 前端排序
- ✅ 新方案：索引查询 + 服务器端排序

### **缓存优化**
- `placeholderData`: 立即显示旧数据
- `staleTime`: 2 分钟内不重新请求
- `refetchOnMount/Focus`: 禁用，依赖缓存

---

## 📝 **故障排除**

### **问题 1: 函数创建失败**

**错误**: `permission denied for schema public`

**解决**: 确保您有数据库的管理员权限，或联系 Lovable 支持团队。

### **问题 2: 前端报错 "function does not exist"**

**原因**: 数据库迁移未执行或执行失败。

**解决**: 
1. 检查 SQL Editor 中是否有错误消息
2. 重新执行迁移 SQL
3. 验证函数存在：`\df get_materials_with_tags`

### **问题 3: 性能没有提升**

**原因**: 可能是网络延迟而不是查询延迟。

**检查**: 
1. Network 标签页查看实际请求时间
2. 如果 `Waiting (TTFB)` 很长，说明是网络问题
3. 尝试使用 CDN 或更近的 Supabase 区域

---

## 🎉 **预期结果**

执行完阶段二优化后：

- ✅ "我的资料"页面加载时间：**2-4秒 → < 400ms**
- ✅ 白屏等待时间：**几乎为零**（显示缓存数据）
- ✅ 用户体验：**质的飞跃** ⭐⭐⭐⭐⭐

---

## 📚 **相关文档**

- [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - 完整性能优化报告
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md) - 数据库迁移指南
- [CHANGELOG.md](./CHANGELOG.md) - 更新日志

---

**实施日期**: 2025-12-14  
**分析者**: Gemini 3 Pro  
**实施者**: Cursor AI Assistant

