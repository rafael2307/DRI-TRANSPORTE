# Plan de Trabajo - Sistema de Apps de Transporte

Siguiendo la **Regla #4 (Divide y Vencerás)**, este documento desglosa el proyecto en tareas microscópicas y manejables.

## Fase 0: Cimientos y Configuración (Semana 1)
*   [ ] **Tarea 0.0:** Investigación de Competencia (Regla #18): Analizar Uber, Didi, InDrive. Documentar hallazgos en `market_research.md`.
*   [ ] **Tarea 0.1:** Inicializar repositorio Git y estructura de carpetas (Monorepo recomendado: Turborepo/Nx).
*   [ ] **Tarea 0.2:** Configurar entorno de desarrollo (Node.js, Docker para DB local).
*   [ ] **Tarea 0.3:** Definir reglas de ESLint, Prettier y Husky (pre-commit hooks) según la **Regla #5**.
*   [ ] **Tarea 0.4:** Crear "Hola Mundo" en Backend (NestJS) y Frontend (React Native/Flutter) para verificar conectividad.

## Fase 1: Autenticación y Usuarios (Semana 2)
*   [ ] **Tarea 1.1:** Diseño de BD: Tablas `Users`, `Roles`, `SocialAccounts` en PostgreSQL.
*   [ ] **Tarea 1.2:** Implementar API de Registro con Email/Password.
*   [ ] **Tarea 1.3:** Implementar Login Social (Backend): Integrar estrategias de Passport/Firebase para Google.
*   [ ] **Tarea 1.4:** Implementar Login Social (Backend): Integrar TikTok.
*   [ ] **Tarea 1.5:** Implementar Login Social (Backend): Integrar Facebook/Instagram.
*   [ ] **Tarea 1.6:** Implementar Login Social (Backend): Integrar Kwai.
*   [ ] **Tarea 1.7:** Crear pantallas de Login/Registro en App Pasajero.
*   [ ] **Tarea 1.8:** Crear pantallas de Login/Registro en App Conductor (incluye subida de documentos).

## Fase 2: Geolocalización y Mapas (Semana 3)
*   [ ] **Tarea 2.1:** Integrar SDK de Mapas (Google/Mapbox) en App Pasajero.
*   [ ] **Tarea 2.2:** Integrar SDK de Mapas en App Conductor.
*   [ ] **Tarea 2.3:** Backend: Configurar Redis para almacenamiento de posición geoespacial (GEOADD).
*   [ ] **Tarea 2.4:** WebSocket: Emitir ubicación de conductor en tiempo real al servidor.
*   [ ] **Tarea 2.5:** WebSocket: Suscribir App Pasajero a actualizaciones de ubicación de conductores cercanos.

## Fase 3: Core del Negocio - Solicitar Viaje (Semana 4)
*   [ ] **Tarea 3.1:** Backend: Endpoint para estimar tarifa (A -> B).
*   [ ] **Tarea 3.2:** App Pasajero: UI para seleccionar origen/destino y pedir viaje.
*   [ ] **Tarea 3.3:** Backend: Algoritmo de despacho simple (buscar conductor más cercano en Redis).
*   [ ] **Tarea 3.4:** App Conductor: Pantalla de "Nueva Solicitud" (Aceptar/Rechazar).
*   [ ] **Tarea 3.5:** Flujo completo: Solicitud -> Asignación -> Inicio Viaje -> Fin Viaje.

## Fase 4: Pagos y Panel Admin (Semana 5+)
*   [ ] **Tarea 4.1:** Integrar pasarela de pagos (Stripe/MercadoPago).
*   [ ] **Tarea 4.2:** Panel Admin: Visualizar viajes en curso.
*   [ ] **Tarea 4.3:** Panel Admin: Gestión de usuarios y conductores.

## Fase 5: Experiencia Multimodal (Semana 6)
*   [ ] **Tarea 5.1:** Integrar servicio STT (Speech-to-Text) y TTS para comandos de voz: "Llevame a casa".
*   [ ] **Tarea 5.2:** Implementar interfaz de Chat Flotante en todas las apps.
*   [ ] **Tarea 5.3:** Backend: Integrar LLM a través de API para responder preguntas frecuentes y gestión de comandos.

---
**Nota:** Cada tarea debe completarse con sus respectivos Tests Unitarios (**Regla #6**).
