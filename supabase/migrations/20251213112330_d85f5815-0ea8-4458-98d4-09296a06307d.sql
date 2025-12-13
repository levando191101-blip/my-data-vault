-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Create optimized function to get user categories
CREATE OR REPLACE FUNCTION get_user_categories(user_id_param UUID)
RETURNS SETOF categories
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public
AS $$
  SELECT * FROM categories
  WHERE user_id = user_id_param
  ORDER BY parent_id NULLS FIRST, name ASC;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_categories TO authenticated;