CREATE TABLE IF NOT EXISTS projects (
  project_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(80) NOT NULL,
  schedule_type VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  detail_icon VARCHAR(80) NOT NULL,
  detail_text VARCHAR(160) NOT NULL,
  image_url TEXT NOT NULL,
  image_alt TEXT NOT NULL,
  location VARCHAR(120) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO projects (title, category, schedule_type, description, detail_icon, detail_text, image_url, image_alt, location)
SELECT 'Reforestación en Guanacaste', 'Ambiente', 'Fecha específica', 'Ayúdanos a restaurar los manglares de la costa pacífica. Un día completo de trabajo en equipo bajo el sol, devolviendo la vida a nuestro ecosistema.', 'calendar_today', '15 de Mayo, 2024', 'https://lh3.googleusercontent.com/aida-public/AB6AXuALFeBZF4nxXGkOvI3IAVG3TdCZUwLKWY2NmY0NS4KaLYQrXq-Dsxo8wKQLwaVzByjsZmhypzobMnkPd_BE6DXn-69WfLATuekQgHcoOvt-kAoBgGkQ8mBgY1LGLC2UjoaVS5CZJmuJ7Ovoexs900j0lm8CICf6bvgk8jykTfIsX7KhltJmNFKQXlIzOaGX-4WjZCJoHj3r2IIBE21M7e_c-SIFmbAe4YPAHKog--f01U4xoWBfNS-2DYTpleDjyADow2PvoltdFnWA', 'A lush, vibrant coastal landscape in Guanacaste, Costa Rica, during a golden hour sunset. A diverse group of young and elderly volunteers are actively planting mangrove saplings along a pristine shoreline.', 'Guanacaste'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Reforestación en Guanacaste');

INSERT INTO projects (title, category, schedule_type, description, detail_icon, detail_text, image_url, image_alt, location)
SELECT 'Clases de inglés para jóvenes', 'Educación', 'Recurrente', 'Brinda herramientas para el futuro. Buscamos tutores para sesiones semanales presenciales o virtuales para estudiantes de secundaria.', 'schedule', 'Sábados 9:00 AM - 11:00 AM', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBWokg4hvEZdkwKzOSLSLWMjhpsjZptqJ9d6115viat6gZFecpIHL4dKho55ygCjPZ8Mh1PI3G_JV3Yj065mwDsDn4ZpabDdmAUhrGkrZ5RUMkwkB3ngIEUbzZQxjtXWJXk4S3f-ySIbnBACT3d5L0IoPgfaX_Rki2_IK_VepZKoUvLy41DeCBxOsHkGjy1j49ATBqTT2jGqEdnBgu4_gg4pUBodIcz3Vl7WV4zPPIubPv4UWswbWmaHdRXI3NeRRq-4NsAuUhDyZC1', 'A bright and airy community center classroom in a rural Costa Rican town with a volunteer tutoring students.', 'San José'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Clases de inglés para jóvenes');

INSERT INTO projects (title, category, schedule_type, description, detail_icon, detail_text, image_url, image_alt, location)
SELECT 'Apoyo en comedores locales', 'Social', 'Recurrente', 'Acompaña a las familias de San José. Participa en la preparación y entrega de almuerzos nutritivos en nuestro centro comunitario.', 'restaurant', 'Diario (Lunes a Viernes)', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBCsdE7Pj7aRF8FN_I0SvLGq_QgGpYuEYua1N_14wF3u1LyKgd2avZF-_B8Mjt3PwJr5A9RTByRCwEW7kNBMPVvnAEFDDtZY4kNFBHgfGkQqnHstmWkrFGomwo7KbGur8Og-yPoDHvzO6t8FCy6jbt6GW-w2Dbt-LXXwH03OskTCBOmHHM2zeRFvmxTdAyDjFWzj5Q1T9YP0wCjydycHXZ-Xz7dely-Yq5dAWzsYEYkR8p77ZidOmbWCfKw_yTSe-w-gabaXwZ2k2Id', 'A welcoming local community kitchen in San Jose, Costa Rica, with volunteers serving food.', 'San José'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Apoyo en comedores locales');

INSERT INTO projects (title, category, schedule_type, description, detail_icon, detail_text, image_url, image_alt, location)
SELECT 'Limpieza de Playas Puntarenas', 'Ambiente', 'Fecha específica', 'Un pequeño gesto para un gran impacto. Únete a nuestra jornada masiva de recolección de microplásticos y limpieza de costas.', 'waves', '08 de Junio, 2024', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsfj9RvGEQJbaMFaL8qkol6m52ZHGl9l3ko73HWQOxlLZEIzDWkFG-O9iyTbIsFUc_VX-EiN08Uk1oTvl72tvvOBKCwf9y4mVKwrqyqe6tiAwraa6OzsNO8edF43XzSRCHW_5mR5hisFOhjjp2j5rlsgGfyIFT_hZlJ-A_pq6VxAyPb8ZlsW5ARSd2Z9AroKj_wIhF6rEEi71CSErq9yhXiNVAtLvTrtPWQReM2kx55K-33nfSQuabrFpghgzsIdUWThtVjbBa9-Ip', 'A bright shot of volunteers cleaning a beach in Puntarenas, Costa Rica.', 'Puntarenas'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Limpieza de Playas Puntarenas');
