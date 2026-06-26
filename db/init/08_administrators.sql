CREATE TABLE IF NOT EXISTS administrators (
  administrator_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO administrators (name, phone)
SELECT 'Administrador Demo', '8888 0000'
WHERE NOT EXISTS (
  SELECT 1 FROM administrators WHERE phone = '8888 0000'
);

INSERT INTO administrators (name, phone)
SELECT 'Jose Gonzalez', '6270 8821'
WHERE NOT EXISTS (
  SELECT 1 FROM administrators WHERE phone = '6270 8821'
);
