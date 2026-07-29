# Diseño

<!-- Mundo visual de referencia de HubForge. PRODUCT.md tiene la verdad de producto. -->
<!-- Los encabezados H2 Overview / Colors / Typography / Elevation / Components / -->
<!-- Do's and Don'ts se mantienen en inglés a propósito: el parser de Impeccable -->
<!-- (lib/design-parser.mjs) los busca por nombre literal y en español no coinciden, -->
<!-- lo que dejaría al panel de diseño sin guía normativa. El contenido va en español. -->
<!-- Los tokens marcados como provisionales se fijan en la primera implementación. -->

## Overview

**TESIS.** HubForge es el plano de trabajo de un proyecto vivo: una única hoja donde cada dato está anotado en su sitio, y donde lo que ha cambiado desde que te fuiste está marcado sobre la hoja en lugar de enterrado en un feed. Rechaza la disposición que esta categoría siempre entrega —una barra lateral oscura y neutra envolviendo una rejilla de tarjetas de resumen, cada métrica sellada en su caja redondeada— y también su opuesto predecible, la app documental clara y aireada.

**MUNDO PROPIO.** Gramática de dibujo técnico renderizada como hoja oscura: fondos de grafito, filetes de un píxel que sostienen la estructura en lugar de bordes alrededor de cajas, líneas de guía que conectan físicamente una anotación con lo que anota, un cuadro de rotulación permanente que indica espacio de trabajo, proyecto y contexto, marcas de revisión que muestran qué cambió y cuándo, y conmutadores de capa que suben o bajan la densidad de información. La tipografía es una gótica de ingeniería para display (Archivo, ancha) sobre IBM Plex Sans para lectura e IBM Plex Mono para todo dato de máquina. Los neutros sostienen la superficie; un único acento de instrumento sostiene foco, selección y actividad.

**HISTORIA.** Un desarrollador abre HubForge tras cuatro días fuera, lee un briefing breve en prosa de lo que ha cambiado, ve las marcas de revisión sobre la hoja, y continúa el trabajo que dejó, sin abrir una segunda herramienta.

**PRIMER VIEWPORT.** Un rail global compacto en el borde izquierdo. Arriba, el cuadro de rotulación: espacio de trabajo, proyecto, contexto activo y el sello de revisión «desde tu última visita». El área principal abre con un briefing breve en prosa, compuesto en tipografía display a escala de lectura —no una fila de métricas— seguido de una única columna priorizada de elementos que requieren atención, cada uno anotado con qué ocurrió, por qué importa, quién está implicado y qué acción está disponible. La acción primaria, «Continuar donde lo dejaste», va justo debajo del briefing. Aquí la densidad es la más baja del producto; la hoja se vuelve más densa al profundizar en el trabajo.

**FORMA.** Dibujo técnico / plano anotado. Candidato 6 de la lista fundamentada, asignado por la semilla `c7b4c710` (`--scope direction --mode operate`). Puesta en escena comprometida: arrastre con peso (`interaction-physics-weighted-drag`), fusionada como movimiento consciente de dependencias. Los seis retadores repartidos por la tirada fueron rechazados por motivos factuales, al ser incompatibles con los compromisos de marca registrados y con una superficie Operate de ocho horas diarias.

### Lista fundamentada y rutina descartada

Rutina excluida deliberadamente de la candidatura: el dashboard SaaS oscuro y neutro con rejilla de tarjetas y un acento, y su opuesto, la app documental clara y minimalista.

Ordenados por resonancia con la audiencia: 1. consola de observabilidad · 2. diagrama de topología y dependencias · 3. fichas de control de tráfico aéreo · 4. consola de control de misión · 5. sistema de señalética y horarios suizo · **6. dibujo técnico / plano anotado (asignado, construido)** · 7. registrador de telemetría.

### Por qué este mundo sostiene el producto

