---
description: Reglas de Oro Inquebrantables del Desarrollador (Decálogo + 7)
---

Este workflow asegura el cumplimiento de las 17 reglas fundamentales para el desarrollo de software colaborativo.
CUALQUIER PROYECTO DEBE COMENZAR E INTEGRAR ESTOS PASOS:

1.  **Define el Propósito Exacto**
    - [ ] ¿Está claro qué hace, para quién y qué resuelve?
    - [ ] Crea un documento `PROPOSITO.md`.

2.  **Esquema de Requisitos Inquebrantable**
    - [ ] Lista todas las funciones, entradas, salidas y límites.
    - [ ] Crea `REQUISITOS.md`.

3.  **Arquitectura Antes del Código**
    - [ ] Define stack: Lenguaje, DB, Frameworks.
    - [ ] Dibuja diagramas: Flujo, base de datos, módulos.
    - [ ] Crea `ARQUITECTURA.md`.

4.  **Divide y Vencerás (Micro-tareas)**
    - [ ] Desglosa en tareas atómicas con tiempo y dependencias.
    - [ ] Crea `PLAN_DE_TRABAJO.md`.

5.  **Cultura de Pruebas (Test First)**
    - [ ] Define la estrategia de testing (Unitarias, Integración, E2E).
    - [ ] Configura el entorno de pruebas ANTES de escribir lógica de negocio compleja.

6.  **Obsesión por el Código Limpio**
    - [ ] Configura linters y formatters (ESIint, Prettier, etc.).
    - [ ] Establece convención de nombres y estilo.

7.  **Seguridad por Diseño**
    - [ ] Lista validaciones críticas, cifrado necesario y modelo de permisos.
    - [ ] Añade `SECURIDAD.md` al plan inicial.

8.  **Control de Versiones y Documentación**
    - [ ] Inicializa git (`git init`).
    - [ ] Crea `README.md` con instrucciones de instalación y uso.
    - [ ] Asegura mensajes de commit descriptivos.

9.  **Revisiones Constantes**
    - [ ] Antes de cerrar una tarea, verifica: ¿El nombre de variable es claro? ¿Hay comentarios útiles?

---
*Si alguna de estas reglas se viola, el proyecto está en riesgo. Corrige inmediatamente.*
