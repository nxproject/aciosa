CREATE TABLE IF NOT EXISTS volunteers (
  volunteer_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(40) NULL,
  age_range VARCHAR(40) NULL,
  interests JSON NULL,
  availability TEXT NOT NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
