# 🚖 Sistema de Apps de Transporte

Plataforma integral de transporte con apps para pasajeros y conductores, backend en tiempo real y panel de administración.

## 🏗️ Arquitectura

```
apps transporte/
├── backend/          # API REST + WebSockets (NestJS + PostgreSQL + Redis)
├── app-pasajero/     # App móvil para pasajeros (React Native / Expo)
├── app-conductor/    # App móvil para conductores (React Native / Expo)
└── panel-admin/      # Dashboard web (Next.js)
```

## ✅ Fases Completadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| 0 | Cimientos y configuración | ✅ |
| 1 | Autenticación y usuarios (OTP, Google, JWT) | ✅ |
| 2 | Geolocalización y mapas en tiempo real | ✅ |
| 3 | Core del negocio - solicitar viaje | ✅ |
| 4 | Pagos (Wompi) y panel admin | ✅ |
| 5 | IA multimodal (voz, chat, Gemini) | ✅ |
| 6 | Calificaciones, reseñas e historial | ✅ |
| 7 | Producción, notificaciones push y seguridad | ✅ |

## 🚀 Inicio Rápido (Desarrollo)

### Prerrequisitos
- Node.js 20+
- Docker Desktop

### 1. Levantar servicios de infraestructura
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # Configurar variables
npm install
npm run start:dev
```

### 3. Apps móviles
```bash
# Pasajero
cd app-pasajero && npm install && npx expo start

# Conductor
cd app-conductor && npm install && npx expo start
```

## 🔐 Variables de Entorno (Backend)

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | PostgreSQL |
| `REDIS_HOST` / `REDIS_PORT` | Redis |
| `JWT_SECRET` | Clave para firmar JWTs (mín. 64 chars en prod) |
| `JWT_EXPIRES_IN` | Expiración del access token (ej: `15m`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google |

## 🔔 Notificaciones Push (FCM)

Para habilitar notificaciones push en producción:
1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Descargar `serviceAccountKey.json` y colocarlo en `backend/`
3. Configurar `FIREBASE_PROJECT_ID` en las variables de entorno

## 🚢 Producción (CI/CD)

El pipeline de GitHub Actions (`.github/workflows/ci-cd.yml`) ejecuta automáticamente:
1. **Tests** en cada PR
2. **Build** de imagen Docker al hacer merge a `main`
3. **Deploy** al servidor por SSH

### Secrets requeridos en GitHub
```
DOCKERHUB_USERNAME, DOCKERHUB_TOKEN
SERVER_HOST, SERVER_USER, SERVER_SSH_KEY
```

### Deploy manual
```bash
cp .env.prod.example .env.prod  # Configurar valores reales
docker compose -f docker-compose.prod.yml up -d
```

## 🧪 Tests

```bash
cd backend
npm test              # Todos los tests
npm run test:watch    # Modo watch
npm run test:cov      # Con cobertura
```

## 📜 Reglas del Proyecto
Ver [REGLAS_DEL_PROYECTO.md](./REGLAS_DEL_PROYECTO.md) y [PLAN_DE_TRABAJO.md](./PLAN_DE_TRABAJO.md).
