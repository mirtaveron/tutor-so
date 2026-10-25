# TutorSO 🎓 - Plataforma de Aprendizaje de Sistemas Operativos

**TutorSO** es una plataforma web fullstack interactiva diseñada para la cátedra de **Sistemas Operativos** de la **Universidad Nacional del Sur (UNS)** (Ingeniería en Computación e Ingeniería en Sistemas).

Incluye todo el plan de estudio (Unidades 1 a 4, Trabajos Prácticos 1 a 5 con resoluciones interactivas paso a paso), una pestaña completa de exámenes (Parciales 2022-2025 y Recuperatorio 2025), un resumen de estudio integral listo para imprimir en PDF y un **Tutor Inteligente con IA** conectado a la API de **Groq (Llama 3.3 70B)** con conocimiento del contexto del alumno.

---

## 🛠 Arquitectura y Stack Tecnológico

* **Frontend:** React 18, Vite, Tailwind CSS, Zustand, React Router DOM, React Markdown + Remark GFM, Lucide Icons.
* **Backend:** Node.js, Express, Prisma ORM, JWT (Cookies HttpOnly cross-domain), Groq Cloud SDK.
* **Base de Datos:** PostgreSQL en la nube con **Neon** (o SQLite para desarrollo local).
* **Despliegue:** 
  * Frontend en **Vercel**
  * Backend en **Render**
  * Base de datos en **Neon**
  * Código fuente en **GitHub**

---

## 🚀 Guía de Despliegue Paso a Paso (Paso a Paso)

### Paso 1: Subir el proyecto a GitHub

1. Creá un nuevo repositorio en [github.com/new](https://github.com/new) llamado `tutor-so` (público o privado).
2. Abrí tu terminal en la carpeta raíz `os-uns-app`:
   ```bash
   cd os-uns-app
   git init
   git add .
   git commit -m "feat: initial commit TutorSO"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/tutor-so.git
   git push -u origin main
   ```
*(Nota: El archivo `.gitignore` ya está configurado para no subir `.env` ni las bases de datos locales).*

---

### Paso 2: Crear la Base de Datos en Neon (PostgreSQL)

1. Ingresá a [neon.tech](https://neon.tech) y creá una cuenta gratuita.
2. Hacé clic en **"Create Project"** y nombralo `tutorso-db`.
3. En el dashboard de Neon, copiá la cadena de conexión (**Connection String**). Tendrá este formato:
   ```text
   postgresql://neondb_owner:TU_PASSWORD@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. En tu proyecto, abrí `backend/prisma/schema.prisma` y asegurate de que el datasource esté en PostgreSQL:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
5. En tu archivo `backend/.env` local pegá esa URL en `DATABASE_URL` y ejecutá una única vez para crear las tablas y cargar todo el contenido del curso:
   ```bash
   cd backend
   npx prisma db push
   npm run seed
   ```
   *(El script `seed.js` cargará automáticamente todas las unidades, lecciones teóricas, parciales y ejercicios paso a paso en Neon).*

---

### Paso 3: Desplegar el Backend en Render

1. Entrá a [render.com](https://render.com) e iniciá sesión con GitHub.
2. Hacé clic en **New +** > **Web Service**.
3. Seleccioná tu repositorio de GitHub `tutorso`.
4. Configurá el servicio con estos valores:
   * **Name:** `tutorso-api`
   * **Root Directory:** `backend`
   * **Environment:** `Node`
   * **Build Command:** `npm install && npm run build`
   * **Start Command:** `npm start`
5. En la sección **Environment Variables** (Variables de Entorno), agregá:
   * `NODE_ENV` = `production`
   * `PORT` = `4000`
   * `DATABASE_URL` = *(Pegá la URL de conexión de Neon)*
   * `JWT_SECRET` = *(Una frase secreta segura, ej: `mi-clave-super-secreta-so-2026`)*
   * `GROQ_API_KEY` = *(Tu API key de Groq, ej: `gsk_...`)*
   * `CLIENT_URL` = `https://tutorso.vercel.app` *(o el dominio final de tu frontend)*
6. Hacé clic en **Create Web Service**. Render te dará una URL como: `https://tutorso-api.onrender.com`.

---

### Paso 4: Desplegar el Frontend en Vercel

1. Entrá a [vercel.com](https://vercel.com) e iniciá sesión con GitHub.
2. Hacé clic en **Add New...** > **Project**.
3. Importá tu repositorio `tutorso`.
4. En la configuración del proyecto:
   * **Framework Preset:** `Vite`
   * **Root Directory:** Editá y elegí la carpeta `frontend`.
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
5. En la sección **Environment Variables**, agregá:
   * `VITE_API_URL` = `https://tutorso-api.onrender.com/api` *(la URL que te dio Render terminada en `/api`)*
6. Hacé clic en **Deploy**.
7. En unos segundos tu frontend estará en vivo en: `https://tutorso.vercel.app`.
8. *Nota de Seguridad:* Si la URL final en Vercel cambia, recordá actualizar la variable `CLIENT_URL` en Render para que los tokens y cookies funcionen sin problemas de CORS.

---

## 💻 Desarrollo Local

Para correr el proyecto en tu máquina:

```bash
# Backend (puerto 4000)
cd backend
npm install
npm run dev

# Frontend (puerto 5173)
cd frontend
npm install
npm run dev
```

Credenciales de prueba por defecto:
* **Usuario:** `admin@uns.edu.ar`
* **Contraseña:** `123456`
*(o podés registrar un usuario nuevo desde la pantalla de login).*
