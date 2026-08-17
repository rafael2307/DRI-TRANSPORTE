# Propuesta técnica: asistente de voz DRI

## 1. Objetivo

Agregar un asistente de voz conversacional dentro de app-pasajero y app-conductor que cumpla dos roles distintos según el usuario:

- **Pasajero**: resolver dudas sobre el viaje en curso (tarifa, tiempo estimado, cambios de ruta) y ofrecer entretenimiento ligero durante el trayecto (conversación casual, noticias breves, trivia).
- **Conductor**: mantenerlo alerta y despierto en viajes largos mediante interacción periódica por voz — preguntas, conversación, alertas activas — funcionando como copiloto conversacional, no como distracción adicional.

Es un diferenciador de producto frente a otras apps de transporte, que no ofrecen esta capa conversacional.

## 2. Restricción de diseño no negociable

Un conductor manejando no puede tocar la pantalla ni leer texto. Toda la interacción debe ser 100% manos libres: activación por voz o un único botón físico/táctil grande (en el volante del soporte del teléfono o en pantalla, presionable sin mirar), respuesta por audio, sin necesidad de leer nada. Si el diseño obliga al conductor a mirar la pantalla, el asistente se vuelve un riesgo de seguridad vial en vez de una mitigación. Este punto condiciona toda decisión de UX posterior.

## 3. Arquitectura propuesta

```
App (Expo / React Native)
   │  audio stream (WebRTC o WebSocket)
   ▼
Backend NestJS (nuevo VoiceGateway, hermano de LocationGateway)
   │  autentica con el mismo JwtAuthGuard/WsJwtGuard ya existente
   │  reenvía el audio al proveedor de voz
   ▼
Proveedor de voz conversacional (STT + LLM + TTS integrados)
   │  responde con audio en streaming
   ▼
App reproduce el audio de vuelta
```

Puntos clave:

- El audio no se procesa en nuestro backend; el backend actúa como intermediario de autenticación y contexto (inyecta `tripId`, `role`, tarifa actual, ETA, etc. como contexto del sistema antes de reenviar al proveedor), evitando exponer credenciales del proveedor de voz en el cliente.
- Reutiliza la infraestructura de auth ya construida (JWT, guards) en vez de crear un sistema paralelo.
- Vive como un servicio separado del `LocationGateway` para no acoplar lógica de voz con lógica de viajes, pero puede compartir el mismo namespace de Socket.IO si conviene operativamente.

## 4. Comparación de proveedores (voz conversacional de extremo a extremo)

| Proveedor | Costo aproximado | Fortalezas | Riesgos |
|---|---|---|---|
| **OpenAI Realtime API** (`gpt-realtime-2` / `gpt-realtime-mini`) | Cobra por tokens de audio: ~$0.18–$0.46/min sin caché; $0.05–$0.10/min con prompt caching activado. El audio de salida cuesta el doble que el de entrada. | Mejor calidad conversacional y latencia; fácil de integrar vía WebSocket; permite function calling (ej. "cambia mi destino") | Costo variable y más difícil de presupuestar; requiere afinar caching para controlar gasto |
| **ElevenLabs Conversational AI** | Desde $0.08–$0.10/min (según plan), facturado por duración de la llamada, no por cómputo | Voces muy naturales, fácil de configurar agentes con personalidad definida | El costo del LLM subyacente hoy lo absorbe ElevenLabs pero puede trasladarse a futuro; precio fijo por minuto es más predecible que OpenAI |
| **Deepgram Voice Agent API** (STT+LLM+TTS todo en uno) | ~$0.075/min tarifa plana | Precio más predecible y bajo de los tres; buena latencia | Calidad de voz/conversación algo por debajo de ElevenLabs/OpenAI en naturalidad |
| **Stack armado a mano** (Twilio + Deepgram STT + LLM propio + TTS) | ~$0.02–$0.03/min en infraestructura de telefonía/STT, más el costo del LLM aparte | Máximo control y flexibilidad | Mucho más trabajo de integración; no lo recomiendo para un MVP |

**Recomendación para el MVP**: Deepgram Voice Agent API o ElevenLabs Conversational AI. Ambos dan precio por minuto predecible (crítico para modelar el costo por viaje) y evitan construir el pipeline STT→LLM→TTS a mano. Entre los dos, ElevenLabs si la calidad/naturalidad de la voz es prioritaria (mejor para el caso "entretener al pasajero"); Deepgram si el costo por minuto es la variable más sensible (mejor para el caso "conductor conectado horas").

## 5. Caso de uso: pasajero

- Activación: botón de micrófono en `MapScreen` durante un viaje activo.
- Contexto que el backend inyecta al iniciar la sesión de voz: nombre del pasajero, `tripId`, origen/destino, tarifa, ETA, nombre del conductor.
- Ejemplos de interacción: "¿Cuánto falta para llegar?", "¿Puedes decirle al conductor que espere un momento?" (esto último requeriría function calling que dispare `sendMessage` en el `LocationGateway` existente), o simplemente charla casual/trivia si el pasajero lo pide.
- Nivel de esfuerzo: medio. Reutiliza pantallas y estado ya existentes en `app-pasajero/src/screens/MapScreen.js`.

