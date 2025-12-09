-- Add sort_order column to materials table
ALTER TABLE public.materials ADD COLUMN sort_order integer DEFAULT 0;

-- Create index for better sorting performance
CREATE INDEX idx_materials_sort_order ON public.materials(user_id, sort_order);