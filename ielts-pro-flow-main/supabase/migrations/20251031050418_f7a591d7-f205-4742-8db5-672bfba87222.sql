-- Create grading rubric table
CREATE TABLE public.grading_rubric (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_score INTEGER NOT NULL,
  max_score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  ielts_band TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  performance_summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.grading_rubric ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the rubric
CREATE POLICY "Anyone can view grading rubric"
ON public.grading_rubric
FOR SELECT
USING (true);

-- Insert the grading rubric data
INSERT INTO public.grading_rubric (min_score, max_score, total_marks, ielts_band, cefr_level, performance_summary) VALUES
(14, 15, 15, 'Band 9', 'C2', 'Exceptional mastery — precise, critical understanding of complex ideas.'),
(12, 13, 15, 'Band 8', 'C1/C2', 'Very good command — fluent reasoning and nuanced explanation.'),
(10, 11, 15, 'Band 7', 'C1', 'Strong understanding — clear and coherent, with minor lapses.'),
(8, 9, 15, 'Band 6', 'B2', 'Adequate understanding — accurate but lacks depth or precision.'),
(6, 7, 15, 'Band 5', 'B1', 'Partial understanding — can express ideas simply but misses subtle points.'),
(4, 5, 15, 'Band 4', 'A2/B1', 'Limited comprehension — basic responses with some relevance.'),
(2, 3, 15, 'Band 3', 'A2', 'Minimal comprehension — responses are incomplete or off-topic.'),
(0, 1, 15, 'Band 1–2', 'A1', 'No meaningful understanding demonstrated.');

-- Add CEFR level columns to test_attempts table
ALTER TABLE public.test_attempts
ADD COLUMN listening_cefr TEXT,
ADD COLUMN reading_cefr TEXT,
ADD COLUMN writing_cefr TEXT,
ADD COLUMN speaking_cefr TEXT,
ADD COLUMN overall_cefr TEXT,
ADD COLUMN listening_ielts_band TEXT,
ADD COLUMN reading_ielts_band TEXT,
ADD COLUMN writing_ielts_band TEXT,
ADD COLUMN speaking_ielts_band TEXT,
ADD COLUMN overall_ielts_band TEXT;

-- Create function to calculate CEFR level based on score
CREATE OR REPLACE FUNCTION public.get_cefr_level(score NUMERIC, total_marks INTEGER)
RETURNS TABLE(cefr_level TEXT, ielts_band TEXT, performance_summary TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gr.cefr_level,
    gr.ielts_band,
    gr.performance_summary
  FROM public.grading_rubric gr
  WHERE score >= gr.min_score 
    AND score <= gr.max_score
    AND gr.total_marks = total_marks
  LIMIT 1;
END;
$$;

-- Create function to calculate overall CEFR based on all sections
CREATE OR REPLACE FUNCTION public.calculate_overall_cefr(
  listening_score NUMERIC,
  reading_score NUMERIC,
  writing_score NUMERIC,
  speaking_score NUMERIC
)
RETURNS TABLE(overall_cefr TEXT, overall_ielts_band TEXT, overall_performance TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_score NUMERIC;
  avg_score NUMERIC;
BEGIN
  -- Calculate average score (each section out of 15, so average and use same rubric)
  avg_score := (COALESCE(listening_score, 0) + COALESCE(reading_score, 0) + 
                COALESCE(writing_score, 0) + COALESCE(speaking_score, 0)) / 4.0;
  
  RETURN QUERY
  SELECT 
    gr.cefr_level,
    gr.ielts_band,
    gr.performance_summary
  FROM public.grading_rubric gr
  WHERE avg_score >= gr.min_score 
    AND avg_score <= gr.max_score
    AND gr.total_marks = 15
  ORDER BY gr.min_score DESC
  LIMIT 1;
END;
$$;