# Sistema de Diseño "Neo-Motion"

Este documento define la guía de estilo visual para todas las aplicaciones del ecosistema, basada en **psicología del color** para optimizar la experiencia del usuario en cada rol.

## 1. Filosofía Visual
*   **Tema:** Futuro Urbano / Premium Dark.
*   **Sensación:** Fluida, Profunda, Tecnológica pero Humana.
*   **Estilo:** Glassmorphism (paneles de cristal), Neumorphism sutil en botones táctiles, degradados vibrantes.
*   **Principio de Psicología del Color:** Cada rol tiene un perfil cromático diseñado para evocar la emoción correcta: **confianza y calma** para el pasajero, **crecimiento y acción** para el conductor, **autoridad y control** para el administrador.

## 2. Paleta de Colores por Rol

### 🟦 Pasajero (Confianza · Seguridad · Calma)
*El azul profundo genera confianza y reduce la ansiedad. Ideal para quien espera un servicio.*

| Token | Color | Psicología |
|-------|-------|------------|
| `--background` | `#0F172A` | Estabilidad, profundidad |
| `--primary` | `#2563EB → #3B82F6` | Confianza, seguridad |
| `--primaryLight` | `#60A5FA` | Claridad, apertura |
| `--accent` | `#8B5CF6` | Innovación, premium |
| `--success` | `#10B981` | Confirmación, bienestar |
| `--warning` | `#F59E0B` | Atención, espera |
| `--error` | `#EF4444` | Alerta (uso moderado) |

### 🟩 Conductor (Dinero · Crecimiento · Acción)
*El verde estimula la sensación de ganancia y progreso. Perfecto para motivar al socio conductor.*

| Token | Color | Psicología |
|-------|-------|------------|
| `--background` | `#0F172A` | Seriedad, profesionalismo |
| `--primary` | `#059669 → #10B981` | Crecimiento, dinero, acción |
| `--primaryLight` | `#34D399` | Optimismo, frescura |
| `--accent` | `#8B5CF6` | Soporte IA, herramientas premium |
| `--success` | `#10B981` | Meta alcanzada, ingreso |
| `--warning` | `#F59E0B` | Urgencia en solicitudes de viaje |
| `--error` | `#EF4444` | Cancelación, alerta |

### 🟣 Admin (Autoridad · Control · Sabiduría)
*El índigo/púrpura transmite autoridad y sabiduría, ideal para paneles de control.*

| Token | Color | Psicología |
|-------|-------|------------|
| `--background` | `#0F172A` | Solidez institucional |
| `--primary` | `#6366F1 → #818CF8` | Autoridad, control |
| `--accent` | `#38BDF8` | Datos en tiempo real |
| `--success` | `#10B981` | Aprobaciones, finanzas sanas |
| `--warning` | `#F59E0B` | Pendiente de revisión |
| `--error` | `#EF4444` | Rechazo, problema crítico |

## 3. Tipografía
*   **Headings:** `Outfit` (Google Fonts). Geometría moderna, transmite confianza.
*   **Body:** `Inter` (Google Fonts). Legibilidad máxima en UI, neutral y profesional.

## 4. Componentes Core
*   **Botón Multimodal (IA):** Un orbe flotante con animación sutil (glow) que invita a hablar. Color púrpura `#8B5CF6` para denotar inteligencia artificial.
*   **Tarjetas:** Bordes redondeados (16px/24px), fondo borroso (`backdrop-filter: blur(10px)`), borde fino semitransparente. Efecto de vidrio que transmite transparencia y modernidad.
*   **Mapas:** Estilo personalizado "Dark Materia". Calles en gris oscuro, rutas en azul neón (pasajero) o verde neón (conductor).
*   **Estados del Viaje:**
    *   *Buscando:* Pulso azul/verde según rol — transmite actividad controlada.
    *   *En Progreso:* Color primario sólido — enfoque en la acción actual.
    *   *Completado:* Verde éxito con icono de check — celebración contenida.

## 5. Iconografía
*   Uso de iconos con trazo fino (Rounded) y rellenos sutiles. Consistencia sobre estilos mixtos.
*   Los iconos de acción usan el color primario del rol; los iconos decorativos usan el color de texto secundario.