| Requisito de producto                         | Recurso nativo de este mundo                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| «¿Qué ha cambiado desde mi última visita?»    | Marcas de revisión y tabla de revisiones: un registro formal y fechado de lo que cambió en la hoja |
| «Contexto siempre visible»                    | El cuadro de rotulación, que nunca se va                                                           |
| «Información conectada»                       | Líneas de guía que atan la anotación a su sujeto                                                   |
| «Densidad adaptativa»                         | Capas de dibujo, que se activan y desactivan sin salir de la hoja                                  |
| «Qué está bloqueado / dependencias»           | Líneas de cota y dependencia; el arrastre con peso                                                 |
| «Los neutros dominan, el color solo comunica» | El dibujo técnico es tinta monocroma por naturaleza                                                |
| «Motion preciso, mecánico, contenido»         | Movimiento de delineación: las líneas se extienden, las guías encajan, las capas se atenúan        |

## Colors

**Estrategia: contenida.** Los neutros son dueños de la superficie. Un único acento sostiene foco, selección, actividad y la acción primaria. Los colores semánticos son señales, no parte de la paleta de marca. El color nunca transmite significado por sí solo: siempre va acompañado de etiqueta, icono o posición.

El oscuro es el tema de origen porque el producto vive junto a un editor y una terminal oscuros durante sesiones de varias horas, donde la fatiga visual pesa más que la estética. El claro es un tema de primera clase y de igual calidad, no un añadido.

### Acento (decidido)

- **Drafting vermilion** (`#FF5C38`): el color de identidad. La tinta auténtica de marca de revisión.

Es el único acento de marca y se usa principalmente para actividad nueva, marcas de revisión, selección, foco, acciones principales, elementos que requieren atención sin implicar peligro, y conexiones o anotaciones activas.

No se usa como color genérico repartido por toda la interfaz. Debe seguir predominando una base monocromática de grafito, tinta y neutros técnicos: si al entornar los ojos la pantalla se lee como «una interfaz naranja», el acento está sobreextendido.

### Vermilion frente a peligro

`danger` debe distinguirse claramente del vermilion en **cuatro** ejes simultáneos, nunca solo en tono:

| Eje         | Vermilion (revisión / atención)                  | Danger (error / destructivo)                               |
| ----------- | ------------------------------------------------ | ---------------------------------------------------------- |
| Tono        | Naranja cálido, `#FF5C38`                        | Rojo carmesí desplazado hacia magenta, `#E2434F` en oscuro |
| Luminosidad | Brillante, sobre fondo transparente o tenue      | Más oscuro y saturado, con relleno más denso               |
| Iconografía | Marca de revisión, punto de pulso, línea de guía | Triángulo de alerta, círculo de error                      |
| Lenguaje    | «cambiado», «nuevo», «requiere revisión»         | «error», «ha fallado», «se eliminará»                      |

Nunca debe depender únicamente del color la distinción entre revisión, advertencia y error. Cada uno lleva su propio icono y su propia palabra.

### Rampa oscura (provisional)

Grafito, enfriado ligeramente para que nunca se lea como gris muerto. Los fondos se estratifican por elevación; los filetes sostienen la estructura para no necesitar cajas.

- **Fondo de hoja** (`#0B0E11`): `--hf-ground-0`, el fondo más profundo de la aplicación.
- **Superficie de trabajo** (`#11151A`): `--hf-ground-1`, el área donde ocurre la tarea.
- **Panel elevado** (`#171C23`): `--hf-ground-2`, paneles contextuales e inspector.
- **Campo hundido** (`#1F262F`): `--hf-ground-3`, inputs y campos de formulario.
- **Filete tenue** (`#232B34`): `--hf-rule-faint`, separadores de fila en listas densas.
- **Filete** (`#2E3844`): `--hf-rule`, límites de región y bordes de panel.
- **Filete fuerte** (`#3D4956`): `--hf-rule-strong`, cuadro de rotulación y divisiones estructurales primarias.
- **Tinta** (`#E6EAEF`): `--hf-ink`, texto primario.
- **Tinta atenuada** (`#A2ADBA`): `--hf-ink-muted`, texto secundario.
- **Tinta tenue** (`#6F7C8A`): `--hf-ink-faint`, solo metadatos no esenciales.

