# Guía de componentes

Cómo se construyen los componentes de HubForge. Los tokens están en `DESIGN_SYSTEM.md`; el comportamiento en `UX_PRINCIPLES.md`; los tiempos en `ANIMATIONS.md`.

## Reglas de base

1. **La hoja, no la rejilla de tarjetas.** La estructura viene de filetes, alineación y agrupación. Una tarjeta solo se justifica cuando el objeto es realmente levantable, reordenable o accionable de forma independiente. Las tarjetas anidadas dentro de tarjetas están prohibidas.
2. **Ningún componente estándar dentro de una superficie comprometida.** Navegación, botones, inputs y enlaces se construyen en el vocabulario de este sistema, no se importan sin estilar.
3. **Semántica primero.** Un `button` real para acciones, un `a`/`Link` real para navegación, encabezados reales para estructura. ARIA solo donde la semántica nativa no llegue.
4. **Servidor por defecto.** Los componentes son Server Components salvo que necesiten interactividad o APIs de navegador. `"use client"` es una decisión deliberada.
5. **Composición antes que configuración.** Preferir componentes compuestos y slots antes que acumular props booleanas. Un componente con varias booleanas controlando su apariencia es señal de que hay que dividirlo.
6. **Toda cadena se traduce.** El texto se resuelve a través de `src/i18n/dictionaries`; los componentes reciben etiquetas en lugar de codificar texto. El patrón existente `ShellLabels` es el precedente.
7. **Sin acceso privilegiado a datos desde la presentación.** Los componentes visuales nunca tocan clientes privilegiados de Supabase; los datos llegan como props o a través de server actions.

## Guardrails de la metáfora

Vinculantes en todo componente. La versión completa y su justificación están en `DESIGN.md`; aquí quedan como criterio de revisión de código.

**La regla de la función.** Todo recurso del plano técnico debe representar un comportamiento real del producto. Si una línea, capa, anotación o marca no comunica un hecho, no se renderiza. Ante conflicto entre metáfora y comprensión, gana la comprensión.

- La metáfora nunca perjudica la legibilidad.
- Nada de líneas, retículas, coordenadas ni anotaciones decorativas de relleno.
- `LeaderLine` solo se monta cuando existe una relación real que comunicar, y recibe el origen y el destino reales. No se usa como separador ni como ornamento.
- El cuadro de rotulación declara contexto verdadero. Si en una superficie no tiene nada que declarar, se reduce; no se rellena con texto de adorno.
- `RevisionMark` requiere un cambio real con su marca temporal. Nunca se renderiza para dar sensación de actividad.
- Los conmutadores de capa corresponden a niveles reales de información o densidad, no a un adorno conmutable.
- Las líneas de dependencia solo se dibujan cuando ayudan a comprender una relación.
- No convertir cada contenedor en una caja técnica: la mayoría de las agrupaciones se resuelven con filete, alineación y espacio.
- Prohibida cualquier textura, ruido o efecto que reduzca el contraste.
- Jerarquía moderna, limpia y calmada. Herramienta contemporánea inspirada en ingeniería, nunca AutoCAD ni interfaz retroindustrial.
- Archivo se usa con moderación: cuadro de rotulación, titular de superficie y numeración estructural. Nunca en etiquetas, texto de controles ni filas de datos.
- El vermilion se reserva para actividad nueva, revisión, selección, foco, acción primaria y anotación activa. Si una pantalla se lee como «una interfaz naranja», está sobreextendido.

**Prueba de revisión.** Quita mentalmente todos los recursos de plano del componente. Si sigue siendo comprensible y utilizable, la metáfora añade significado sobre una base sólida. Si se vuelve ilegible, la metáfora estaba sosteniendo lo que debía sostener la jerarquía.

## Estados requeridos

Todo control interactivo implementa, y se revisa contra: **default, hover, focus-visible, active, disabled, loading** (donde aplique), y **mensajería de error / éxito**.

Además, toda superficie de datos implementa: **vacío, sin datos, cargando, parcial, error** y **no autorizado**.

Los estados vacíos son contenido redactado, no marcadores de posición. Explican qué va aquí, por qué está vacío y cuál es la única acción que lo rellena. Nunca contienen datos inventados. Donde se muestre contenido de demostración, se etiqueta: la insignia `Demo` existente es el patrón.

## Vocabulario de componentes

Superficies nombradas por este mundo. Cada una tiene un trabajo.

| Componente               | Trabajo                                                                                                                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cuadro de rotulación** | Declaración permanente de espacio de trabajo, proyecto, contexto activo y estado de revisión. Nunca desaparece al hacer scroll. Usa tipografía display y mono para los datos de máquina. |
| **Rail global**          | Navegación global compacta y estable en el borde izquierdo. Icono más nombre accesible; nunca se ensancha hasta ser una barra lateral etiquetada.                                        |
| **Panel contextual**     | Navegación secundaria y controles solo del contexto actual. Colapsable.                                                                                                                  |
| **Inspector**            | Superficie de detalle a la derecha para el objeto seleccionado. La selección revela el detalle aquí en lugar de navegar fuera.                                                           |
| **Command palette**      | Búsqueda y acción transversal sobre proyectos, tareas, personas, ramas y canales. Primero teclado, completamente operable sin puntero.                                                   |
| **Briefing**             | La superficie operativa de entrada. Resumen en prosa y después lista priorizada de acciones. Densidad baja.                                                                              |
| **Elemento de atención** | Una fila de la lista priorizada. Declara qué ocurrió, por qué importa, quién está implicado y qué acción está disponible.                                                                |
| **Marca de revisión**    | Señala lo que ha cambiado desde la última visita. Rol semántico propio, nunca estilado como advertencia.                                                                                 |
| **Línea de guía**        | Ata visualmente una anotación a su sujeto.                                                                                                                                               |
| **Fila anotada**         | La primitiva de lista densa: columnas alineadas, mono para datos de máquina, separadores de filete, sin envoltorio de tarjeta.                                                           |
| **Conmutador de capa**   | Sube o baja la densidad de información en el sitio, sin navegar.                                                                                                                         |
| **Pulso**                | Indicador honesto de actividad real: presencia, sincronización, cambios en vivo. Nunca se anima para insinuar actividad que no ocurrió.                                                  |

