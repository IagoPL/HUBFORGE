# Motion

El motion es un diferenciador de HubForge, pero permanece subordinado a la orientación, la continuidad y la confirmación. Nada de animación decorativa.

Su propósito es hacer que HubForge se sienta como un sistema continuo y no como un conjunto de rutas web independientes.

## Firma de movimiento

HubForge se mueve **preciso, rápido y contenido. Mecánico, pero no rígido.**

- Sin rebotes excesivos.
- Sin desplazamientos largos.
- Sin animación de entrada para todo.
- La interacción nunca se bloquea esperando a que termine una animación.

## Para qué sirve el motion

- Mantener la continuidad entre contextos.
- Mostrar relaciones entre elementos.
- Explicar cambios de jerarquía.
- Reforzar estados.
- Visualizar reordenaciones.
- Conectar un origen con su destino.
- Reducir la sensación de navegar entre páginas separadas.

## Tokens de duración

| Token | Rango | Se aplica a |
| --- | --- | --- |
| `--motion-feedback` | 80–140 ms | Feedback inmediato: pulsación, conmutación, confirmación de hover |
| `--motion-micro` | 140–200 ms | Microinteracciones |
| `--motion-panel` | 180–260 ms | Paneles, menús, cambios de contexto |
| `--motion-structural` | 240–360 ms | Transiciones estructurales entre estados principales |

Los componentes consumen estos tokens y nunca codifican tiempos a mano.

**Curvas.** El movimiento usa una curva desacelerada para las entradas y acelerada para las salidas. Nada sobrepasa su destino salvo un único asentamiento documentado en la confirmación de soltado. Sin física de resorte con oscilación visible.

## Capa 1 — Orientación y continuidad (View Transitions)

Las View Transitions de React 19 gobiernan las transiciones donde el usuario se mueve entre vistas relacionadas. Es el mecanismo antifragmentación hecho visible.

Se usan para:

- Proyecto a detalle de proyecto.
- Lista a elemento.
- Apertura de una entidad.
- Continuidad de títulos, avatares y contenedores a través de la transición.
- Transiciones entre estados principales.

Los elementos compartidos conservan su identidad al cruzar el límite: el título, el avatar y el contenedor que el usuario ya estaba mirando viajan a su nueva posición en lugar de destruirse y recrearse. El contexto anterior permanece legible durante la transición.

## Capa 2 — Vitalidad del sistema (Motion)

`motion` v12 gobierna todo lo que ocurre dentro de una vista.

Se usa para:

- Microinteracciones.
- Paneles y menús.
- Reordenación.
- Drag & drop.
- Feedback.
- Entrada y salida de elementos.
- Cambios de filtros.
- Estados de carga.

La vitalidad se comunica honestamente: la actividad en tiempo real, la presencia y la sincronización con GitHub pueden animarse porque algo ha ocurrido de verdad. Nada se anima para insinuar actividad que no existe. Las interfaces en reposo están quietas.

## Capa 3 — Momentos firma

Un conjunto pequeño y deliberado de momentos orquestados. Todo lo demás permanece discreto.

1. **El remolque de dependencias.** Agarrar un elemento lo inclina antes de moverlo, y después abre en abanico sus dependientes detrás, en orden de dependencia. El contenido no afectado se calma mientras el remolque lo cruza. Al soltar, el elemento y sus dependientes se asientan juntos como un único movimiento confirmado. Este es el momento memorable del producto.
2. **La revelación de revisión.** En el primer briefing de la sesión, lo que ha cambiado desde la última visita se marca sobre la hoja: las marcas de revisión se dibujan una vez, en secuencia por importancia, y después se quedan quietas. Ocurre una vez por sesión, nunca en cada render.
3. **La línea de guía.** Cuando una anotación se ata a su sujeto, la línea de conexión se extiende desde el origen hasta el destino en lugar de aparecer. Movimiento de delineación, aproximadamente `--motion-micro`.

## Carga y latencia

La velocidad percibida es un atributo de marca, así que el motion se usa para hacer legible la espera, no para entretener.

- Preferir UI optimista y esqueletos que coincidan con el layout real antes que spinners.
- Nada se anima por debajo de unos 120 ms de espera real; un destello de animación es peor que ninguna.
- Nunca animar un desplazamiento de layout. Reservar el espacio antes de que llegue el contenido.
- El contenido es visible por defecto; los efectos costosos están acotados y nunca condicionan la legibilidad.

## Presupuesto de rendimiento

- Animar únicamente `transform` y `opacity`. Nunca animar propiedades de layout.
- Ninguna animación se ejecuta indefinidamente. El motion ambiental o en bucle está prohibido.
- Las animaciones concurrentes están acotadas: una reordenación de lista anima las filas afectadas, no todas.
- El motion nunca retrasa la interactividad. Una entrada durante una animación la interrumpe y se atiende de inmediato.
- Las listas largas reducen o eliminan el motion por elemento antes que perder fotogramas.

## Movimiento reducido

`prefers-reduced-motion: reduce` es una vía de primera clase, no un interruptor que degrada la calidad.

- Las transformaciones se sustituyen por cambios instantáneos o fades mínimos.
- Las View Transitions se desactivan; los cambios de estado se confirman de inmediato.
- El remolque de dependencias se convierte en una lista estática y contada de dependientes afectados, mostrada antes de confirmar, que es exactamente la misma información que transmite la animación.
- La revelación de revisión se renderiza ya marcada, sin dibujado progresivo.
- No se pierde ninguna funcionalidad, información ni confirmación en modo de movimiento reducido. Todo lo que comunicaba la animación está disponible como texto o estado.

La regla global de movimiento reducido que ya existe en `src/app/globals.css` es una red de seguridad, no la implementación. Cada componente atiende la preferencia de forma intencionada.

## Verificación

- Todo componente animado se prueba en ambos modos de movimiento.
- La operación por teclado se verifica durante y después de la animación.
- Los flujos de reordenación y arrastre se verifican con lector de pantalla para comprobar los anuncios de estado correctos.
