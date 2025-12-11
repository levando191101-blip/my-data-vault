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

-- Public access policy for share codes (anyone can view with code)
CREATE POLICY "Anyone can view share with valid code"
ON public.shares FOR SELECT
USING (share_code IS NOT NULL);

-- Create index for share_code lookups
CREATE INDEX idx_shares_share_code ON public.shares(share_code);
CREATE INDEX idx_shares_material_id ON public.shares(material_id);
CREATE INDEX idx_shares_user_id ON public.shares(user_id);

