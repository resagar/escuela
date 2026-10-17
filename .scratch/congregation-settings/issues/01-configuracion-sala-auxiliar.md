# 01: Ajuste de congregación «sala auxiliar»: fundación + pantalla

**Qué construir:** El Superintendente puede declarar, desde una pantalla nueva de **Configuración**, si la congregación tiene sala auxiliar, y el valor persiste entre sesiones. Por defecto el ajuste queda en "tiene sala auxiliar", sin cambiar el comportamiento actual. Incluye: tabla singleton con migración idempotente, comandos de lectura/actualización con tests unitarios, la pantalla con el interruptor, su entrada en la navegación con breadcrumb, y el helper del flag efectivo que consumirán los tickets 02–04. Actualiza la documentación: `requirements.md`, `architecture.md` y `schemaDB.md`.

**Bloqueado por:** Nada (puede empezar ya).

**Status:** resuelto (2026-10-16) — integrado en `feat/congregation-settings` (merge `fd426b4`); migración idempotente y tests del módulo de settings en verde (`cargo test` 5/5); pasada visual del interruptor queda para el usuario

- [x] Una BD existente migra sin errores y el ajuste por defecto es "tiene sala auxiliar" (el comportamiento actual no cambia).
- [x] La ruta `/configuracion` es accesible desde el nav principal y el breadcrumb es correcto.
- [x] El interruptor persiste: off → reiniciar la app → sigue off; on → sigue on.
- [x] Tests unitarios del módulo de settings: default en BD nueva, migración idempotente al reabrir, update → get devuelve el nuevo valor, y el valor sobrevive a la reapertura.
- [x] El helper del flag efectivo (`has_auxiliary_room && requiere_sala_auxiliar`) existe como pieza compartida.
- [x] `requirements.md` (sección de configuración de congregación), `architecture.md` y `schemaDB.md` actualizados.
