-- Create table for writing grading criteria
CREATE TABLE IF NOT EXISTS public.writing_grading_criteria (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  criterion_name text NOT NULL,
  criterion_description text NOT NULL,
  weight_percentage integer NOT NULL DEFAULT 25,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.writing_grading_criteria ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the grading criteria
CREATE POLICY "Anyone can view writing grading criteria"
ON public.writing_grading_criteria
FOR SELECT
USING (true);

-- Prevent modifications by regular users
CREATE POLICY "Only admins can modify writing grading criteria"
ON public.writing_grading_criteria
FOR ALL
USING (false);

-- Insert the four criteria
INSERT INTO public.writing_grading_criteria (criterion_name, criterion_description, weight_percentage) VALUES
('Task Response', 'How well the essay answers the question, develops ideas, and supports arguments with examples and evidence.', 25),
('Coherence and Cohesion', 'The logical flow of ideas, clear structure, and effective use of linking words or transitions.', 25),
('Lexical Resource', 'Range and accuracy of vocabulary; appropriate tone and variety in word choice.', 25),
('Grammatical Range and Accuracy', 'Range and correctness of grammar, sentence structures, punctuation, and syntax.', 25);

-- Create table for writing IELTS-CEFR mapping
CREATE TABLE IF NOT EXISTS public.writing_ielts_cefr_mapping (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ielts_band_min numeric NOT NULL,
  ielts_band_max numeric NOT NULL,
  cefr_level text NOT NULL,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.writing_ielts_cefr_mapping ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view the mapping
CREATE POLICY "Anyone can view writing IELTS-CEFR mapping"
ON public.writing_ielts_cefr_mapping
FOR SELECT
USING (true);

-- Prevent modifications by regular users
CREATE POLICY "Only admins can modify writing IELTS-CEFR mapping"
ON public.writing_ielts_cefr_mapping
FOR ALL
USING (false);

-- Insert the IELTS-CEFR mapping for writing
INSERT INTO public.writing_ielts_cefr_mapping (ielts_band_min, ielts_band_max, cefr_level, description) VALUES
(9.0, 9.0, 'C2', 'Fully operational command of the language; precise, coherent, and sophisticated writing.'),
(8.0, 8.5, 'C1', 'Handles complex ideas well; produces clear, well-structured, detailed text on challenging topics.'),
(7.0, 7.5, 'C1', 'Communicates effectively in academic contexts; occasional slips but maintains clarity and cohesion.'),
(6.0, 6.5, 'B2', 'Conveys main ideas clearly; some lapses in coherence or vocabulary range.'),
(5.0, 5.5, 'B1', 'Can produce simple text with limited complexity; struggles with coherence or precision.');