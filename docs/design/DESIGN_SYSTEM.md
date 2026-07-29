# Sistema de diseño

Arquitectura de tokens y escalas de HubForge. El mundo visual y su justificación viven en `DESIGN.md`. Los valores marcados como provisionales se fijan en la primera implementación y se actualizan aquí cuando lo hagan.

## Arquitectura de tokens

Tres capas. Un componente nunca alcanza por encima de su capa para consumir una primitiva directamente.

```
primitiva         →  semántica          →  componente
--hf-graphite-900    --hf-ground-0         --hf-panel-bg
--hf-cyan-400        --hf-accent           --hf-focus-ring
```

1. **Primitiva.** Valores crudos sin significado: la rampa de grafito, la rampa de acento, las escalas brutas de tipo y espacio. Nunca las referencia un componente.
2. **Semántica.** Significado sin apariencia: `ground`, `rule`, `ink`, `accent`, `success`, `danger`, `revision`. Esta es la capa que conmuta entre tema oscuro y claro.
3. **Componente.** Ligada a una parte concreta: `--hf-panel-bg`, `--hf-focus-ring`, `--hf-drag-tow`. Se añade solo cuando un componente necesita un valor que su rol semántico no puede expresar.

Todos los tokens son propiedades personalizadas de CSS en `:root` y `[data-theme]`, consumidas a través del puente `@theme inline` de Tailwind v4. Esto preserva el prefijo `--hf-` existente y la conmutación por `data-theme` que ya está en `src/app/globals.css`.

Los temas se redactan, no se derivan. El tema claro se escribe y se verifica en contraste de forma independiente; no es una inversión algorítmica del oscuro.

## Color

Los roles semánticos y la rampa oscura están especificados en `DESIGN.md`. Las reglas que obligan aquí:

- Los neutros son dueños de la superficie. El acento aparece solo para foco, selección, actividad y la acción primaria.
- Todo estado semántico lleva tono **más** icono **más** etiqueta de texto. El color nunca es el único portador.
- `--hf-revision` es un rol propio. «Cambiado desde la última visita» no es una advertencia.
- La elevación se expresa con capa de fondo y peso de filete. Las sombras se permiten solo en superficies que realmente flotan (menús, popovers, previsualización de arrastre) y nunca como decoración.
- El texto y la información crítica apuntan a contraste cercano a AAA. `--hf-ink-faint` queda restringido a metadatos no esenciales.

## Escala tipográfica

Los cortes y su trabajo están definidos en `DESIGN.md`: Archivo (display), IBM Plex Sans (cuerpo), IBM Plex Mono (datos de máquina).

| Token               | Tamaño / interlínea           | Corte     | Uso                                                      |
| ------------------- | ----------------------------- | --------- | -------------------------------------------------------- |
| `--text-display-lg` | 32 / 38                       | Archivo   | Titular del briefing                                     |
| `--text-display`    | 24 / 30                       | Archivo   | Título de superficie, primario del cuadro de rotulación  |
| `--text-display-sm` | 18 / 24                       | Archivo   | Identidad de sección                                     |
| `--text-body-lg`    | 16 / 24                       | Plex Sans | Prosa del briefing, lectura larga                        |
| `--text-body`       | 14 / 20                       | Plex Sans | Texto de interfaz por defecto                            |
| `--text-body-sm`    | 13 / 18                       | Plex Sans | Texto secundario                                         |
| `--text-label`      | 11 / 16, tracking, versalitas | Plex Sans | Etiquetas del cuadro de rotulación, cabeceras de columna |
| `--text-mono`       | 13 / 20                       | Plex Mono | Datos de máquina en línea                                |
| `--text-mono-sm`    | 12 / 18                       | Plex Mono | Columnas mono densas                                     |

El tamaño mínimo de cuerpo es 13px, y ningún texto de interfaz baja de 11px. Las cifras tabulares se activan siempre que los números se alineen en columnas.

## Escala de espacio

Un único ritmo basado en 4px, aplicado en todo el producto. Más espacio encima de un encabezado que debajo.

`--space-1` 4 · `--space-2` 8 · `--space-3` 12 · `--space-4` 16 · `--space-5` 24 · `--space-6` 32 · `--space-7` 48 · `--space-8` 64

