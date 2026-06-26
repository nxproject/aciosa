ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS event_date DATE NULL,
  ADD COLUMN IF NOT EXISTS event_time TIME NULL,
  ADD COLUMN IF NOT EXISTS volunteers_needed INT NULL,
  ADD COLUMN IF NOT EXISTS age_range VARCHAR(120) NULL,
  ADD COLUMN IF NOT EXISTS equipment TEXT NULL,
  ADD COLUMN IF NOT EXISTS physical_requirements JSON NULL,
  ADD COLUMN IF NOT EXISTS status VARCHAR(40) NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

UPDATE projects
SET
  event_date = COALESCE(event_date, CASE
    WHEN title = 'Reforestación en Guanacaste' THEN '2024-05-15'
    WHEN title = 'Limpieza de Playas Puntarenas' THEN '2024-06-08'
    ELSE NULL
  END),
  event_time = COALESCE(event_time, CASE
    WHEN title = 'Clases de inglés para jóvenes' THEN '09:00:00'
    ELSE event_time
  END),
  volunteers_needed = COALESCE(volunteers_needed, CASE
    WHEN title = 'Reforestación en Guanacaste' THEN 12
    WHEN title = 'Clases de inglés para jóvenes' THEN 8
    WHEN title = 'Apoyo en comedores locales' THEN 10
    WHEN title = 'Limpieza de Playas Puntarenas' THEN 20
    ELSE 5
  END),
  age_range = COALESCE(age_range, 'Todas las edades'),
  equipment = COALESCE(equipment, CASE
    WHEN category = 'Ambiente' THEN 'Ropa cómoda, zapatos cerrados, protector solar y botella de agua reutilizable.'
    WHEN category = 'Educación' THEN 'Computadora portátil opcional, cuaderno y materiales de apoyo.'
    ELSE 'Ropa cómoda y actitud colaborativa.'
  END),
  physical_requirements = COALESCE(physical_requirements, JSON_ARRAY('Esfuerzo Moderado')),
  status = COALESCE(status, 'published');
