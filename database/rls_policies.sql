-- ============================================================
-- EngineerCopilot AI — Row Level Security Policies
-- Run AFTER schema.sql
-- ============================================================

-- Enable RLS on all user-owned tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_cover_letters ENABLE ROW LEVEL SECURITY;

-- Jobs and job_categories are publicly readable (no RLS needed)

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "profiles_select_own" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- USER SKILLS
-- ============================================================
CREATE POLICY "user_skills_select_own" ON user_skills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_skills_insert_own" ON user_skills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_skills_update_own" ON user_skills
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_skills_delete_own" ON user_skills
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER EDUCATION
-- ============================================================
CREATE POLICY "user_education_select_own" ON user_education
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_education_insert_own" ON user_education
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_education_update_own" ON user_education
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_education_delete_own" ON user_education
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER EXPERIENCE
-- ============================================================
CREATE POLICY "user_experience_select_own" ON user_experience
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_experience_insert_own" ON user_experience
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_experience_update_own" ON user_experience
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_experience_delete_own" ON user_experience
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER PROJECTS
-- ============================================================
CREATE POLICY "user_projects_select_own" ON user_projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_projects_insert_own" ON user_projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_projects_update_own" ON user_projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_projects_delete_own" ON user_projects
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- USER CERTIFICATIONS
-- ============================================================
CREATE POLICY "user_certifications_select_own" ON user_certifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_certifications_insert_own" ON user_certifications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_certifications_update_own" ON user_certifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_certifications_delete_own" ON user_certifications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE POLICY "applications_select_own" ON applications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "applications_insert_own" ON applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "applications_update_own" ON applications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "applications_delete_own" ON applications
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SAVED JOBS
-- ============================================================
CREATE POLICY "saved_jobs_select_own" ON saved_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_jobs_insert_own" ON saved_jobs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_jobs_delete_own" ON saved_jobs
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- GENERATED RESUMES
-- ============================================================
CREATE POLICY "generated_resumes_select_own" ON generated_resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "generated_resumes_insert_own" ON generated_resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_resumes_delete_own" ON generated_resumes
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- GENERATED COVER LETTERS
-- ============================================================
CREATE POLICY "generated_cover_letters_select_own" ON generated_cover_letters
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "generated_cover_letters_insert_own" ON generated_cover_letters
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "generated_cover_letters_delete_own" ON generated_cover_letters
    FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- SUPABASE STORAGE POLICIES
-- ============================================================
-- Create storage bucket for resumes (run in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('generated-pdfs', 'generated-pdfs', false);

-- Storage policies (example for 'resumes' bucket)
-- CREATE POLICY "Users can upload own resumes" ON storage.objects
--     FOR INSERT WITH CHECK (
--         bucket_id = 'resumes' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );
-- CREATE POLICY "Users can read own resumes" ON storage.objects
--     FOR SELECT USING (
--         bucket_id = 'resumes' AND
--         auth.uid()::text = (storage.foldername(name))[1]
--     );
