-- 创建获取 materials 及其 tags 的高性能函数
-- 用于替代前端的 N+1 查询和数据拼接逻辑

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
    -- 使用 COALESCE 和 json_agg 一次性聚合所有 tags
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

-- 为函数添加注释
COMMENT ON FUNCTION get_materials_with_tags IS '一次查询获取用户的所有 materials 及其关联的 tags，避免 N+1 查询问题';

-- 授权给 authenticated 用户
GRANT EXECUTE ON FUNCTION get_materials_with_tags TO authenticated;

