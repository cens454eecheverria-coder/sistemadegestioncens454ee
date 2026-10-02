-- Agregar columnas nacionalidad y lugar_nacimiento
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS nacionalidad TEXT DEFAULT 'Argentina';
ALTER TABLE estudiantes ADD COLUMN IF NOT EXISTS lugar_nacimiento TEXT;
UPDATE estudiantes SET lugar_nacimiento = ciudad_nacimiento WHERE lugar_nacimiento IS NULL AND ciudad_nacimiento IS NOT NULL;
UPDATE estudiantes SET nacionalidad = 'Argentina' WHERE nacionalidad IS NULL;

ALTER TABLE preinscripciones ADD COLUMN IF NOT EXISTS nacionalidad TEXT DEFAULT 'Argentina';
ALTER TABLE preinscripciones ADD COLUMN IF NOT EXISTS lugar_nacimiento TEXT;

NOTIFY pgrst, 'reload schema';
