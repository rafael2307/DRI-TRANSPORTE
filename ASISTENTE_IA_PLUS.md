# Asistente de IA "Plus" - Voz y Chat (Pasajero y Conductor)

Este documento describe el diferenciador principal de DRI frente a Uber, Didi e inDrive: un asistente de inteligencia artificial por voz y chat, presente en ambas apps (pasajero y conductor), definido por el usuario el 2026-08-20.

## 1. Para el pasajero

- Interactua con el pasajero antes de pedir el servicio, durante el viaje, y despues de finalizado, siempre y cuando el pasajero asi lo quiera (debe poder apagarse/silenciarse).
- - Debe ser versatil en cualquier tema: puede entretener al pasajero, actualizarlo con noticias, o conversar sobre lo que el pasajero quiera durante el viaje.
 
  - ## 2. Para el conductor
 
  - - Interactua con el conductor antes de la inscripcion (onboarding), durante el proceso de inscripcion, y despues de ya estar inscrito.
    - - Se mantiene vigilante de la salud del conductor y de que este siempre alerta mientras conduce.
     
      - ## 3. Ideas adicionales propuestas (para discutir con el usuario)
     
      - ### Pasajero
      - - Modo silencio/solo musica vs modo conversacion, a eleccion del pasajero en cada viaje.
        - - Traduccion en tiempo real y deteccion automatica de idioma, util para turistas.
          - - Boton de panico activado por voz (ej. decir "ayuda") que dispara un protocolo de emergencia: comparte ubicacion en vivo con un contacto de confianza y/o con la central.
            - - Compania percibida como mas segura para personas que viajan solas, de noche, o adultos mayores.
              - - Accesibilidad: describir el entorno en voz alta para pasajeros con discapacidad visual.
                - - Recomendaciones del destino (clima, que hacer cerca) y resumen conversacional del viaje al finalizar, en vez de solo pedir estrellas.
                 
                  - ### Conductor
                  - - Onboarding conversacional guiado paso a paso: explica requisitos, ayuda a subir documentos, resuelve dudas frecuentes.
                    - - Chequeos periodicos breves de fatiga durante el viaje (preguntas cortas, tono de voz) cruzados con datos de conduccion (frenadas bruscas, velocidad erratica) ya disponibles via telemetria/GPS.
                      - - Recordatorios proactivos de pausas, hidratacion y descanso despues de X horas continuas conectado.
                        - - Deteccion de anomalias graves (el conductor no responde, suena confundido, patron de manejo compatible con accidente) que dispare una alerta automatica escalada a central/emergencias.
                          - - Coaching motivacional/gamificacion: metas diarias, tips para mejorar calificacion y ganancias.
                            - - Resolucion rapida de disputas de tarifa por chat antes de escalar a soporte humano.
                             
                              - ## 4. Consideraciones importantes
                             
                              - - El monitoreo de salud/alerta del conductor es informacion sensible: debe ser opt-in, transparente, con consentimiento explicito del conductor, y cumplir Habeas Data (ver Regla #21 en REGLAS_DEL_PROYECTO.md). No debe usarse para penalizar sin debido proceso - es una red de seguridad, no vigilancia punitiva.
                                - - Costo: el uso real de un LLM (Gemini) tiene costo por request; definir si el asistente completo es parte del servicio base o una funcion premium.
                                  - - Latencia: para que la voz se sienta natural mientras se conduce, se necesita streaming de baja latencia, no solo request/response.
                                   
                                    - ## 5. Relacion con el codigo actual
                                   
                                    - Hoy `backend/src/ai/ai.service.ts` es una simulacion (extraccion de destino/tarifa hardcodeada, sin conexion real a Gemini) - ver AUTOMATION_LOG.md. Este documento es el contexto de producto que debe guiar la implementacion real de ese servicio y de los nuevos endpoints/flujos que hagan falta para el conductor (onboarding conversacional, monitoreo de alerta).
                                    - 
