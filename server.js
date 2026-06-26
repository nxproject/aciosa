const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const port = Number(process.env.PORT) || 3000;
const publicDir = path.join(__dirname, 'public');
const openWa = {
  enabled: String(process.env.OPENWA_ENABLED || '').toLowerCase() === 'true',
  apiUrl: String(process.env.OPENWA_API_URL || 'http://openwa:8080').replace(/\/+$/, ''),
  apiKey: process.env.OPENWA_API_KEY || '',
};

const routes = new Map([
  ['/', 'inicio_pura_vida_voluntarios/code.html'],
  ['/registro', 'nete_como_voluntario/code.html'],
  ['/quienes-somos', 'qui_nes_somos_nuestra_misi_n/code.html'],
  ['/admin', 'gesti_n_de_proyectos_panel_de_administraci_n/code.html'],
]);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const db = mysql.createPool({
  host: process.env.DB_HOST || 'mariadb',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'aciosa',
  user: process.env.DB_USER || 'aciosa',
  password: process.env.DB_PASSWORD || 'aciosa_password',
  waitForConnections: true,
  connectionLimit: 5,
});

function normalizeWhatsAppTo(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.includes('@')) return raw;
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? `${digits}@c.us` : '';
}

async function openWaRequest(pathname, payload) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (openWa.apiKey) {
    headers['X-API-Key'] = openWa.apiKey;
    headers.Authorization = `Bearer ${openWa.apiKey}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  let response;
  try {
    response = await fetch(`${openWa.apiUrl}${pathname}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  const text = await response.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // Keep the raw OpenWA response for diagnostics.
  }

  if (!response.ok) {
    const error = new Error(`OpenWA request failed with status ${response.status}`);
    error.statusCode = response.status;
    error.body = body;
    throw error;
  }

  return body;
}

async function sendWhatsAppText(to, message) {
  const chatId = normalizeWhatsAppTo(to);
  if (!openWa.enabled) {
    return { ok: false, skipped: true, reason: 'OpenWA is disabled.' };
  }
  if (!chatId) {
    return { ok: false, skipped: true, reason: 'No WhatsApp number was provided.' };
  }

  const attempts = [
    { to: chatId, content: message },
    { args: { to: chatId, content: message } },
    { args: [chatId, message] },
  ];

  let lastError;
  for (const payload of attempts) {
    try {
      const result = await openWaRequest('/sendText', payload);
      return { ok: true, chatId, result };
    } catch (error) {
      lastError = error;
    }
  }

  return {
    ok: false,
    chatId,
    error: lastError?.message || 'OpenWA did not accept the sendText request.',
    detail: lastError?.body,
  };
}

