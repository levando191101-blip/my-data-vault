-- Make the materials bucket private
UPDATE storage.buckets SET public = false WHERE id = 'materials';

-- Update RLS policies for private bucket access
-- Users can only access their own files via signed URLs
DROP POLICY IF EXISTS "Authenticated users can read their own materials" ON storage.objects;
CREATE POLICY "Authenticated users can read their own materials"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can upload their own materials" ON storage.objects;
CREATE POLICY "Authenticated users can upload their own materials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can update their own materials" ON storage.objects;
CREATE POLICY "Authenticated users can update their own materials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can delete their own materials" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own materials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'materials' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);