## Tipografía en componentes

- Los datos de máquina van siempre en mono: nombres de rama, hashes de commit, identificadores, marcas de tiempo, recuentos, duraciones y rutas de archivo. Es lo que hace separables de un vistazo la escritura humana y la verdad del sistema.
- Las columnas numéricas usan cifras tabulares y se alinean por el glifo.
- La tipografía display es para el cuadro de rotulación, la prosa del briefing y la identidad de sección. No se usa para etiquetas de interfaz.
- Las etiquetas usan el token `--text-label` en versalitas con tracking y nunca bajan de 11px.

## Botones y acciones

- Una única acción primaria por región de superficie. El acento le pertenece a ella.
- Las acciones destructivas son visualmente distintas, requieren confirmación y nunca están disponibles mediante arrastre.
- Los controles de solo icono llevan siempre nombre accesible, y se evitan donde la acción sea ambigua. Nunca se publica una acción de solo icono ambigua.
- El estado de carga deshabilita el control y anuncia el estado sin desplazar el layout.
- Las primitivas existentes `Button` y `Badge` de `src/components/ui` se extienden, no se sustituyen por completo: las variantes se añaden dentro de los tokens de este sistema.

## Formularios

- Todo input tiene una etiqueta visible y asociada. Los placeholders nunca son etiquetas.
- Los errores identifican el campo, declaran qué está mal y cómo arreglarlo. Se asocian programáticamente y se anuncian.
- La validación ocurre en la frontera de confianza con Zod en el servidor, independientemente de la validación en cliente.
- Los controles agrupados usan `fieldset` y `legend`. Los campos obligatorios se marcan con texto, no solo con color ni con un asterisco sin explicar.

## Tablas y listas densas

- Semántica real de `table` para datos tabulares: `th` con `scope`, y un `caption` o `aria-labelledby`. Las tablas nunca se usan para maquetar.
- Los separadores de fila son filetes tenues; las filas no son tarjetas.
- Los filtros persistentes y los detalles bajo demanda sostienen la densidad, en lugar de reducir el tamaño de letra.
- El estado de ordenación y filtrado se anuncia y se refleja en la URL cuando es compartible.

## Contrato de drag & drop

Se aplica a toda acción de arrastre sin excepción. La política de dónde se permite el arrastre está en `UX_PRINCIPLES.md`.

**Recursos obligatorios:** drag handle visible · previsualización fiel · zona de destino clara · indicador exacto de inserción · auto-scroll · animación de reordenación · confirmación visual · deshacer · alternativa por teclado · alternativa por menú contextual.

**Vía de teclado (equivalente, no plan B).** Ofrece mover arriba, mover abajo, mover a estado, mover a proyecto, cambiar prioridad y seleccionar destino. Antes de confirmar, enuncia el conjunto de dependientes afectados como una lista contada y revisable: la misma información que el remolque de dependencias transmite visualmente.

**Anuncios.** Agarre, movimiento, cambio de destino, confirmación y cancelación se anuncian mediante una live region con `role="status"`. Sin el truco de borrar y reinsertar con retardo fijo.

**Táctil.** Los objetivos cumplen el mínimo de 44px, el gesto tiene escape por cancelación de puntero, y el efecto de remolque se escala a distancias más cortas.

**Librería.** No hay ninguna instalada y no se añade ninguna antes de que una auditoría identifique el primer flujo prioritario real. La elección se hace después por compatibilidad con React 19, accesibilidad y reordenación animada. Una implementación casera no es aceptable.

## Iconos

- `lucide-react` para acciones universales, controles, navegación secundaria y estados comunes. Buscar, cerrar, editar, borrar y ajustes nunca se personalizan.
- La familia propia de dominio cubre espacio de trabajo, proyecto, pulso, bloqueo, flujo, repositorio conectado, contexto, disponibilidad, dependencia y centro operativo, dibujada con una sola gramática según se especifica en `DESIGN.md`.
- Los iconos decorativos llevan `aria-hidden`; los iconos con significado llevan nombre accesible.
- Los iconos nunca transmiten estado por sí solos: van acompañados de etiqueta.

## Motion en componentes

Los componentes consumen los tokens de duración de `ANIMATIONS.md` y nunca codifican tiempos a mano. Cada componente atiende `prefers-reduced-motion` de forma intencionada en lugar de confiar en la red de seguridad del CSS global. Solo se animan `transform` y `opacity`.

## Definición de terminado

Un componente está terminado cuando:

- Todos los estados requeridos están implementados y revisados visualmente en tema oscuro y claro.
- Es completamente operable por teclado con estado de foco visible, y verificado en modo forced-colors.
- No contiene ninguna cadena sin traducir.
- Sus datos llegan por props o server actions, sin acceso privilegiado desde la presentación.
- `pnpm lint`, `pnpm typecheck` y `pnpm test` pasan.
- La pasada de axe está limpia, y se ha hecho una pasada manual con teclado: las herramientas automáticas solo detectan una parte de lo que importa.
- Se han comprobado ambos modos de movimiento.