async function sendVolunteerWelcome(volunteer) {
  const message = [
    `Hola ${volunteer.fullName}, ¡pura vida!`,
    'Gracias por registrarte en Pura Vida y Mas.',
    volunteer.interests.length
      ? `Tus intereses guardados son: ${volunteer.interests.join(', ')}.`
      : 'Ya tenemos tu registro guardado.',
    'Te contactaremos cuando haya proyectos que calcen contigo.',
  ].join('\n');

  return sendWhatsAppText(volunteer.phone, message);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function categoryClass(category) {
  const normalized = String(category).toLowerCase();
  if (normalized.includes('educ')) return 'bg-tertiary text-on-tertiary';
  if (normalized.includes('social')) return 'bg-secondary-container text-on-secondary-container';
  return 'bg-secondary text-on-secondary';
}

function scheduleClass(scheduleType) {
  return String(scheduleType).toLowerCase().includes('recurrente')
    ? 'bg-surface/90 text-secondary'
    : 'bg-surface/90 text-primary';
}

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function renderInterestBadge(interest) {
  return `<span class="${categoryClass(interest)} px-sm py-xs rounded-lg text-label-bold font-label-bold">${escapeHtml(interest)}</span>`;
}

function renderProjectCard(project) {
  const interests = splitList(project.interests);
  const badges = (interests.length ? interests : [project.category]).map(renderInterestBadge).join('\n');
  return `
<article class="bg-surface-container-low rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group" data-project-id="${escapeHtml(project.project_id)}">
<div class="h-64 overflow-hidden relative">
<div class="absolute top-sm left-sm z-10 flex gap-xs">
${badges}
<span class="${scheduleClass(project.schedule_type)} px-sm py-xs rounded-lg text-label-bold font-label-bold shadow-sm">${escapeHtml(project.schedule_type)}</span>
</div>
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" data-alt="${escapeHtml(project.image_alt)}" src="${escapeHtml(project.image_url)}"/>
</div>
<div class="p-md space-y-sm">
<h3 class="font-headline-md text-headline-md text-on-surface">${escapeHtml(project.title)}</h3>
<p class="text-on-surface-variant line-clamp-3">${escapeHtml(project.description)}</p>
<div class="flex items-center gap-xs text-outline font-label-bold">
<span class="material-symbols-outlined">${escapeHtml(project.detail_icon)}</span>
<span>${escapeHtml(project.detail_text)}</span>
</div>
<a href="/proyectos/${encodeURIComponent(project.project_id)}" class="block text-center w-full mt-md bg-primary text-on-primary py-sm rounded-xl font-button-text text-button-text hover:bg-primary-container transition-colors">Ver detalles</a>
</div>
</article>`;
}

function projectToApi(project) {
  return {
    project_id: project.project_id,
    title: project.title,
    category: project.category,
    schedule_type: project.schedule_type,
    description: project.description,
    detail_icon: project.detail_icon,
    detail_text: project.detail_text,
    image_url: project.image_url,
    image_alt: project.image_alt,
    location: project.location,
    event_date: project.event_date ? new Date(project.event_date).toISOString().slice(0, 10) : null,
    event_time: project.event_time ? String(project.event_time).slice(0, 5) : null,
    interests: splitList(project.interests),
    match_score: Number(project.match_score || 0),
  };
}

async function getVolunteerByEmail(email) {
  const [volunteers] = await db.query(
    `SELECT v.volunteer_id, v.full_name, v.email,
            GROUP_CONCAT(i.name ORDER BY i.name SEPARATOR ',') AS interests
       FROM volunteers v
       LEFT JOIN volunteer_interests vi ON vi.volunteer_id = v.volunteer_id
       LEFT JOIN interests i ON i.interest_id = vi.interest_id
      WHERE LOWER(v.email) = LOWER(?)
      GROUP BY v.volunteer_id
      ORDER BY v.volunteer_id DESC
      LIMIT 1`,
    [email]
  );

  return volunteers[0] || null;
}

async function getMatchedProjectsForVolunteer(volunteerId) {
  const [projects] = await db.query(
    `SELECT p.project_id, p.title, p.category, p.schedule_type, p.description,
            p.detail_icon, p.detail_text, p.image_url, p.image_alt, p.location,
            p.event_date, p.event_time,
            GROUP_CONCAT(DISTINCT i.name ORDER BY i.name SEPARATOR ',') AS interests,
            COUNT(DISTINCT matched_pi.interest_id) AS match_score
       FROM projects p
       INNER JOIN project_interests matched_pi ON matched_pi.project_id = p.project_id
       INNER JOIN volunteer_interests vi
               ON vi.interest_id = matched_pi.interest_id
              AND vi.volunteer_id = ?
       LEFT JOIN project_interests pi ON pi.project_id = p.project_id
       LEFT JOIN interests i ON i.interest_id = pi.interest_id
      WHERE COALESCE(p.status, 'published') = 'published'
        AND (p.event_date IS NULL OR p.event_date >= CURDATE())
      GROUP BY p.project_id
      ORDER BY match_score DESC, p.event_date IS NULL, p.event_date ASC, p.title ASC
      LIMIT 12`,
    [volunteerId]
  );

  return projects.map(projectToApi);
}

async function renderProjectsPage() {
  const templatePath = path.join(publicDir, 'proyectos_de_voluntariado/code.html');
  const template = await fs.promises.readFile(templatePath, 'utf8');
  const [projects] = await db.query(
    `SELECT p.project_id, p.title, p.category, p.schedule_type, p.description, p.detail_icon,
            p.detail_text, p.image_url, p.image_alt, p.location,
            GROUP_CONCAT(i.name ORDER BY i.name SEPARATOR ',') AS interests
       FROM projects p
       LEFT JOIN project_interests pi ON pi.project_id = p.project_id
       LEFT JOIN interests i ON i.interest_id = pi.interest_id
      GROUP BY p.project_id
      ORDER BY RAND()
      LIMIT 4`
  );

  const cards = projects.map(renderProjectCard).join('\n');
  return template.replace(
    /<section class="bento-grid">[\s\S]*?<\/section>\s*<!-- CTA Section -->/,
    `<section class="bento-grid">\n${cards}\n</section>\n<!-- CTA Section -->`
  );
}

function renderAdminProjectRow(project) {
  const interests = splitList(project.interests);
  const primaryInterest = interests[0] || project.category || 'Proyecto';
  const status = project.status === 'draft' ? 'Borrador' : 'Publicado';
  const statusClass = project.status === 'draft' ? 'text-secondary' : 'text-primary';
  const statusDotClass = project.status === 'draft' ? 'bg-secondary' : 'bg-primary animate-pulse';
  const createdAt = project.created_at ? new Date(project.created_at).toISOString().slice(0, 10) : 'Sin fecha';

  return `<tr class="hover:bg-surface-container-low transition-colors group">
<td class="px-md py-lg">
<div class="flex items-center gap-md">
<div class="w-12 h-12 rounded-lg bg-cover bg-center shrink-0" data-alt="${escapeHtml(project.image_alt || project.title)}" style="background-image: url('${escapeHtml(project.image_url || '')}')"></div>
<div>
<div class="font-label-bold text-body-lg text-on-surface">${escapeHtml(project.title)}</div>
<div class="text-sm text-on-surface-variant">Creado: ${escapeHtml(createdAt)}</div>
</div>
</div>
</td>
<td class="px-md py-lg">
${renderInterestBadge(primaryInterest)}
</td>
<td class="px-md py-lg text-on-surface font-body-md">${escapeHtml(project.location || 'Costa Rica')}</td>
<td class="px-md py-lg">
<div class="flex items-center gap-xs ${statusClass} font-bold">
<span class="w-2 h-2 rounded-full ${statusDotClass}"></span>
${escapeHtml(status)}
</div>
</td>
<td class="px-md py-lg text-right">
<div class="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
<a class="p-2 text-primary hover:bg-primary-container rounded-lg transition-all" title="Ver / Editar" href="/admin/proyectos/${encodeURIComponent(project.project_id)}/editar"><span class="material-symbols-outlined">edit</span></a>
</div>
</td>
</tr>`;
}

async function renderAdminPage() {
  const templatePath = path.join(publicDir, 'gesti_n_de_proyectos_panel_de_administraci_n/code.html');
  let html = await fs.promises.readFile(templatePath, 'utf8');
  const [[counts], [projects]] = await Promise.all([
    db.query(
      `SELECT
          (SELECT COUNT(*) FROM projects) AS project_count,
          (SELECT COUNT(*) FROM volunteers) AS volunteer_count,
          (SELECT COUNT(DISTINCT location) FROM projects WHERE location IS NOT NULL AND location <> '') AS location_count,
          (SELECT COUNT(*) FROM projects WHERE status = 'draft') AS pending_count`
    ),
    db.query(
      `SELECT p.project_id, p.title, p.category, p.location, p.status, p.image_url, p.image_alt, p.created_at,
              GROUP_CONCAT(i.name ORDER BY i.name SEPARATOR ',') AS interests
         FROM projects p
         LEFT JOIN project_interests pi ON pi.project_id = p.project_id
         LEFT JOIN interests i ON i.interest_id = pi.interest_id
        GROUP BY p.project_id
        ORDER BY p.project_id`
    ),
  ]);
  const stats = counts[0] || {};
  const rows = projects.map(renderAdminProjectRow).join('\n');

  html = html.replace(
    /<p class="font-headline-md text-headline-md text-primary">[\s\S]*?<\/p>/,
    `<p class="font-headline-md text-headline-md text-primary">${escapeHtml(stats.project_count || 0)}</p>`
  );
  html = html.replace(
    /<p class="font-headline-md text-headline-md text-tertiary">[\s\S]*?<\/p>/,
    `<p class="font-headline-md text-headline-md text-tertiary">${escapeHtml(stats.volunteer_count || 0)}</p>`
  );
  html = html.replace(
    /<p class="font-headline-md text-headline-md text-secondary">[\s\S]*?<\/p>/,
    `<p class="font-headline-md text-headline-md text-secondary">${escapeHtml(stats.location_count || 0)}</p>`
  );
  html = html.replace(
    /<p class="font-headline-md text-headline-md">[\s\S]*?<\/p>/,
    `<p class="font-headline-md text-headline-md">${escapeHtml(stats.pending_count || 0)}</p>`
  );
  html = html.replace(
    /<tbody class="divide-y divide-outline-variant">[\s\S]*?<\/tbody>/,
    `<tbody class="divide-y divide-outline-variant">\n${rows}\n</tbody>`
  );
  html = html.replace(
    /Mostrando 1 a 4 de 24 proyectos/,
    `Mostrando ${projects.length ? `1 a ${projects.length}` : '0'} de ${projects.length} proyectos`
  );

  return html;
}

async function getProjectById(projectId) {
  const [projects] = await db.query(
    `SELECT p.project_id, p.title, p.category, p.schedule_type, p.description, p.detail_icon,
            p.detail_text, p.image_url, p.image_alt, p.location,
            GROUP_CONCAT(i.name ORDER BY i.name SEPARATOR ',') AS interests
       FROM projects p
       LEFT JOIN project_interests pi ON pi.project_id = p.project_id
       LEFT JOIN interests i ON i.interest_id = pi.interest_id
      WHERE p.project_id = ?
      GROUP BY p.project_id
      LIMIT 1`,
    [projectId]
  );

  return projects[0];
}

function replaceFirst(source, pattern, replacement) {
  return source.replace(pattern, replacement);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error('Request body too large'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function formValue(formData, key) {
  return String(formData.get(key) || '').trim();
}

async function getInterests() {
  const [interests] = await db.query(
    `SELECT interest_id, name
       FROM interests
      WHERE is_active = 1
      ORDER BY display_order, name`
  );
  return interests;
}

function renderInterestOptions(interests) {
  return interests.map((interest) => {
    const id = `interest-${interest.interest_id}`;
    return `<label class="relative flex items-center gap-sm p-md rounded-xl border-2 border-outline-variant hover:bg-surface-container-high transition-colors cursor-pointer group" for="${escapeHtml(id)}">
<input class="w-6 h-6 text-primary rounded border-outline focus:ring-primary" id="${escapeHtml(id)}" name="interests" type="checkbox" value="${escapeHtml(interest.interest_id)}"/>
<span class="font-label-bold">${escapeHtml(interest.name)}</span>
</label>`;
  }).join('\n');
}

function renderProjectEditInterestOptions(interests, selectedInterestIds) {
  const selected = new Set(selectedInterestIds.map((id) => Number(id)));
  return interests.map((interest) => {
    const id = `project-interest-${interest.interest_id}`;
    const checked = selected.has(Number(interest.interest_id)) ? 'checked' : '';
    return `<label class="flex items-center gap-xs bg-surface-container px-md py-sm rounded-full cursor-pointer hover:bg-surface-container-high transition-colors" for="${escapeHtml(id)}">
<input class="rounded text-primary focus:ring-primary" id="${escapeHtml(id)}" name="interests" type="checkbox" value="${escapeHtml(interest.interest_id)}" ${checked}/>
<span class="font-body-md text-body-md">${escapeHtml(interest.name)}</span>
</label>`;
  }).join('\n');
}

async function renderRegistrationPage(prefillEmail = '') {
  const templatePath = path.join(publicDir, 'nete_como_voluntario/code.html');
  const template = await fs.promises.readFile(templatePath, 'utf8');
  const interests = await getInterests();
  const options = renderInterestOptions(interests);

  return template.replace(
    /<div class="grid grid-cols-2 md:grid-cols-3 gap-sm" data-interest-options>[\s\S]*?<\/div>\s*<\/div>\s*<!-- Step 3: Availability -->/,
    `<div class="grid grid-cols-2 md:grid-cols-3 gap-sm" data-interest-options>\n${options}\n</div>\n</div>\n<!-- Step 3: Availability -->`
  ).replace(
    /(<input[^>]*id="email"[^>]*name="email"[^>]*)(\/?>)/,
    `$1 value="${escapeHtml(prefillEmail)}"$2`
  );
}

function replaceTemplateValues(template, values) {
  let html = template;
  for (const [key, value] of Object.entries(values)) {
    const rawKeys = new Set(['interest_options']);
    html = html.replaceAll(`{{${key}}}`, rawKeys.has(key) ? String(value ?? '') : escapeHtml(value));
  }
  return html;
}

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function getProjectInterestIds(projectId) {
  const [rows] = await db.query(
    `SELECT interest_id FROM project_interests WHERE project_id = ?`,
    [projectId]
  );
  return rows.map((row) => row.interest_id);
}

async function renderProjectEditPage(projectId) {
  const [projects] = await db.query(
    `SELECT project_id, title, category, schedule_type, description, detail_icon,
            detail_text, image_url, image_alt, location, event_date, event_time,
            volunteers_needed, age_range, equipment, physical_requirements, status
       FROM projects
      WHERE project_id = ?
      LIMIT 1`,
    [projectId]
  );
  const project = projects[0];
  if (!project) return null;

  const [interests, selectedInterestIds] = await Promise.all([
    getInterests(),
    getProjectInterestIds(projectId),
  ]);

  const requirements = parseJsonArray(project.physical_requirements);
  const templatePath = path.join(publicDir, 'proyecto_editar/code.html');
  const template = await fs.promises.readFile(templatePath, 'utf8');
  return replaceTemplateValues(template, {
    project_id: project.project_id,
    title: project.title,
    description: project.description,
    location: project.location || '',
    schedule_type: project.schedule_type || '',
    event_date: project.event_date ? new Date(project.event_date).toISOString().slice(0, 10) : '',
    event_time: project.event_time ? String(project.event_time).slice(0, 5) : '',
    volunteers_needed: project.volunteers_needed || '',
    age_range: project.age_range || '',
    equipment: project.equipment || '',
    image_url: project.image_url || '',
    image_alt: project.image_alt || '',
    status: project.status || 'draft',
    physical_esfuerzo_leve: requirements.includes('Esfuerzo Leve') ? 'checked' : '',
    physical_esfuerzo_moderado: requirements.includes('Esfuerzo Moderado') ? 'checked' : '',
    physical_accesible: requirements.includes('Accesible para Silla de Ruedas') ? 'checked' : '',
    interest_options: renderProjectEditInterestOptions(interests, selectedInterestIds),
  });
}

async function saveProjectEdit(projectId, req) {
  const body = await readRequestBody(req);
  const formData = new URLSearchParams(body);
  const selectedInterestIds = [...new Set(formData.getAll('interests')
    .map((interest) => Number.parseInt(String(interest), 10))
    .filter(Number.isInteger))];
  const physicalRequirements = formData.getAll('physical_requirements')
    .map((requirement) => String(requirement).trim())
    .filter(Boolean);
  const status = formValue(formData, 'status') === 'draft' ? 'draft' : 'published';
  const title = formValue(formData, 'title');
  const description = formValue(formData, 'description');
  const scheduleType = formValue(formData, 'schedule_type');
  const detailText = formValue(formData, 'event_date') || formValue(formData, 'event_time')
    ? [formValue(formData, 'event_date'), formValue(formData, 'event_time')].filter(Boolean).join(' ')
    : scheduleType;

  if (!title || !description) {
    const error = new Error('Missing required project fields');
    error.statusCode = 400;
    throw error;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let primaryCategory = formValue(formData, 'category');
    if (selectedInterestIds.length) {
      const [firstInterest] = await connection.query(
        `SELECT name FROM interests WHERE interest_id = ? LIMIT 1`,
        [selectedInterestIds[0]]
      );
      primaryCategory = firstInterest[0]?.name || primaryCategory;
    }

    await connection.query(
      `UPDATE projects
          SET title = ?, category = ?, schedule_type = ?, description = ?,
              detail_icon = ?, detail_text = ?, image_url = ?, image_alt = ?,
              location = ?, event_date = ?, event_time = ?, volunteers_needed = ?,
              age_range = ?, equipment = ?, physical_requirements = ?, status = ?
        WHERE project_id = ?`,
      [
        title,
        primaryCategory || 'Social',
        scheduleType || 'Recurrente',
        description,
        'calendar_today',
        detailText || scheduleType || 'Por definir',
        formValue(formData, 'image_url'),
        formValue(formData, 'image_alt') || title,
        formValue(formData, 'location'),
        formValue(formData, 'event_date') || null,
        formValue(formData, 'event_time') || null,
        formValue(formData, 'volunteers_needed') || null,
        formValue(formData, 'age_range'),
        formValue(formData, 'equipment'),
        JSON.stringify(physicalRequirements),
        status,
        projectId,
      ]
    );

    await connection.query(`DELETE FROM project_interests WHERE project_id = ?`, [projectId]);
    for (const interestId of selectedInterestIds) {
      await connection.query(
        `INSERT INTO project_interests (project_id, interest_id) VALUES (?, ?)`,
        [projectId, interestId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function saveVolunteer(req) {
  const body = await readRequestBody(req);
  const formData = new URLSearchParams(body);
  const selectedInterestIds = [...new Set(formData.getAll('interests')
    .map((interest) => Number.parseInt(String(interest), 10))
    .filter(Number.isInteger))];
  const selectedAgeRanges = [...new Set(formData.getAll('age')
    .map((age) => String(age).trim())
    .filter(Boolean))];
  const volunteer = {
    fullName: formValue(formData, 'name'),
    email: formValue(formData, 'email'),
    phone: formValue(formData, 'phone'),
    ageRange: selectedAgeRanges.join(', '),
    ageRanges: selectedAgeRanges,
    interestIds: selectedInterestIds,
    interests: [],
    availability: formValue(formData, 'availability'),
  };

  if (!volunteer.fullName || !volunteer.email || !volunteer.availability) {
    const error = new Error('Missing required volunteer fields');
    error.statusCode = 400;
    throw error;
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let validInterests = [];
    if (selectedInterestIds.length) {
      const placeholders = selectedInterestIds.map(() => '?').join(',');
      const [rows] = await connection.query(
        `SELECT interest_id, name FROM interests WHERE is_active = 1 AND interest_id IN (${placeholders})`,
        selectedInterestIds
      );
      validInterests = rows;
    }

    volunteer.interestIds = validInterests.map((interest) => interest.interest_id);
    volunteer.interests = validInterests.map((interest) => interest.name);

    const [result] = await connection.query(
      `INSERT INTO volunteers (full_name, email, phone, age_range, interests, availability, raw_payload)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        volunteer.fullName,
        volunteer.email,
        volunteer.phone || null,
        volunteer.ageRange || null,
        JSON.stringify(volunteer.interests),
        volunteer.availability,
        JSON.stringify(volunteer),
      ]
    );

    for (const interestId of volunteer.interestIds) {
      await connection.query(
        `INSERT INTO volunteer_interests (volunteer_id, interest_id) VALUES (?, ?)`,
        [result.insertId, interestId]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return volunteer;
}

async function renderProjectDetailPage(projectId) {
  const project = await getProjectById(projectId);
  if (!project) return null;

  const templatePath = path.join(publicDir, 'proyecto_detalle/code.html');
  let html = await fs.promises.readFile(templatePath, 'utf8');
  const safeTitle = escapeHtml(project.title);
  const safeCategory = escapeHtml(splitList(project.interests)[0] || project.category);
  const safeDescription = escapeHtml(project.description);
  const safeImageUrl = escapeHtml(project.image_url);
  const safeImageAlt = escapeHtml(project.image_alt);
  const safeLocation = escapeHtml(project.location || 'Costa Rica');
  const safeScheduleType = escapeHtml(project.schedule_type);
  const safeDetailText = escapeHtml(project.detail_text);

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle} - Pura Vida y Mas</title>`);
  html = replaceFirst(html, /<img class="w-full h-full object-cover" data-alt="[\s\S]*?" src="[\s\S]*?"\/>/, `<img class="w-full h-full object-cover" data-alt="${safeImageAlt}" src="${safeImageUrl}"/>`);
  html = replaceFirst(html, /<div class="inline-block bg-primary-container text-on-primary-container px-sm py-xs rounded-lg font-label-bold mb-sm">[\s\S]*?<\/div>/, `<div class="inline-block bg-primary-container text-on-primary-container px-sm py-xs rounded-lg font-label-bold mb-sm">\n                    ${safeCategory}\n                </div>`);
  html = replaceFirst(html, /<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-md">[\s\S]*?<\/h1>/, `<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-white mb-md">\n                    ${safeTitle}\n                </h1>`);
  html = replaceFirst(html, /<p class="font-body-lg text-body-lg text-white max-w-2xl opacity-90">[\s\S]*?<\/p>/, `<p class="font-body-lg text-body-lg text-white max-w-2xl opacity-90">\n                    ${safeDescription}\n                </p>`);
  html = html.replace(/<span class="font-label-bold text-primary">Guanacaste, CR<\/span>/, `<span class="font-label-bold text-primary">${safeLocation}</span>`);
  html = html.replace(/<span class="font-label-bold text-primary">Fines de semana<\/span>/, `<span class="font-label-bold text-primary">${safeDetailText}</span>`);
  html = html.replace(/<span class="font-label-bold text-primary">Moderada<\/span>/, `<span class="font-label-bold text-primary">${safeScheduleType}</span>`);
  html = html.replace(/data-location="Guanacaste, Costa Rica"/, `data-location="${safeLocation}"`);
  html = html.replace(/<span class="font-label-bold">Ver en Google Maps<\/span>/, `<span class="font-label-bold">${safeLocation}</span>`);

  return html;
}

function send(res, statusCode, content, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
}

function sendJson(res, statusCode, payload) {
  send(res, statusCode, JSON.stringify(payload), 'application/json; charset=utf-8');
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, content) => {
    if (error) {
      send(res, error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Page not found' : 'Server error');
      return;
    }

    send(res, 200, content, types[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const cleanPath = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';

  if (req.method === 'POST' && cleanPath === '/registro') {
    try {
      const volunteer = await saveVolunteer(req);
      const whatsapp = await sendVolunteerWelcome(volunteer);
      send(
        res,
        200,
        JSON.stringify({
          ok: true,
          message: '¡Pura Vida! Gracias por registrarte. Nos pondremos en contacto contigo pronto.',
          whatsapp,
        }),
        'application/json; charset=utf-8'
      );
    } catch (error) {
      console.error('Unable to save volunteer registration:', error);
      send(
        res,
        error.statusCode || 500,
        JSON.stringify({ ok: false, message: error.statusCode === 400 ? 'Faltan datos requeridos.' : 'No pudimos guardar el registro.' }),
        'application/json; charset=utf-8'
      );
    }
    return;
  }

  if (req.method === 'GET' && cleanPath === '/api/whatsapp/status') {
    sendJson(res, 200, {
      ok: true,
      enabled: openWa.enabled,
      apiUrl: openWa.apiUrl,
      hasApiKey: Boolean(openWa.apiKey),
      note: openWa.enabled
        ? 'OpenWA está configurado. Escanea el QR del contenedor aciosa_openwa para conectar WhatsApp.'
        : 'OpenWA está desactivado.',
    });
    return;
  }

  if (req.method === 'POST' && cleanPath === '/api/whatsapp/send') {
    try {
      const body = await readRequestBody(req);
      const formData = new URLSearchParams(body);
      const result = await sendWhatsAppText(
        formValue(formData, 'phone'),
        formValue(formData, 'message') || 'Mensaje de prueba desde Pura Vida y Mas.'
      );
      sendJson(res, result.ok ? 200 : 502, result);
    } catch (error) {
      console.error('Unable to send WhatsApp message:', error);
      sendJson(res, 500, { ok: false, message: 'No pudimos enviar el mensaje de WhatsApp.' });
    }
    return;
  }

  if (req.method === 'GET' && cleanPath === '/registro') {
    try {
      send(res, 200, await renderRegistrationPage(url.searchParams.get('email') || ''), 'text/html; charset=utf-8');
    } catch (error) {
      console.error('Unable to render interests from MariaDB:', error);
      sendFile(res, path.join(publicDir, 'nete_como_voluntario/code.html'));
    }
    return;
  }

  if (req.method === 'GET' && cleanPath === '/api/project-matches') {
    const email = String(url.searchParams.get('email') || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      sendJson(res, 400, { ok: false, message: 'Ingresa un correo válido.' });
      return;
    }

    try {
      const volunteer = await getVolunteerByEmail(email);
      if (!volunteer) {
        sendJson(res, 404, {
          ok: false,
          found: false,
          message: 'No encontramos un registro con ese correo.',
        });
        return;
      }

      const projects = await getMatchedProjectsForVolunteer(volunteer.volunteer_id);
      sendJson(res, 200, {
        ok: true,
        found: true,
        volunteer: {
          name: volunteer.full_name,
          email: volunteer.email,
          interests: splitList(volunteer.interests),
        },
        projects,
      });
    } catch (error) {
      console.error('Unable to match projects:', error);
      sendJson(res, 500, { ok: false, message: 'No pudimos buscar proyectos en este momento.' });
    }
    return;
  }

  if (req.method === 'GET' && cleanPath === '/admin') {
    try {
      send(res, 200, await renderAdminPage(), 'text/html; charset=utf-8');
    } catch (error) {
      console.error('Unable to render admin page from MariaDB:', error);
      sendFile(res, path.join(publicDir, 'gesti_n_de_proyectos_panel_de_administraci_n/code.html'));
    }
    return;
  }

  const projectEditMatch = cleanPath.match(/^\/admin\/proyectos\/(\d+)\/editar$/);
  if (projectEditMatch) {
    if (req.method === 'GET') {
      try {
        const html = await renderProjectEditPage(projectEditMatch[1]);
        if (!html) {
          send(res, 404, 'Project not found');
          return;
        }

        send(res, 200, html, 'text/html; charset=utf-8');
      } catch (error) {
        console.error('Unable to render project edit page:', error);
        send(res, 500, 'Server error');
      }
      return;
    }

    if (req.method === 'POST') {
      try {
        await saveProjectEdit(projectEditMatch[1], req);
        res.writeHead(303, { Location: `/admin/proyectos/${projectEditMatch[1]}/editar?saved=1` });
        res.end();
      } catch (error) {
        console.error('Unable to save project edit:', error);
        send(res, error.statusCode || 500, error.statusCode === 400 ? 'Faltan campos requeridos.' : 'No pudimos guardar el proyecto.');
      }
      return;
    }
  }

  if (cleanPath === '/proyectos') {
    try {
      send(res, 200, await renderProjectsPage(), 'text/html; charset=utf-8');
    } catch (error) {
      console.error('Unable to render projects from MariaDB:', error);
      sendFile(res, path.join(publicDir, 'proyectos_de_voluntariado/code.html'));
    }
    return;
  }

  const projectDetailMatch = cleanPath.match(/^\/proyectos\/(\d+)$/);
  if (projectDetailMatch) {
    try {
      const html = await renderProjectDetailPage(projectDetailMatch[1]);
      if (!html) {
        send(res, 404, 'Project not found');
        return;
      }

      send(res, 200, html, 'text/html; charset=utf-8');
    } catch (error) {
      console.error('Unable to render project detail from MariaDB:', error);
      send(res, 500, 'Server error');
    }
    return;
  }

  const routeFile = routes.get(cleanPath);
  if (routeFile) {
    sendFile(res, path.join(publicDir, routeFile));
    return;
  }

  const staticPath = path.normalize(path.join(publicDir, cleanPath));
  if (!staticPath.startsWith(publicDir)) {
    send(res, 403, 'Forbidden');
    return;
  }

  sendFile(res, staticPath);
});

server.listen(port, () => {
  console.log(`Pura Vida volunteer network app running at http://localhost:${port}`);
});