`--hf-ink` sobre `--hf-ground-0` apunta a un ratio de contraste superior a 15:1, y `--hf-ink-muted` superior a 7:1, cumpliendo el compromiso cercano a AAA para texto e información crítica. `--hf-ink-faint` se permite únicamente en metadatos no esenciales que nunca son el único portador de significado.

El tema claro refleja los mismos roles sobre un fondo blanco papel con tinta grafito, y debe verificarse contra los mismos ratios en lugar de derivarse por inversión.

### Señales semánticas

`success`, `warning`, `danger` e `info` mantienen tono, icono y etiqueta de texto distintos. `--hf-revision` marca lo cambiado desde la última visita y es un rol separado de `warning`.

## Typography

Tres cortes, cada uno con un trabajo definido. Ninguno es decorativo.

- **Display (Archivo):** títulos, encabezados estructurales, numeración, cuadros de rotulación y momentos de identidad. Una gótica de ingeniería con anchura y autoridad reales.
- **Body (IBM Plex Sans):** lectura, navegación, formularios, contenido y controles.
- **Mono (IBM Plex Mono):** código, commits, ramas, hashes, revisiones, fechas, estados técnicos y metadatos.

**Archivo se usa con moderación.** Es un recurso de jerarquía e identidad, no la voz de la aplicación. Como regla práctica, en una pantalla cualquiera Archivo no debería superar unas pocas apariciones: el cuadro de rotulación, el titular de la superficie y la numeración estructural. Ni las etiquetas de interfaz, ni el texto de los controles, ni las filas de datos usan Archivo.

La aplicación no debe adoptar una estética de plano técnico literal ni convertir la tipografía en un recurso temático excesivo. La referencia se siente en la gramática —alineación, notación, jerarquía—, no en una imitación superficial.

IBM Plex figura en la lista de caras por defecto de entrenamiento de Impeccable. Se conserva deliberadamente, por razones que ninguna otra cara satisface aquí: ya está integrada en todo el código, transmite honestamente el carácter técnico del producto, sus versiones Sans y Mono son hermanas métricamente relacionadas —de modo que los datos de máquina se alinean dentro de la prosa— y su legibilidad en sesiones largas está probada. Archivo sustituye a Sora como display para dar al sistema un punto de vista que IBM Plex por sí sola no aporta. Inter está prohibida.

La mono es un elemento de identidad estructural, no un acento: cualquier valor producido por la máquina va en mono, lo que hace que la escritura humana y la verdad del sistema sean visualmente separables en todas partes.

### Escala

`--text-display-lg` 32/38 · `--text-display` 24/30 · `--text-display-sm` 18/24 (Archivo) · `--text-body-lg` 16/24 · `--text-body` 14/20 · `--text-body-sm` 13/18 (Plex Sans) · `--text-label` 11/16 versalitas con tracking · `--text-mono` 13/20 · `--text-mono-sm` 12/18 (Plex Mono).

El tamaño mínimo de cuerpo es 13px y ningún texto de interfaz baja de 11px. Las cifras tabulares se activan siempre que los números se alineen en columnas.

## Elevation

La estructura la sostienen los filetes, no los bordes dibujados alrededor de cada elemento, y la elevación la sostiene la capa de fondo, no la sombra.

- Los filetes son de 1px a cualquier densidad. No engordan para señalar importancia: la jerarquía viene de los tokens de peso, no del tamaño.
- La elevación se expresa mediante capa de fondo (`--hf-ground-0` a `--hf-ground-3`) y peso de filete.
- Las sombras solo se permiten en superficies que realmente flotan —menús, popovers, previsualización de arrastre— y nunca como decoración.
- Sin degradados decorativos de fondo. Sin glassmorphism.
- Radio contenido: 4 en campos y badges, 6 en botones y elementos de menú, 10 en paneles y superficies flotantes. Nada es completamente redondo salvo avatares y píldoras genuinas.

