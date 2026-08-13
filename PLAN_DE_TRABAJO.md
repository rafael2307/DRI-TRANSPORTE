# Plan de Trabajo - Sistema de Apps de Transporte

Siguiendo la **Regla #4 (Divide y Vencerás)**, este documento desglosa el proyecto en tareas microscópicas y manejables.

## Fase 0: Cimientos y Configuración (Semana 1)
*   [x] **Tarea 0.0:** Investigación de Competencia (Regla #18): Analizar Uber, Didi, InDrive. Documentar hallazgos en `market_research.md`. <!-- id: 8 -->
*   [x] **Tarea 0.1:** Inicializar repositorio Git y estructura de carpetas (Monorepo recomendado: Turborepo/Nx). <!-- id: 9 -->
*   [x] **Tarea 0.2:** Configurar entorno de desarrollo (Node.js, Docker para DB local).
*   [x] **Tarea 0.3:** Definir reglas de ESLint, Prettier y Husky (pre-commit hooks) según la **Regla #5**.
*   [x] **Tarea 0.4:** Crear "Hola Mundo" en Backend (NestJS) y Frontend (React Native/Flutter) para verificar conectividad. <!-- id: 10 -->

## Fase 1: Autenticación y Usuarios (Finalizada)
*   [x] **Tarea 1.1:** Diseño de BD: Tablas `Users`, `Roles`, `SocialAccounts` en PostgreSQL.
*   [x] **Tarea 1.2:** Implementar API de Registro con Email/Password.
*   [x] **Tarea 1.3:** Implementar Login Social (Backend): Integrar estrategias de Passport/Firebase para Google.
*   [ ] **Tarea 1.4-1.6:** Integraciones Sociales Adicionales (Opcional/Futuro: TikTok, Kwai, FB/IG).
*   [x] **Tarea 1.7:** Crear pantallas de Login/Registro en App Pasajero.
*   [x] **Tarea 1.8:** Crear pantallas de Login/Registro en App Conductor.

## Fase 2: Geolocalización y Mapas (Finalizada)
*   [x] **Tarea 2.1:** Integrar SDK de Mapas (Google/Mapbox) en App Pasajero.
*   [x] **Tarea 2.2:** Integrar SDK de Mapas en App Conductor.
*   [x] **Tarea 2.3:** Backend: Configurar Redis para almacenamiento de posición geoespacial.
*   [x] **Tarea 2.4:** WebSocket: Emitir ubicación de conductor en tiempo real al servidor.
*   [x] **Tarea 2.5:** WebSocket: Suscribir App Pasajero a actualizaciones de ubicación.

## Fase 3: Core del Negocio - Solicitar Viaje (Finalizada)
*   [x] **Tarea 3.1:** Backend: Endpoint para estimar tarifa (A -> B).
*   [x] **Tarea 3.2:** App Pasajero: UI para seleccionar origen/destino y pedir viaje.
*   [x] **Tarea 3.3:** Backend: Algoritmo de despacho simple.
*   [x] **Tarea 3.4:** App Conductor: Pantalla de "Nueva Solicitud" (Aceptar/Rechazar).
*   [x] **Tarea 3.5:** Flujo completo: Solicitud -> Asignación -> Inicio Viaje -> Fin Viaje.

## Fase 4: Pagos y Panel Admin (Finalizada)
*   [x] **Tarea 4.1:** Integrar pasarela de pagos (Wompi/Checkout).
*   [x] **Tarea 4.2:** Panel Admin: Visualizar viajes en curso y métricas.
*   [x] **Tarea 4.3:** Panel Admin: Gestión de usuarios, conductores y retiros.

## Fase 5: Experiencia Multimodal & IA (Finalizada)
*   [x] **Tarea 5.1:** Integrar servicio STT (Speech-to-Text) y TTS para comandos de voz.
*   [x] **Tarea 5.2:** Implementar interfaz de Chat Flotante en todas las apps.
*   [x] **Tarea 5.3:** Backend: Integrar LLM (Gemini) para extracción de destinos y soporte.

## Fase 6: Calificaciones, Reseñas e Historial (Finalizada)
*   [x] **Tarea 6.1:** Backend: Crear entidad `Review` y vincularla a `Trip`.
*   [x] **Tarea 6.2:** App Pasajero: Pantalla de feedback post-pago (Estrellas y comentarios).
*   [x] **Tarea 6.3:** App Conductor: Dashboard de estadísticas (Promedio de estrellas, billetera).
*   [x] **Tarea 6.4:** General: Implementar pantallas de historial de viajes con filtros.

## Fase 7: Producción, Notificaciones y Seguridad (Finalizada)
*   [x] **Tarea 7.1:** Integrar Notificaciones Push con Firebase Cloud Messaging (FCM).
*   [x] **Tarea 7.2:** Implementar rotación de Refresh Tokens para mayor seguridad.
*   [x] **Tarea 7.3:** Configurar entorno de producción (CI/CD con GitHub Actions, Docker Compose para Prod).
*   [x] **Tarea 7.4:** Auditoría de Performance: Índices de base de datos y optimización de sockets.

---
**Nota:** Cada tarea debe completarse con sus respectivos Tests Unitarios (**Regla #6**).

---
**Nota:** Cada tarea debe completarse con sus respectivos Tests Unitarios (**Regla #6**).
