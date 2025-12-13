-- 优化 categories 查询性能
-- 添加索引并创建优化的视图

-- 1. 为 categories 表添加索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- 2. 创建获取用户 categories 的优化函数
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

-- 授权
GRANT EXECUTE ON FUNCTION get_user_categories TO authenticated;

-- 添加注释
COMMENT ON FUNCTION get_user_categories IS '优化的 categories 查询函数，使用索引加速';