## Components

Resumen normativo. Los contratos completos, los estados requeridos y la política de drag & drop viven en `docs/design/COMPONENT_GUIDELINES.md`.

La estructura la sostienen filetes, alineación y agrupación. Una tarjeta solo se justifica cuando el objeto es realmente levantable, reordenable o accionable de forma independiente; las tarjetas anidadas dentro de tarjetas están prohibidas. Ningún componente estándar sin estilar se publica dentro de una superficie comprometida.

| Componente           | Trabajo                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Cuadro de rotulación | Declaración permanente de espacio de trabajo, proyecto, contexto activo y estado de revisión; nunca desaparece al hacer scroll  |
| Rail global          | Navegación global compacta y estable en el borde izquierdo; nunca se ensancha hasta convertirse en una barra lateral etiquetada |
| Panel contextual     | Navegación secundaria solo del contexto actual; colapsable                                                                      |
| Inspector            | Superficie de detalle a la derecha; seleccionar revela el detalle aquí en lugar de navegar fuera                                |
| Command palette      | Búsqueda y acción transversal sobre todo el espacio de trabajo, primero teclado                                                 |
| Briefing             | Superficie operativa de entrada: resumen en prosa y después lista priorizada de acciones. Densidad baja                         |
| Elemento de atención | Una fila priorizada que declara qué ocurrió, por qué importa, quién está implicado y qué acción hay                             |
| Marca de revisión    | Señala lo cambiado desde la última visita; rol semántico propio, nunca estilado como advertencia                                |
| Línea de guía        | Ata una anotación a su sujeto                                                                                                   |
| Fila anotada         | Primitiva de lista densa: columnas alineadas, mono para datos de máquina, separadores de filete, sin envoltorio de tarjeta      |
| Conmutador de capa   | Sube o baja la densidad de información en el sitio, sin navegar                                                                 |
| Pulso                | Indicador honesto de actividad real; nunca se anima para insinuar actividad que no ocurrió                                      |

Todo control interactivo implementa los estados default, hover, focus-visible, active, disabled, loading y error/success. Toda superficie de datos implementa los estados vacío, sin datos, cargando, parcial, error y no autorizado. Los botones llevan una única acción primaria por región de superficie, y el acento le pertenece a ella.

Las primitivas existentes en `src/components/ui` se extienden dentro de estos tokens en lugar de sustituirse por completo.

## Do's and Don'ts

Cada prohibición se ha comprobado contra los materiales propios de este mundo, no se ha añadido para silenciar un detector.

**Do**

- Do mantener el logotipo de HubForge fuerte en el primer viewport de la superficie de marketing.
- Do sostener la estructura con filetes, alineación y agrupación.
- Do componer en mono todo valor producido por la máquina.
- Do reservar el acento para foco, selección, actividad y la acción primaria.
- Do acompañar todo estado semántico de tono, icono y etiqueta de texto.
- Do diseñar los estados vacíos como contenido redactado, explicando qué va aquí y cuál es la única acción que lo rellena.
- Do etiquetar el contenido de demostración allí donde alguien pudiera confundirlo con uso real.

**Don't**

- Don't usar clichés de dashboard de IA en morado sobre blanco, ni degradados morados.
- Don't usar azul corporativo genérico como acento.
- Don't usar la paleta de plantilla crema y terracota.
- Don't usar glassmorphism generalizado ni tarjetas anidadas dentro de tarjetas.
- Don't usar imaginería literal de forja, yunque, medieval, militar, ciencia ficción o cyberpunk.
- Don't usar degradados decorativos de fondo ni sombras pesadas para la elevación.
- Don't usar Inter.
- Don't usar textura fotográfica de papel de plano ni falso skeuomorfismo de delineación. Este mundo se compromete como notación y estructura, no como una fotografía de papel.
- Don't transmitir estado únicamente mediante color.

