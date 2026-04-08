-- Create storage bucket for study documents
INSERT INTO storage.buckets (id, name, public) VALUES ('study-documents', 'study-documents', false);

-- RLS for storage: users can manage own files
CREATE POLICY "Users upload own documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users read own documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'study-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users delete own documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'study-documents' AND (storage.foldername(name))[1] = auth.uid()::text);