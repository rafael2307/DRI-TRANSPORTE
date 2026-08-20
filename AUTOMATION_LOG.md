# Registro de automatizacion - DRI Transporte

Este archivo es la memoria entre corridas de la automatizacion (cada corrida es una sesion nueva sin recuerdo de las anteriores). Revisar aqui antes de empezar.

## 2026-08-20

- Se detecto que PLAN_DE_TRABAJO.md marca todas las fases como terminadas pero eso no es confiable: se encontraron ~83 menciones de TODO/FIXME/mock/placeholder/simulado en backend/, app-pasajero/, app-conductor/ y panel-admin/.
- - Primer avance real: PR #1 (rama rafael2307-patch-1) - se implemento RolesGuard real para reemplazar el TODO de conductor.controller.ts. Los endpoints GET /conductor/pending y PATCH /conductor/approve/:id ahora exigen rol admin (antes cualquier usuario autenticado podia verlos y aprobarlos). Incluye pruebas unitarias.
  - - Pendiente antes de mergear PR #1: correr npm test en backend/ para confirmar que todo pasa (no se pudo correr desde este entorno, solo se edito via navegador).
    - - Otros TODOs/mocks reales pendientes para las proximas corridas (no se tocaron todavia):
      -   - backend/src/ai/ai.service.ts: la extraccion de destino/tarifa es simulada (no usa Gemini todavia), destino default hardcodeado a "Girardot".
          -   - backend/src/payments/payments.service.ts, payments.controller.ts: revisar menciones de mock/simulado encontradas en la auditoria.
              -   - app-pasajero/src/screens y app-conductor/src/screens: varias pantallas (MapScreen, LoginScreen, RatingScreen, WithdrawalScreen, DashboardScreen) tienen TODOs/mocks sin revisar en detalle todavia.
                  -   - panel-admin/app/page.js, conductores/page.js, retiros/page.js: TODOs sin revisar en detalle todavia.
                      - - Nota tecnica: desde este entorno en la nube no se puede hacer git push ni usar la API de GitHub directamente (el proxy de la sesion solo autoriza repos preconfigurados). Todo el trabajo de codigo se hizo a mano vía el editor web de github.com, con el usuario presente.
                        - 

- Segundo avance en la misma sesion/PR #1: se aplico el mismo RolesGuard a payments.controller.ts, que tenia el TODO identico ("reemplazar por un RolesGuard('admin') real") en dos endpoints: PATCH /payments/config/free-status (cualquier usuario autenticado podia marcar una ruta como gratuita, afectando ingresos) y GET /payments/withdrawals/all (exponia TODOS los retiros de TODOS los usuarios a cualquier autenticado, no solo admin). Ambos ya exigen @Roles(UserRole.ADMIN).
- - Revisado el resto de payments.service.ts: la integracion con Wompi (checkout, verificacion de firma de webhook) ya esta implementada de verdad, no es mock - no hace falta tocarla.
  - - Siguiente candidato recomendado para la proxima corrida: backend/src/ai/ai.service.ts (extraccion de destino/tarifa simulada, sin Gemini real) - OJO: esto necesita credenciales/API key de Gemini que no estan disponibles en este entorno, hay que decidir con el usuario antes de tocarlo.
    - 

- CI real (GitHub Actions "Test Backend") corrio por primera vez sobre este PR y encontro un bug PRE-EXISTENTE no relacionado con estos cambios: backend/src/payments/payments.service.spec.ts fallaba (module.compile() no podia resolver TripRepository, dependencia agregada a PaymentsService que el archivo de test nunca actualizo). Esto confirma otra vez que el PLAN_DE_TRABAJO.md no es confiable. Se arreglo agregando el mock de Trip repository y una prueba extra para el caso de saldo insuficiente. Pendiente confirmar en el proximo check de CI que ahora pasa todo verde.
- 
