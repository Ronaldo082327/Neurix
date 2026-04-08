
CREATE TABLE public.pre_launch_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  study_area text,
  current_stage text,
  how_found_us text,
  wants_beta boolean DEFAULT true
);

ALTER TABLE public.pre_launch_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup form)
CREATE POLICY "Anyone can sign up for pre-launch"
  ON public.pre_launch_signups
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admins could read (for now allow insert only)
CREATE POLICY "No public reads"
  ON public.pre_launch_signups
  FOR SELECT
  TO authenticated
  USING (false);
