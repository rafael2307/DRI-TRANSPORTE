# Esquema de Requisitos del Sistema de Transporte

Este documento detalla los requisitos funcionales y no funcionales, entradas, salidas y límites del sistema, cumpliendo la **Regla #2**.

## 1. App de Pasajero (Usuario Final)
### Funciones Principales
*   **Registro y Autenticación:** Registro multiplataforma obligatorio con:
    *   Número de teléfono (SMS/WhatsApp).
    *   Redes Sociales: **TikTok**, **Facebook**, **Instagram**, **Kwai**.
    *   Cuentas estándar: Google, Apple ID.
    *   Email.
    *   *Nota: El sistema debe ser extensible para agregar futuras redes sociales populares fácilmente.*
*   **Solicitud de Viaje:** Selección de origen (GPS/manual) y destino. Selección de tipo de vehículo.
*   **Estimación de Tarifa:** Ver precio estimado y tiempo de llegada (ETA) antes de confirmar.
*   **Seguimiento en Vivo:** Ver la ubicación del conductor en el mapa en tiempo real.
*   **Pagos:** Gestión de tarjetas de crédito/débito y efectivo.
*   **Historial:** Lista de viajes pasados con detalles y recibos.
*   **Calificación:** Valorar al conductor y dejar comentarios.
*   **Interfaz Multimodal:** Asistente de voz integrado y chat para todas las acciones (pedir viaje, consultar estado) según Regla #20.

### Entradas y Salidas
*   **Entrada:** Ubicación GPS, Destino, Método de Pago, Calificación.
*   **Salida:** Confirmación de conductor, ETA, Mapa de ruta, Recibo de pago.

---

## 2. App de Conductor (Socio)
### Funciones Principales
*   **Gestión de Estado:** Botón "En línea" / "Desconectado".
*   **Recepción de Solicitudes:** Alerta sonora y visual con distancia al pasajero y ganancia estimada.
*   **Navegación:** Integración con Waze/Google Maps para ruta óptima.
*   **Gestión del Viaje:** Botones para "Llegué", "Iniciar Viaje", "Finalizar Viaje".
*   **Billetera:** Visualización de ganancias diarias/semanales y historial de depósitos.

### Entradas y Salidas
*   **Entrada:** Disponibilidad, Aceptación/Rechazo de viaje, Estado del viaje.
*   **Salida:** Notificaciones de viaje, Ruta de navegación, Resumen de ganancias.

---

## 3. Panel Administrativo (Web)
### Funciones Principales
*   **Dashboard:** Métricas en vivo (viajes activos, conductores online, ingresos).
*   **Gestión de Usuarios:** Ver, bloquear o validar documentos de conductores y pasajeros.
*   **Tarifas:** Configuración de precio base, precio por km/min, y tarifas dinámicas.
*   **Mapa de Calor:** Visualización de zonas con alta demanda.
*   **Reportes:** Exportación de datos financieros y operativos (CSV/Excel).

---

## 4. Requisitos No Funcionales (Límites y Calidad)
*   **Disponibilidad:** 99.9% de uptime. El servicio no puede caerse en horas pico.
*   **Latencia:** La posición del conductor debe actualizarse en el mapa del usuario con < 2 segundos de retraso.
*   **Seguridad:** Datos sensibles (tarjetas, contraseñas) encriptados (AES-256). Comunicaciones vía HTTPS (TLS 1.3).
*   **Escalabilidad:** Arquitectura capaz de soportar 10,000 usuarios concurrentes inicialmente.
*   **Internacionalización:** Soporte inicial para Español e Inglés.

## 5. Reglas de Negocio Críticas
*   Un conductor no puede recibir solicitudes si su documentación está vencida.
*   El sistema debe cobrar una tarifa de cancelación si el usuario cancela después de 5 minutos.
*   La comisión de la plataforma se calcula automáticamente antes de depositar al conductor.
