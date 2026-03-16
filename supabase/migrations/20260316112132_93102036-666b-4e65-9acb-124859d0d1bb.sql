-- Make campaign_id nullable since we now use seo_project_id as the primary link
ALTER TABLE public.seo_keywords ALTER COLUMN campaign_id DROP NOT NULL;

-- Fix orphaned keywords: clear any with no project link
DELETE FROM public.seo_keywords WHERE seo_project_id IS NULL;