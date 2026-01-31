-- Storyforge Supabase Schema
-- Run this in Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  template TEXT NOT NULL DEFAULT 'web-novel',
  terminology JSONB NOT NULL DEFAULT '{"volume": "권", "chapter": "화", "scene": "씬"}',
  genre TEXT[] DEFAULT '{}',
  target_platform TEXT,
  target_length INTEGER,
  stats JSONB NOT NULL DEFAULT '{"totalCharCount": 0, "totalCharCountWithSpaces": 0, "volumeCount": 0, "chapterCount": 0, "sceneCount": 0}',
  sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- VOLUMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS volumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CHAPTERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  volume_id UUID NOT NULL REFERENCES volumes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  target_length INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- SCENES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scenes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  sort_order INTEGER NOT NULL DEFAULT 0,
  stats JSONB NOT NULL DEFAULT '{"charCount": 0, "charCountWithSpaces": 0}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- WORLDBUILDING CARDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS world_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL, -- 'character', 'location', 'item'
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  data JSONB NOT NULL DEFAULT '{}', -- Type-specific fields
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- VERSIONS TABLE (for version history sync)
-- ============================================
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'auto-save',
  char_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_volumes_project_id ON volumes(project_id);
CREATE INDEX IF NOT EXISTS idx_chapters_volume_id ON chapters(volume_id);
CREATE INDEX IF NOT EXISTS idx_chapters_project_id ON chapters(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_chapter_id ON scenes(chapter_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_world_cards_project_id ON world_cards(project_id);
CREATE INDEX IF NOT EXISTS idx_versions_scene_id ON versions(scene_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE volumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Volumes: Access through project ownership
CREATE POLICY "Users can access volumes via project" ON volumes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = volumes.project_id AND projects.user_id = auth.uid()
    )
  );

-- Chapters: Access through project ownership
CREATE POLICY "Users can access chapters via project" ON chapters
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = chapters.project_id AND projects.user_id = auth.uid()
    )
  );

-- Scenes: Access through project ownership
CREATE POLICY "Users can access scenes via project" ON scenes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()
    )
  );

-- World Cards: Access through project ownership
CREATE POLICY "Users can access world_cards via project" ON world_cards
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = world_cards.project_id AND projects.user_id = auth.uid()
    )
  );

-- Versions: Access through project ownership
CREATE POLICY "Users can access versions via project" ON versions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = versions.project_id AND projects.user_id = auth.uid()
    )
  );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volumes_updated_at BEFORE UPDATE ON volumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_world_cards_updated_at BEFORE UPDATE ON world_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
