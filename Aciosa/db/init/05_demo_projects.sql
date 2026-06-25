INSERT INTO projects
  (title, category, schedule_type, description, detail_icon, detail_text, image_url, image_alt, location, event_date, event_time, volunteers_needed, age_range, equipment, physical_requirements, status)
SELECT * FROM (
  SELECT 'Huerta Comunitaria en Heredia' AS title, 'Ambiente' AS category, 'Fecha especifica' AS schedule_type,
         'Acompaña a vecinos en la preparación de camas de cultivo, siembra de hortalizas y organización de compostaje para una huerta comunal.' AS description,
         'eco' AS detail_icon, '12 de Julio, 2026' AS detail_text, 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80' AS image_url,
         'Voluntarios trabajando en una huerta comunitaria con plantas verdes.' AS image_alt, 'Heredia' AS location, '2026-07-12' AS event_date, '08:00:00' AS event_time, 18 AS volunteers_needed, '18+' AS age_range,
         'Ropa cómoda, gorra, botella de agua y guantes.' AS equipment, JSON_ARRAY('Esfuerzo Moderado') AS physical_requirements, 'published' AS status
  UNION ALL SELECT 'Taller de Lectura para Niñez', 'Educación', 'Recurrente',
         'Facilita cuentos, dinámicas de comprensión lectora y juegos educativos para niños de primaria en un centro comunitario.',
         'menu_book', 'Miércoles 3:00 PM - 5:00 PM', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80',
         'Niños leyendo libros en una biblioteca luminosa.', 'Cartago', NULL, '15:00:00', 10, '16+',
         'Cuaderno, lápices de color y mucha paciencia.', JSON_ARRAY('Esfuerzo Leve'), 'published'
  UNION ALL SELECT 'Brigada de Salud en Alajuela', 'Salud', 'Fecha especifica',
         'Apoya la logística de una jornada de presión arterial, orientación preventiva y acompañamiento a adultos mayores.',
         'health_and_safety', '26 de Julio, 2026', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
         'Equipo de salud atendiendo a una persona mayor en una jornada comunitaria.', 'Alajuela', '2026-07-26', '09:00:00', 14, '18+',
         'Zapatos cerrados y disponibilidad para estar de pie.', JSON_ARRAY('Esfuerzo Leve','Accesible para Silla de Ruedas'), 'published'
  UNION ALL SELECT 'Festival Cultural Barrial', 'Cultura', 'Fecha especifica',
         'Colabora con montaje, bienvenida de artistas, apoyo en talleres de pintura y registro de participantes durante un festival local.',
         'palette', '9 de Agosto, 2026', 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
         'Personas disfrutando un festival cultural al aire libre.', 'San José', '2026-08-09', '10:00:00', 22, '16+',
         'Ropa cómoda y actitud de servicio.', JSON_ARRAY('Esfuerzo Moderado'), 'published'
  UNION ALL SELECT 'Cuidado en Refugio Animal', 'Animales', 'Recurrente',
         'Ayuda con limpieza de áreas, socialización de perros y gatos, preparación de alimento y apoyo en pequeñas tareas de mantenimiento.',
         'pets', 'Domingos 8:00 AM - 12:00 MD', 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&w=1200&q=80',
         'Voluntaria acariciando perros en un refugio animal.', 'Escazú', NULL, '08:00:00', 12, '18+',
         'Ropa que pueda ensuciarse y zapatos cerrados.', JSON_ARRAY('Esfuerzo Moderado'), 'published'
  UNION ALL SELECT 'Entrega de Diarios a Familias', 'Social', 'Fecha especifica',
         'Organiza paquetes de alimentos y participa en rutas de entrega para familias priorizadas por líderes comunitarios.',
         'volunteer_activism', '18 de Julio, 2026', 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
         'Voluntarios organizando bolsas de alimentos para entrega comunitaria.', 'Desamparados', '2026-07-18', '07:30:00', 20, '18+',
         'Zapatos cómodos y disponibilidad para caminar.', JSON_ARRAY('Esfuerzo Moderado'), 'published'
  UNION ALL SELECT 'Limpieza del Río Torres', 'Ambiente', 'Fecha especifica',
         'Participa en clasificación de residuos, limpieza de senderos cercanos al río y educación ambiental con vecinos de la zona.',
         'water_drop', '2 de Agosto, 2026', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=1200&q=80',
         'Grupo de voluntarios recogiendo residuos cerca de un río.', 'San José', '2026-08-02', '08:30:00', 25, '18+',
         'Guantes, gorra, bloqueador y botella reutilizable.', JSON_ARRAY('Esfuerzo Moderado'), 'published'
  UNION ALL SELECT 'Mentoría Digital para Emprendedores', 'Educación', 'Recurrente',
         'Acompaña a emprendedores locales en herramientas básicas de correo, redes sociales, hojas de cálculo y ventas digitales.',
         'computer', 'Jueves 6:00 PM - 8:00 PM', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
         'Personas trabajando juntas frente a computadoras portátiles.', 'Virtual', NULL, '18:00:00', 8, '18+',
         'Computadora con conexión a internet.', JSON_ARRAY('Esfuerzo Leve','Accesible para Silla de Ruedas'), 'published'
) AS demo
WHERE NOT EXISTS (
  SELECT 1 FROM projects existing WHERE existing.title = demo.title
);

INSERT IGNORE INTO project_interests (project_id, interest_id)
SELECT p.project_id, i.interest_id
FROM projects p
JOIN interests i ON i.name = p.category
WHERE p.title IN (
  'Huerta Comunitaria en Heredia',
  'Taller de Lectura para Niñez',
  'Brigada de Salud en Alajuela',
  'Festival Cultural Barrial',
  'Cuidado en Refugio Animal',
  'Entrega de Diarios a Familias',
  'Limpieza del Río Torres',
  'Mentoría Digital para Emprendedores'
);

INSERT IGNORE INTO project_interests (project_id, interest_id)
SELECT p.project_id, i.interest_id
FROM projects p
JOIN interests i ON i.name = 'Social'
WHERE p.title IN ('Brigada de Salud en Alajuela', 'Festival Cultural Barrial', 'Mentoría Digital para Emprendedores');
