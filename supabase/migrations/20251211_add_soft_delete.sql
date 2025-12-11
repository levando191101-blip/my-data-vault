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

-- Note: You can set up a cron job in Supabase to run this function periodically
-- Example: SELECT cron.schedule('cleanup-trash', '0 2 * * *', 'SELECT auto_cleanup_trash();');

