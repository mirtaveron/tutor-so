# TutorSO 🎓 - Plataforma de Aprendizaje de Sistemas Operativos (UNS)

[![Deploy Status](https://img.shields.io/badge/Deploy-Online-brightgreen?style=flat-square)](https://tutor-so.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://tutor-so.vercel.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://tutor-so.onrender.com/api/health)
[![Database](https://img.shields.io/badge/Database-Neon%20PostgreSQL-00E599?style=flat-square&logo=postgresql)](https://neon.tech)
[![AI Engine](https://img.shields.io/badge/AI-Groq%20(Llama%203.3%2070B)-F55036?style=flat-square)](https://groq.com)

**TutorSO** es una plataforma web interactiva y completa diseñada específicamente para la cátedra de **Sistemas Operativos** del Departamento de Ciencias e Ingeniería de la Computación de la **Universidad Nacional del Sur (UNS)** (carreras de Ingeniería en Computación, Ingeniería en Sistemas de Información y Licenciatura en Ciencias de la Computación).

La aplicación reúne el programa teórico completo, las resoluciones analíticas de los Trabajos Prácticos, un banco de exámenes parciales oficiales resueltos paso a paso y un tutor inteligente con IA entrenado con la bibliografía de la materia.

🌐 **Aplicación en Producción:** [https://tutor-so.vercel.app/](https://tutor-so.vercel.app/)

---

## 🏛️ Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada de tres capas (Single Page Application + API Gateway REST + Base de Datos Serverless + Motor de Inferencia IA):

```mermaid
flowchart TD
    Client["Cliente Web (Vercel)<br>React 18 + Vite SPA"]
    API["Backend REST API (Render)<br>Node.js + Express 5"]
    DB["Base de Datos (Neon)<br>PostgreSQL + Prisma ORM"]
    AI["Motor IA (Groq Cloud)<br>Llama 3.3 70B Versatile"]

    Client -->|HTTPS / CORS| API
    API -->|Prisma Client| DB
    API -->|Groq SDK| AI
```

### Componentes de la Arquitectura

1. **Frontend (Capa de Presentación):**
   * Desplegado en el CDN global de **Vercel**.
   * Single Page Application (SPA) construida con **React 18** y empaquetada con **Vite**.
   * Rutas optimizadas con **React Router DOM v7** y redirecciones SPA (`vercel.json`).
   * Estilizado con **Tailwind CSS**, soporte responsive (celular / tablet / escritorio) y reglas `@media print` para exportación directa a PDF.

2. **Backend (Capa de Negocio y API Gateway):**
   * Alojado como Web Service en **Render**.
   * **Node.js** con **Express 5** en modo reverse-proxy (`trust proxy: 1`).
   * Manejo de CORS dinámico con soporte de credenciales seguras.
   * Endpoints de salud (`/api/health`) para monitoreo continuo.

3. **Capa de Persistencia (Neon PostgreSQL):**
   * Base de datos serverless basada en **PostgreSQL 16** en **Neon.tech**.
   * Gestión de esquema, migraciones y tipos mediante **Prisma ORM**.
   * Mecanismo de sembrado (*seeding*) universal e idempotente para cargar automáticamente todo el currículum de la cátedra.

4. **Capa de Inteligencia Artificial (Groq Cloud SDK):**
   * Integración directa con **Llama 3.3 70B Versatile** mediante la infraestructura de aceleración de Groq (LPU).
   * Respuestas contextualizadas con el rol de docente universitario de Sistemas Operativos UNS, enfatizando conceptos teóricos (Silberschatz, Tanenbaum) y comandos de terminal Linux (POSIX).

---

## 🎨 Diseño y Experiencia de Usuario (UI/UX)

* **Acceso Directo y Sin Fricción:** Acceso público inmediato a todo el material sin pantallas de login obligatorias ni barreras de registro, facilitando consultas rápidas desde el celular durante las clases o sesiones de estudio.
* **Componente Interactivo Stepper:** Cada Trabajo Práctico y examen parcial desglosa sus problemas en pasos individuales navegables (`Paso X de Y`) con selector rápido, enunciado, explicación conceptual y bloques de código preformateados.
* **Visor Teórico Enriquecido:** Renderizado en tiempo real de Markdown con soporte de sintaxis extendida GFM (tablas, listas, alertas y bloques de código) mediante `react-markdown`, `remark-gfm` y `rehype-raw`.
* **Formato Imprimible / Guardar en PDF:** El resumen integral de la materia cuenta con estilos de impresión dedicados que ocultan barras de navegación, botones y widgets, y fuerzan saltos de página limpios para generar resúmenes de estudio en PDF listos para imprimir.
* **Widget Flotante de Tutoría IA:** Interfaz de chat no invasiva con minimizado/maximizado, sugerencias de preguntas frecuentes y streaming de respuestas del modelo.

---

## 💡 Decisiones de Diseño y Técnicas

| Decisión | Justificación Técnica |
| :--- | :--- |
| **Acceso Libre (Sin Login)** | Se eliminó el flujo de autenticación forzada para que los estudiantes puedan ingresar desde cualquier dispositivo con un solo clic, sin perder tiempo en crear cuentas ni lidiar con tokens expirados. |
| **PostgreSQL Serverless (Neon)** | Permite un escalado automático desde cero conexiones, almacenamiento seguro en la nube y compatibilidad nativa con Prisma ORM, evitando los bloqueos de concurrencia de SQLite en entornos distribuidos. |
| **Groq LPU vs OpenAI/Anthropic** | Groq proporciona inferencia a más de 250 tokens/segundo con Llama 3.3 70B, brindando una experiencia de tutoría conversacional instantánea sin latencias perceptibles para el estudiante. |
| **Arquitectura Desacoplada (Vercel + Render)** | Separar el frontend estático del backend permite despliegues atómicos instantáneos en Vercel, mientras el backend mantiene su ciclo de vida independiente en Render. |
| **Idempotencia en Seeding (`seed.js`)** | Los scripts de carga de datos usan operaciones `upsert` y comparación de unicidad para permitir re-ejecutar el sembrado sin duplicar unidades, lecciones ni ejercicios. |
| **CORS Dinámico y Trust Proxy** | Al alojar frontend y backend en dominios distintos (`vercel.app` y `onrender.com`), Express valida el origen de la solicitud y confía en el header `X-Forwarded-Proto` de Render para mantener compatibilidad HTTPS. |

---

## 📚 Contenido Académico Incluido

La plataforma cuenta con todo el material didáctico estructurado y cargado:

* **Unidad 1:** Introducción, Estructura de los Sistemas Operativos y Conceptos de Arquitectura (Interrupciones, Modo Dual, System Calls).
* **Unidad 2:** Procesos e Hilos (Estados, PCB, Creación de Procesos con `fork()`, `exec()`, `wait()`, Modelos multihilo).
* **Unidad 3:** Planificación de CPU (Criterios, Algoritmos FCFS, SJF, Round Robin, Prioridades, Multilevel Feedback Queue).
* **Unidad 4:** Sincronización y Comunicación entre Procesos (Sección Crítica, Semáforos, Mutex, Problemas Clásicos como Productores-Consumidores, Deadlocks).
* **Trabajos Prácticos (TP1 a TP5):** Ejercicios resueltos paso a paso en entorno Linux (Bash scripts, llamadas al sistema POSIX, threads con Pthreads y semáforos POSIX).
* **Banco de Exámenes:**
  * Parcial 2022 (Temas A y B)
  * Parcial 2023 (Temas A y B)
  * Parcial 2024 (Temas A y B)
  * Parcial 2025 (Temas A y B)
  * Recuperatorio Oficial 2025
* **Resumen Teórico-Práctico Integral:** Compilado de conceptos clave, fórmulas y tablas de referencia optimizado para impresión.

---

## 💻 Entorno de Desarrollo Local

Para clonar y ejecutar el proyecto en tu máquina local:

### 1. Requisitos Previos
* **Node.js:** Versión 18 o superior (recomendado Node 20 LTS o 22).
* **npm:** Gestor de paquetes incluido con Node.
* **Git** instalado.

---

### 2. Clonar el Repositorio
```bash
git clone https://github.com/mirtaveron/tutor-so.git
cd tutor-so
```

---

### 3. Configuración del Backend

1. Entrar en la carpeta `backend` e instalar dependencias:
   ```bash
   cd backend
   npm install
   ```

2. Crear el archivo `.env` en `backend/` con las siguientes variables:
   ```env
   PORT=4000
   NODE_ENV=development
   DATABASE_URL="postgresql://neondb_owner:TU_PASSWORD@ep-xyz.sa-east-1.aws.neon.tech/neondb?sslmode=require"
   JWT_SECRET="clave-secreta-para-desarrollo-local"
   CLIENT_URL="http://localhost:5173"
   GROQ_API_KEY="tu_api_key_de_groq"
   ```
   *(Nota: Puedes usar la base de datos de Neon o cambiar temporalmente el provider en `prisma/schema.prisma` a `sqlite` con `DATABASE_URL="file:./dev.db"` para desarrollo totalmente offline).*

3. Generar el cliente de Prisma y cargar los datos:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

4. Iniciar el servidor backend en modo desarrollo:
   ```bash
   npm run dev
   ```
   *El servidor quedará escuchando en `http://localhost:4000`.*

---

### 4. Configuración del Frontend

1. En una nueva terminal, entrar en la carpeta `frontend` e instalar dependencias:
   ```bash
   cd frontend
   npm install
   ```

2. (Opcional) Crear el archivo `.env` en `frontend/`:
   ```env
   VITE_API_URL=http://localhost:4000/api
   ```
   *(Si no se especifica, el frontend apunta automáticamente a `http://localhost:4000/api` en desarrollo local).*

3. Iniciar el servidor de desarrollo de Vite:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en `http://localhost:5173`.*

---

## 📦 Scripts Disponibles

### Backend (`/backend`)
| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el backend con recarga automática usando `nodemon`. |
| `npm start` | Inicia el servidor Node.js en modo producción (`node src/server.js`). |
| `npm run build` | Ejecuta `npx prisma generate` para sincronizar los clientes de base de datos. |
| `npm run seed` | Puebla la base de datos con las 6 unidades, 45 clases y 98 pasos (`node prisma/seed.js`). |

### Frontend (`/frontend`)
| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite (HMR ultra rápido). |
| `npm run build` | Compila y empaqueta la aplicación para producción en la carpeta `dist/`. |
| `npm run preview` | Previsualiza el build de producción localmente. |

---

## 👥 Cátedra y Créditos

* **Materia:** Sistemas Operativos
* **Institución:** Universidad Nacional del Sur (UNS) - Bahía Blanca, Argentina
* **Desarrollo:** Desarrollado como plataforma de apoyo y tutoría académica integral para alumnos de la carrera.
