# Aciosa Costa Rica Volunteer Network

Node.js app created from the `code.html` files in `stitch_costa_rica_volunteer_network.zip`.

The landing page is served from:

`public/inicio_pura_vida_voluntarios/code.html`

## Run with Docker Compose

1. Open this folder in VS Code: `D:\Candid Concepts\Aciosa`
2. Open the VS Code terminal.
3. Run `docker compose -f docker-compose.yml up --build`.
4. Visit `http://localhost:8080`.

## Pages

- `/` - Inicio
- `/proyectos` - Proyectos
- `/registro` - Registro
- `/quienes-somos` - Quiénes Somos
- `/admin` - Admin panel

## Services

- `nginx` - public web server on port `8080`
- `app` - Node.js app on internal port `3000`
- `mariadb` - MariaDB database with a persistent Docker volume
- `openwa` - OpenWA WhatsApp Easy API on port `8081`

The original embedded CSS has been moved into one file: `public/styles.css`.

## WhatsApp / OpenWA

OpenWA runs as its own Docker service so the Node app stays focused on the volunteer workflow.

- App status endpoint: `http://localhost:8080/api/whatsapp/status`
- OpenWA API docs after the service starts: `http://localhost:8081/api-docs/`
- First login requires scanning the QR code from the `aciosa_openwa` container logs.

Registration includes an optional WhatsApp field. When OpenWA is connected, the app sends a welcome message after saving a volunteer. If OpenWA is still offline or waiting for QR login, registration still succeeds and the WhatsApp message is skipped.