## Guardrails de la metáfora

Vinculantes. Su función es impedir que el mundo visual degenere en decoración temática. Ante cualquier conflicto entre la metáfora y la comprensión, gana la comprensión.

**La regla de la función.** Todo recurso del plano técnico debe representar un comportamiento real del producto. Si una línea, capa, anotación o marca no está comunicando un hecho, no se dibuja.

- La metáfora del plano técnico nunca debe perjudicar la legibilidad.
- No llenar la interfaz de líneas, retículas, coordenadas o anotaciones decorativas.
- Las líneas de guía solo aparecen cuando comunican una relación real.
- El cuadro de rotulación permanente debe aportar contexto útil, no ocupar espacio de forma ornamental. Si en una superficie no tiene nada verdadero que declarar, se reduce, no se rellena.
- Las marcas de revisión deben representar cambios reales. Nunca se muestran para dar sensación de actividad.
- Las capas deben corresponder a niveles reales de información o densidad, no a un adorno conmutable.
- Las líneas de dependencia solo aparecen cuando ayudan a comprender una relación.
- No convertir cada contenedor en una caja técnica.
- No utilizar textura, ruido ni efectos visuales que reduzcan el contraste.
- Mantener una jerarquía moderna, limpia y calmada.
- Debe sentirse como una herramienta contemporánea inspirada en ingeniería, no como AutoCAD ni como una interfaz retroindustrial.

**Prueba de la metáfora.** Si al quitar todos los recursos de plano la pantalla sigue siendo comprensible y utilizable, la metáfora está bien aplicada: está añadiendo significado sobre una base sólida. Si la pantalla se vuelve ilegible sin ellos, la metáfora estaba sosteniendo lo que debería sostener la jerarquía.

## Composición

- **La hoja, no la rejilla de tarjetas.** La estructura viene de filetes, alineación y agrupación.
- **El cuadro de rotulación es permanente.** Espacio de trabajo, proyecto, contexto activo y estado de revisión son siempre legibles sin navegar.
- **Las líneas de guía conectan.** Donde una anotación se refiere a un sujeto, se atan visualmente en lugar de quedar solo adyacentes.
- **Un único ritmo de espaciado** en todo el producto, con más espacio encima de un encabezado que debajo.
- **La alineación es la disciplina.** Las columnas numéricas y mono se alinean por sus glifos; el dibujo se lee como un sistema medido, no como una pila de componentes.
- **La densidad es una capa, no un valor de padding.** Los tres registros de densidad y la preferencia Comfortable/Compact están en `docs/design/DESIGN_SYSTEM.md`.

## Iconografía

Híbrida, por decisión deliberada. `lucide-react` sigue siendo la infraestructura para acciones universales, controles, navegación secundaria y estados comunes: buscar, cerrar, editar, borrar y ajustes permanecen familiares y nunca se personalizan.

Se dibuja una familia propia reducida para los conceptos que diferencian a HubForge: espacio de trabajo, proyecto, pulso o actividad, bloqueo, flujo, repositorio conectado, contexto, disponibilidad, dependencia y centro operativo.

Esa familia comparte una gramática: geometría consistente sobre rejilla de 24px, un único peso óptico igualado al trazo de lucide, terminales coherentes, proporciones comunes y un tratamiento reconocible de nodos, conexiones y estados, dibujado como notación técnica y no como glifos de lucide decorados. La identidad no puede depender de ornamentar un set de iconos universal.

## Documentos relacionados

`PRODUCT.md` · `docs/design/BRAND.md` · `docs/design/DESIGN_SYSTEM.md` · `docs/design/UX_PRINCIPLES.md` · `docs/design/ANIMATIONS.md` · `docs/design/COMPONENT_GUIDELINES.md`

`docs/design/design-system.md` queda sustituido por este documento y por `DESIGN_SYSTEM.md`; se conserva hasta que aterrice la primera implementación para que el registro existente siga siendo auditable.