## Radio

Contenido, porque este mundo se construye con filetes y no con cajas redondeadas.

`--radius-sm` 4 (campos, badges) · `--radius-md` 6 (botones, elementos de menú) · `--radius-lg` 10 (paneles, superficies flotantes). Nada es completamente redondo salvo avatares y píldoras genuinas.

## Filetes y elevación

La estructura la sostienen los filetes, no bordes dibujados alrededor de cada elemento.

| Peso        | Token              | Uso                                                      |
| ----------- | ------------------ | -------------------------------------------------------- |
| Tenue       | `--hf-rule-faint`  | Separadores de fila en listas densas                     |
| Por defecto | `--hf-rule`        | Límites de región, bordes de panel                       |
| Fuerte      | `--hf-rule-strong` | Cuadro de rotulación, divisiones estructurales primarias |

Todos los filetes son de 1px a cualquier densidad. No engordan para señalar importancia: la jerarquía viene de los tokens de peso, no del tamaño.

## Registros de densidad

La densidad es una propiedad del trabajo de la superficie, no un valor global de padding. Tres registros, asignados por superficie.

| Registro                | Asignado a                                                                   | Carácter                                                             |
| ----------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Baja — orientación**  | Briefing operativo, onboarding, estados vacíos, vistas generales de proyecto | Calmada, muy jerarquizada, escala de lectura en prosa, aire generoso |
| **Media — exploración** | Actividad, documentación, detalle de proyecto, paneles de contexto           | Equilibrada; la agrupación y la alineación hacen el trabajo          |
| **Alta — ejecución**    | Backlog, tablas, gestión de tareas, repositorios, historial, revisiones      | Máxima información legible por pantalla                              |

La densidad se controla mediante jerarquía tipográfica, agrupación, alineación, contraste, revelado progresivo, paneles secundarios, filtros persistentes y detalles bajo demanda, **no** mediante el espaciado por sí solo. No se encierra cada dato en una tarjeta.

### Preferencia Comfortable / Compact

Sobre los registros se sitúa una preferencia de usuario persistente y accesible.

- Desplaza el espaciado y la altura de fila del registro en un paso documentado, y puede reducir `--text-body` a `--text-body-sm` únicamente en superficies de densidad alta.
- **Nunca** se implementa como un multiplicador global de padding.
- Ambos modos preservan la identidad del producto, las relaciones de la escala tipográfica, el sistema de filetes y todos los mínimos de área táctil.
- La preferencia persiste por usuario y se expone en ajustes y en el command palette.

## Áreas táctiles y puntero

El objetivo interactivo mínimo es de 44×44 píxeles CSS en táctil, y nunca menor de 32×32 con espaciado adecuado en punteros de precisión. El modo Compact no baja de estos suelos. Se soporta la cancelación de puntero: las acciones se confirman al soltar, no al pulsar.

## Foco

Un único tratamiento de foco inconfundible en todo el producto: contorno de 2px con `--hf-focus-ring` a 2px de desplazamiento, visible en todo elemento interactivo, en ambos temas y en modo forced-colors. El foco nunca se elimina, nunca se reduce a un cambio de color, y nunca depende solo del tono de acento para su visibilidad.

## Tokens de motion

Las duraciones y curvas las gobierna `ANIMATIONS.md` y se exponen como tokens (`--motion-feedback`, `--motion-micro`, `--motion-panel`, `--motion-structural`) para que los componentes nunca codifiquen tiempos a mano.

## Iconografía

El subconjunto de lucide es cerrado y documentado; añadir un icono de lucide es una decisión deliberada, no un import. Los iconos van sobre rejilla de 24px, con peso óptico igualado, y siempre acompañados de un nombre accesible. La familia propia de dominio y su gramática están especificadas en `DESIGN.md`.

## Verificación

Todo cambio de token se comprueba contra:

- Ratios de contraste en modo oscuro, claro y forced-colors.
- `pnpm test` y la suite de `@axe-core/playwright`.
- El detector de Impeccable: `node .cursor/skills/impeccable/scripts/detect.mjs <ruta>`.

Un token nunca se añade para silenciar un hallazgo del detector. Se gana su sitio por el mundo y por la legibilidad.
