CREATE TABLE IF NOT EXISTS interests (
  interest_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS volunteer_interests (
  volunteer_id INT NOT NULL,
  interest_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (volunteer_id, interest_id),
  CONSTRAINT fk_volunteer_interests_volunteer
    FOREIGN KEY (volunteer_id) REFERENCES volunteers(volunteer_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_volunteer_interests_interest
    FOREIGN KEY (interest_id) REFERENCES interests(interest_id)
    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS project_interests (
  project_id INT NOT NULL,
  interest_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, interest_id),
  CONSTRAINT fk_project_interests_project
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_project_interests_interest
    FOREIGN KEY (interest_id) REFERENCES interests(interest_id)
    ON DELETE RESTRICT
);

INSERT INTO interests (name, display_order)
SELECT 'Ambiente', 1
WHERE NOT EXISTS (SELECT 1 FROM interests WHERE name = 'Ambiente');

INSERT INTO interests (name, display_order)
SELECT 'Educación', 2
WHERE NOT EXISTS (SELECT 1 FROM interests WHERE name = 'Educación');

INSERT INTO interests (name, display_order)
SELECT 'Salud', 3
WHERE NOT EXISTS (SELECT 1 FROM interests WHERE name = 'Salud');

INSERT INTO interests (name, display_order)
SELECT 'Cultura', 4
WHERE NOT EXISTS (SELECT 1 FROM interests WHERE name = 'Cultura');

INSERT INTO interests (name, display_order)
SELECT 'Animales', 5
WHERE NOT EXISTS (SELECT 1 FROM interests WHERE name = 'Animales');

INSERT INTO interests (name, display_order)
SELECT 'Social', 6
WHERE NOT EXISTS (SELECT 1 FROM interests WHERE name = 'Social');

INSERT IGNORE INTO project_interests (project_id, interest_id)
SELECT p.project_id, i.interest_id
FROM projects p
JOIN interests i ON i.name = p.category;
