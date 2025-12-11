-- Migration 1: Add soft delete functionality

-- Add deleted_at column to materials table for soft delete
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance on non-deleted materials
CREATE INDEX IF NOT EXISTS idx_materials_deleted_at ON public.materials(user_id, deleted_at);

-- Create a function to auto-delete materials older than 30 days in trash
CREATE OR REPLACE FUNCTION public.auto_cleanup_trash()
RETURNS void AS $$
BEGIN
  DELETE FROM public.materials
  WHERE deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;