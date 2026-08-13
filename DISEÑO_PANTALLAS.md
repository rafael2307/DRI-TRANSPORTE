# Especificación de Diseño: Pantallas de Acceso

## 1. Pantalla de Bienvenida (Splash Screen)
*   **Fondo:** Mapa de la ciudad en modo oscuro (tonos gris azulado `#0F172A`), con las calles principales iluminadas en `#3B82F6` (Electric Blue). Animación sutil de "pulso" en zonas de alta demanda.
*   **Logo:** Centrado, tipografía `Outfit` Bold, con un degradado de Cyan a Púrpura.
*   **Acción:** Sin botones. Transición automática a Login después de 2s o al detectar sesión.

## 2. Pantalla de Selección de Rol (Si no hay sesión)
*   **Layout:** Dos tarjetas grandes verticales (Glassmorphism).
*   **Tarjeta Superior (Pasajero):**
    *   Icono/Ilustración 3D de una persona esperando cómoda.
    *   Texto: "Quiero viajar".
    *   Fondo: Cristal esmerilado con brillo azul.
*   **Tarjeta Inferior (Conductor):**
    *   Icono/Ilustración 3D de un volante o coche futurista.
    *   Texto: "Quiero conducir".
    *   Fondo: Cristal esmerilado con brillo verde o ámbar (dinero/acción).
*   **Micro-interacción:** Al presionar, la tarjeta se expande (fill screen).

## 3. Pantalla de Login / Registro (Unificada)
*   **Título:** "Hola de nuevo" (u "Hola" si es nuevo).
*   **Input Principal:** Campo de teléfono grande con detección de país automática. Estilo "Underline" animado.
*   **Social Login (The Stack):**
    *   Fila de botones circulares con logotipos oficiales:
        *   **TikTok** (Negro/Neón)
        *   **Kwai** (Naranja)
        *   **Facebook** (Azul)
        *   **Google** (Blanco)
        *   **Apple** (Negro)
*   **Terminos:** Checkbox pequeño con texto legal resumido.

## 4. Verificación OTP
*   **Diseño:** 4/6 cajas grandes para los dígitos.
*   **Teclado:** Numérico nativo.
*   **Feedback:** Al completar, las cajas brillan en verde (`#10B981`) y hacen una transición suave.

## 5. Relleno de Perfil (Solo nuevos)
*   **Avatar:** Círculo para subir foto (o importar de red social).
*   **Nombre/Apellido:** Inputs flotantes.
*   **Botón Continuar:** Botón ancho, degradado, fixed en la parte inferior ("Sticky footer").
