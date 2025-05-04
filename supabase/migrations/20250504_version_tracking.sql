
-- Create a table to track app versions
CREATE TABLE IF NOT EXISTS app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  release_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  changes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Insert initial version data
INSERT INTO app_versions (version, release_date, changes, created_by)
VALUES (
  '1.0.0', 
  now(), 
  '[
    "Первоначальный релиз приложения",
    "Реализована базовая функциональность Telegram-бота",
    "Добавлена админ-панель управления",
    "Исправлены ошибки в создании сборов"
  ]'::jsonb,
  'system'
);

-- Add index for easier version lookup
CREATE INDEX IF NOT EXISTS idx_app_versions_version ON app_versions (version);
