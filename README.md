# Aciosa Costa Rica Volunteer Network

Node.js app created from the `code.html` files in `stitch_costa_rica_volunteer_network.zip`.

The landing page is served from:

`public/inicio_pura_vida_voluntarios/code.html`

## Run with Docker Compose

1. Open this folder in VS Code: `D:\Candid Concepts\Aciosa`
2. Open the VS Code terminal.
3. Run `docker compose up --build`.
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

The original embedded CSS has been moved into one file: `public/styles.css`.
