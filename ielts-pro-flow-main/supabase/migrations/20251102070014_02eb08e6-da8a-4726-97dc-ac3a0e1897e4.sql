-- Create storage bucket for speaking recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('speaking-recordings', 'speaking-recordings', false);

-- RLS policies for speaking recordings bucket
CREATE POLICY "Users can upload their own speaking recordings"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'speaking-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own speaking recordings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'speaking-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own speaking recordings"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'speaking-recordings' AND
  auth.uid()::text = (storage.foldername(name))[1]
);