## 6. Caso de uso: conductor (alerta anti-somnolencia)

Este es el caso más delicado y el que más valor de producto tiene.

- **Activación por tiempo/contexto**, no solo manual: el asistente inicia conversación proactivamente cada cierto intervalo (configurable, ej. cada 8–10 minutos) durante viajes largos, o si el backend detecta señales de fatiga.
- **Señales de fatiga posibles** (por fases, de más simple a más compleja):
  1. *Fase 1 (MVP)*: tiempo continuo conectado sin pausas (ya lo sabemos por `LocationService`/`TripsService`) — si el conductor lleva N horas seguidas, el asistente sube la frecuencia de interacción.
  2. *Fase 2*: patrones de movimiento erráticos usando los datos de ubicación que ya se emiten por `updateLocation` (frenadas bruscas, zigzag) como proxy indirecto de fatiga.
  3. *Fase 3 (opcional, más invasiva)*: acceso al acelerómetro/giroscopio del teléfono vía Expo Sensors para detectar microsueños por movimiento del dispositivo — requiere consentimiento explícito adicional y es más intrusivo; no lo pondría en el MVP.
- **Diseño de la interacción**: preguntas simples que requieren respuesta activa ("¿cómo vas?", trivia rápida, pedirle que repita algo) en vez de música/ruido pasivo — la respuesta activa es lo que de verdad ayuda a mantener alerta, no solo el sonido de fondo.
- **Salida de emergencia**: si el conductor no responde en absoluto tras 2-3 intentos, se podría (fase futura) sugerir al conductor tomar una pausa y, opcionalmente, notificar al panel-admin como alerta de seguridad — esto último es una decisión de producto que hay que tomar con cuidado (¿se lo decimos al conductor que esto pasa? sí, siempre, de forma transparente).

## 7. Privacidad y marco legal (Colombia)

- El procesamiento de voz implica datos personales sensibles bajo la Ley 1581 de 2012 (Habeas Data). Se necesita consentimiento explícito e informado antes de activar el micrófono, con opción de rechazar sin perder acceso al resto de la app.
- Definir política de retención: ¿se graba y guarda el audio, o solo se transmite en vivo sin persistencia? Recomendación inicial: no persistir audio crudo, solo transcripciones si son necesarias para soporte, con expiración corta.
- Si en el futuro se usan sensores del teléfono (fase 3 de detección de fatiga), eso exige un consentimiento separado y más explícito por ser más invasivo.

## 8. Fases de implementación sugeridas

1. **Fase 0 — Prueba de concepto** (1–2 semanas): integrar el proveedor elegido en una sola pantalla de `app-conductor`, sin backend intermedio, para validar latencia y calidad de voz en español antes de invertir en la arquitectura completa.
2. **Fase 1 — MVP pasajero**: `VoiceGateway` en el backend + botón de voz en `MapScreen` de app-pasajero, con contexto de viaje inyectado.
3. **Fase 2 — MVP conductor**: interacción proactiva por tiempo conectado (señal de fatiga fase 1), sin sensores adicionales.
4. **Fase 3 — Señales de movimiento**: usar datos de ubicación ya existentes para afinar cuándo interviene el asistente.
5. **Fase 4 (opcional/futuro)** — sensores del teléfono y alertas al panel-admin.

## 9. Riesgos a tener presentes

- **Costo variable**: en viajes largos de conductor, el costo por minuto se acumula rápido — hay que definir quién lo paga (¿se descuenta de la comisión de DRI, o es un costo operativo fijo?) antes de lanzar a producción.
- **Latencia en zonas de mala señal**: si la conexión del conductor es inestable, un asistente que no responde a tiempo puede generar más frustración que ayuda — necesita manejo de reconexión robusto (ya existe patrón similar en `socket.service.js`).
- **Sobre-alertar**: si el asistente interrumpe demasiado seguido, se vuelve molesto y el conductor lo apaga — la frecuencia debe ser configurable y ajustable con datos reales de uso.
- **Español conversacional**: validar en la fase 0 que el proveedor elegido maneja bien acentos/modismos locales antes de comprometerse.

## 10. Próximos pasos

Para arrancar, defino que necesito de tu parte:

- Confirmar proveedor a probar primero (recomiendo empezar por ElevenLabs o Deepgram para la fase 0).
- Presupuesto aproximado que estás dispuesto a asignar por minuto de conversación, para descartar opciones.
- Confirmar si el foco inicial es conductor (alerta) o pasajero (entretenimiento) — recomiendo conductor primero porque es el diferenciador más fuerte y el de mayor impacto en seguridad.
