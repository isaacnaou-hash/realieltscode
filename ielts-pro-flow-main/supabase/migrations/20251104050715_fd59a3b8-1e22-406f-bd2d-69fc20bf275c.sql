-- Drop existing grading rubric data and restructure for 0-100 scale
DELETE FROM grading_rubric;

-- Insert new grading rubric for 0-100 scale (same for all sections)
INSERT INTO grading_rubric (min_score, max_score, cefr_level, ielts_band, performance_summary, total_marks) VALUES
-- A0 level
(0, 10, 'A0', '0-1.0', 'Novice - No meaningful understanding or production demonstrated.', 100),
-- A1 level  
(11, 20, 'A1', '1.5-2.5', 'Beginner - Very limited understanding; can recognize isolated words or produce memorized phrases.', 100),
-- A2 level
(21, 40, 'A2', '3.0-4.0', 'Elementary - Basic understanding of simple topics; can express simple ideas with frequent errors.', 100),
-- B1 level
(41, 50, 'B1', '4.5-5.5', 'Intermediate - Adequate understanding of familiar topics; can express opinions and main ideas with some limitations.', 100),
-- B2 level
(51, 70, 'B2', '6.0-7.0', 'Upper Intermediate - Good understanding of complex texts; can produce clear, detailed responses with occasional errors.', 100),
-- C1 level
(71, 85, 'C1', '7.5-8.5', 'Advanced - Strong comprehension of complex material; can express ideas fluently and spontaneously with minor errors.', 100),
-- C2 level
(86, 100, 'C2', '9.0', 'Proficient - Exceptional mastery; precise understanding and near-native fluency in all contexts.', 100);

-- Update the get_cefr_level function to work with 0-100 scale
CREATE OR REPLACE FUNCTION public.get_cefr_level(score numeric, total_marks integer DEFAULT 100)
RETURNS TABLE(cefr_level text, ielts_band text, performance_summary text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    AND gr.total_marks = 100
  ORDER BY gr.min_score DESC
  LIMIT 1;
END;
$$;

-- Update calculate_overall_cefr to work with 0-100 scale (average of 4 sections)
CREATE OR REPLACE FUNCTION public.calculate_overall_cefr(
  listening_score numeric, 
  reading_score numeric, 
  writing_score numeric, 
  speaking_score numeric
)
RETURNS TABLE(overall_cefr text, overall_ielts_band text, overall_performance text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  avg_score NUMERIC;
BEGIN
  -- Calculate average score (all sections now out of 100)
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
    AND gr.total_marks = 100
  ORDER BY gr.min_score DESC
  LIMIT 1;
END;
$$;