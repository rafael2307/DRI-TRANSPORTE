# Reglas Maestras del Proyecto de Software

Este documento establece los mandamientos inquebrantables para el desarrollo de software en este proyecto. Todo colaborador debe adherirse a estas reglas sin excepción.

## Las 10 Reglas Fundamentales (El Decálogo del Desarrollador)

1.  **Propósito Exacto y Definido**
    *   Define con precisión qué hace el software, para quién es y qué problemas resuelve.
    *   No escribas una sola línea de código sin tener esto claro y anotado.

2.  **Esquema de Requisitos Inquebrantable**
    *   Detalla todas las funciones, entradas, salidas y límites de uso.
    *   No dejes huecos ni ambigüedades; si no está definido, no se construye.

3.  **Arquitectura Antes del Código**
    *   Elige el stack tecnológico (lenguaje, base de datos, frameworks) con justificación.
    *   Dibuja diagramas de flujo, modelos de datos y módulos antes de abrir el editor.

4.  **Divide y Vencerás (Micro-tareas)**
    *   Desglosa el trabajo en tareas microscópicas.
    *   Cada tarea debe tener un tiempo estimado y dependencias claras.

5.  **Obsesión por el Código Limpio**
    *   Usa nombres descriptivos para variables y funciones.
    *   Comenta solo el "por qué" (pasos dudosos), no el "qué".
    *   Sigue la guía de estilo del proyecto al pie de la letra (linters, formatters).

6.  **Cultura de Pruebas (Testing First)**
    *   Prueba desde el minuto cero: unitarias, integración y de usuario.
    *   Automatiza todo lo que sea humanamente posible. Si no está probado, está roto.

7.  **Control de Versiones Disciplinado**
    *   Usa Git religiosamente.
    *   Cada cambio es un commit atómico con un mensaje que explique *qué* y *por qué*.

8.  **Documentación Viva**
    *   Manual de instalación, guías de uso, documentación de API/endpoints.
    *   La frase "ya lo sé yo" está prohibida. El conocimiento debe ser explícito y compartido.

9.  **Seguridad por Diseño**
    *   Implementa validaciones, cifrado y gestión de permisos desde el inicio.
    *   La seguridad no es un parche para el final; es parte de la arquitectura.

10. **Revisiones de Código (Code Reviews)**
    *   Nadie hace merge a `main` sin la revisión de un par.
    *   Acepta la crítica constructiva; el objetivo es la calidad del software, no el ego.

## Reglas Adicionales para la Excelencia

11. **Ciclo Iterativo y Mejora Continua**
    *   Repite el ciclo constantemente. Lanza, mide, aprende y ajusta.
    *   El software nunca está "terminado", siempre está evolucionando.

12. **Manejo de Errores y Observabilidad (Logging)**
    *   Captura y gestiona los errores de forma elegante; la aplicación no debe crashear sin explicación.
    *   Implementa logs estructurados para facilitar el depurado en producción.

13. **Automatización de Despliegues (CI/CD)**
    *   Configura pipelines de Integración y Despliegue Continuo.
    *   Evita los despliegues manuales propensos a error humano.

14. **Gestión de Entornos**
    *   Separa estrictamente los entornos: Desarrollo (Local), Pruebas (Staging) y Producción.
    *   Nunca uses datos de producción en entornos de desarrollo.

15. **Rendimiento y Escalabilidad**
    *   Diseña pensando en que el sistema crecerá.
    *   Optimiza consultas a base de datos y carga de recursos (assets) desde el principio.

16. **Accesibilidad e Inclusión**
    *   Asegura que la interfaz sea utilizable por personas con diferentes capacidades.
    *   Sigue los estándares WCAG (Web Content Accessibility Guidelines).

17. **Plan de Recuperación (Backup y Disaster Recovery)**
    *   Ten una estrategia clara de copias de seguridad automáticas.
    *   Define cómo recuperarse ante fallos catastróficos.

## Nuevas Reglas de Estrategia y Mantenimiento (Vitales)

18. **Inteligencia Competitiva y Tendencias**
    *   **Antes de empezar:** Revisa la competencia. ¿Qué hacen bien? ¿Qué hacen mal? Anótalo.
    *   **Cada 6 meses:** Escanea blogs, GitHub, Dribbble y foros para ver tendencias frescas. No te quedes obsoleto.

19. **Mantenimiento Proactivo ("El Pulmón del Proyecto")**
    *   **Chequeos Semanales:** Actualiza librerías, revisa logs de errores y busca bugs no reportados.
    *   **Anticipación:** Si una API externa cambia o un estándar muere, adáptate antes de que rompa tu sistema.

20. **Interacción Multimodal Obligatoria (Voz/Chat)**
    *   Todas nuestras aplicaciones deben incluir interfaz de voz y chat.
    *   El usuario debe tener el poder de elegir cómo interactuar con el sistema en todo momento.

21. **Cumplimiento Legal y Ético (Lo Omitido)**
    *   Asegura el cumplimiento de leyes locales (GDPR, Habeas Data, leyes laborales de transporte).
    *   Audita los algoritmos de asignación para evitar sesgos discriminatorios.
