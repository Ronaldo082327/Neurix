
CREATE TABLE public.document_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number integer NOT NULL,
  annotation_data jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_id, page_number)
);

ALTER TABLE public.document_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own annotations"
  ON public.document_annotations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
