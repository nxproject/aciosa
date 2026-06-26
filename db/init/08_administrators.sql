CREATE TABLE IF NOT EXISTS administrators (
  administrator_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real administrator names and phone numbers are NOT stored in source control.
-- Seed them at runtime via the SEED_ADMINISTRATORS environment variable
-- (see .env.example). A single non-personal demo admin is created here so a
-- fresh database is usable out of the box; replace or remove it for production.
INSERT INTO administrators (name, phone)
SELECT 'Administrador Demo', '8888 0000'
WHERE NOT EXISTS (
  SELECT 1 FROM administrators WHERE phone = '8888 0000'
);
