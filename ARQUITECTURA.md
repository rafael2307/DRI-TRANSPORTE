# Arquitectura del Sistema de Transporte

Cumpliendo la **Regla #3**, definimos la arquitectura antes de tocar código.

## 1. Stack Tecnológico (La Base)
*   **Backend (Lógica):** Node.js con NestJS (escalabilidad enterprise) o FastAPI (Python) si se requiere IA pesada para rutas. *Recomendado: NestJS.*
*   **Base de Datos (Datos):**
    *   **PostgreSQL:** Para datos relacionales críticos (usuarios, transacciones financieras, historial).
    *   **Redis:** Para caché y datos en tiempo real (geo-posicionamiento en vivo, sesiones activas).
    *   **Vector DB (pgvector/Pinecone):** Para memoria del asistente de IA.
*   **IA y Multimodalidad:**
    *   **STT/TTS:** Google Cloud Speech-to-Text o Whisper (OpenAI) para comandos de voz.
    *   **Chatbot Engine:** Integración con LLM (GPT-4o/Claude) para asistencia inteligente en lenguaje natural.
*   **Web y Panel Admin:** Next.js (React) + TailwindCSS (diseño moderno y rápido).
*   **Apps Móviles:** React Native (Expo) o Flutter. *Recomendado: Flutter por rendimiento nativo en mapas en ambas plataformas.*
*   **Mapas y Geolocalización:** Google Maps API o Mapbox (más barato a escala).
*   **Infraestructura:** Docker + Kubernetes (K8s) en AWS/GCP.

## 2. Diagrama de Módulos (Alto Nivel)

```mermaid
graph TD
    UserApp[App Pasajero] --> API_Gateway
    DriverApp[App Conductor] --> API_Gateway
    AdminPanel[Panel Admin] --> API_Gateway

    subgraph Backend Services
        API_Gateway[API Gateway / Load Balancer]
        Auth[Servicio de Autenticación (OAuth social)]
        Dispatch[Motor de Asignación de Viajes]
        Payment[Servicio de Pagos]
        SocketServer[Servidor WebSocket (Tiempo Real)]
    end

    subgraph Data Layer
        Postgres[(PostgreSQL - Usuarios/Viajes)]
        Redis[(Redis - Ubicación en vivo)]
    end

    API_Gateway --> Auth
    API_Gateway --> Dispatch
    API_Gateway --> Payment
    API_Gateway --> SocketServer

    Dispatch --> Redis
    Dispatch --> Postgres
    SocketServer --> Redis
```

## 3. Flujo de Datos Crítico: Solicitud de Viaje
1.  **Pasajero:** Envía solicitud (lat, long, destino) -> API Gateway.
2.  **Dispatch Engine:**
    *   Consulta Redis para conductores disponibles en radio X km.
    *   Filtra conductores aptos (tipo de vehículo, calificación).
    *   Envía notificación vía WebSocket al conductor óptimo.
3.  **Conductor:** Acepta viaje -> API Gateway actualiza estado en Redis y Postgres.
4.  **Socket Server:** Notifica al Pasajero "Conductor en camino".

## 4. Estrategia de Autenticación Flexible
Para soportar TikTok, Facebook, Instagram, Kwai, etc.:
*   Usaremos **Firebase Auth** o **Auth0** como capa intermedia, o implementaremos **Passport.js** strategies personalizadas si queremos control total.
*   El backend normalizará el perfil del usuario independientemente de la red social usada.

## 5. Diseño de Base de Datos (Esquema Simplificado)

*   **Users:** `id`, `name`, `phone`, `email`, `role` (driver/passenger), `rating`.
*   **SocialAccounts:** `user_id`, `provider` (tiktok, facebook...), `provider_id`.
*   **Rides:** `id`, `passenger_id`, `driver_id`, `status` (requested, accepted, ongoing, completed, cancelled), `fare`, `pickup_loc`, `dropoff_loc`.
*   **Transactions:** `ride_id`, `amount`, `method` (cash, card), `status`.
