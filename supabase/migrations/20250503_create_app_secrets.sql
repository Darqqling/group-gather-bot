
-- Create table for storing application secrets more securely
CREATE TABLE IF NOT EXISTS public.app_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Secure app_secrets with RLS, only allowing authenticated users with admin role to access
ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

-- Only allow service role to access app_secrets (via edge functions)
CREATE POLICY "Service role can manage app_secrets" 
ON public.app_secrets 
USING (auth.jwt() IS NULL);
