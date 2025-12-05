-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true);

-- Storage policies for materials bucket
CREATE POLICY "Users can view their own materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create materials table for metadata
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for materials
CREATE POLICY "Users can view their own materials"
ON public.materials FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own materials"
ON public.materials FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
ON public.materials FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
ON public.materials FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();