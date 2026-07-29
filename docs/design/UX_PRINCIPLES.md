# Principios de UX

Cómo se comporta HubForge. La verdad de producto está en `PRODUCT.md`; el mundo visual está en `DESIGN.md`.

## Principios

1. **Eliminar la fragmentación; nunca añadir un sitio más al que mirar.** Un cambio que introduce otra pantalla que revisar es una regresión, aunque la pantalla sea buena.
2. **Responder «¿qué está ocurriendo y qué debería hacer ahora?» sin que nadie lo pida.** El sistema filtra y prioriza. El usuario no debería tener que ensamblar la respuesta.
3. **Nunca perder el contexto.** Seleccionar, profundizar y navegar deben preservar dónde estaba el usuario. Nada que pueda mostrarse en el sitio abre una página nueva.
4. **Recuperar el contexto es la referencia.** El producto se juzga por lo rápido que alguien que ha estado días fuera vuelve a ser productivo.
5. **Calma bajo carga.** Un proyecto con mucha actividad nunca debe renderizar una interfaz ansiosa. El volumen se resume, agrupa y prioriza; nunca se vuelca.
6. **La ausencia se diseña.** Los estados vacíos y sin datos se redactan deliberadamente y nunca se rellenan con contenido inventado.
7. **La accesibilidad es el nivel de calidad.** Si no puede operarse por teclado, con foco claro y semántica honesta, está sin terminar.

## Modelo de navegación

La estructura existente —barra lateral ancha, más topbar, más navegación inferior móvil de ocho destinos— se retira. Representa páginas; HubForge navega áreas de trabajo conectadas.

### Tres niveles

1. **Espacio de trabajo**
2. **Proyecto**
3. **Contexto activo**

La navegación es contextual y progresiva. La navegación secundaria aparece únicamente dentro del contexto al que pertenece; el mapa completo nunca se muestra a la vez.

### Chrome de escritorio

| Elemento | Comportamiento |
| --- | --- |
| **Rail global** | Compacto, estable, siempre presente en el borde izquierdo. No es una segunda barra lateral ancha llena de iconos y texto. Contiene: Inicio operativo, Proyectos, Trabajo, Actividad, Equipo, Buscar / Command Center. |
| **Panel contextual** | Se despliega cuando el contexto actual lo necesita y se colapsa cuando no. |
| **Área principal de trabajo** | La hoja. Donde ocurre la tarea. |
| **Inspector** | Panel lateral derecho opcional para el detalle del objeto seleccionado. Seleccionar algo lo revela aquí en lugar de navegar fuera. |
| **Command palette** | La vía rápida transversal a cualquier cosa: proyecto, tarea, persona, rama, canal, acción. |

Dentro de un proyecto, la navegación contextual pasa a ser: Resumen, Trabajo, Repositorios, Actividad, Documentación, Equipo, Configuración.

La ubicación actual se mantiene comprensible mediante títulos, el cuadro de rotulación permanente y las transiciones, no mediante rastros de breadcrumbs interminables.

La aplicación debe sentirse como una herramienta de escritorio.

### Móvil

Máximo **cuatro** destinos primarios: Inicio, Proyectos, Actividad, Buscar. Todo lo demás vive dentro del contexto del proyecto o en un menú contextual. Los ocho destinos de escritorio nunca se replican en una barra de navegación inferior.

## El briefing operativo

La superficie de entrada es un briefing, no un panel de tarjetas ni un panel de analítica.

Responde en menos de diez segundos: qué ha cambiado, qué necesita mi atención, qué está bloqueado, qué puedo hacer ahora y dónde debería continuar.

**Orden:**

1. Resumen desde la última visita
2. Atención requerida
3. Trabajo en curso
4. Cambios recientes
5. Próximos pasos
6. Proyectos activos

La parte superior es un resumen editorial breve en prosa, no una fila de métricas. Por ejemplo: *«Desde tu última visita se han fusionado 3 pull requests, apareció un bloqueo en la API y 2 tareas requieren revisión.»*

Debajo se sitúa una única lista priorizada de acciones. Cada elemento declara cuatro cosas: **qué ocurrió, por qué importa, quién está implicado y qué acción está disponible.**

Siempre está presente una acción clara de **«Continuar donde lo dejaste»**.

La actividad nunca es un feed cronológico sin filtrar. Se agrupa por significado:

- Requiere atención
- Desbloquea trabajo
- Cambios relevantes
- Información secundaria

## Densidad

La densidad se asigna según el trabajo de la superficie, usando los tres registros definidos en `DESIGN_SYSTEM.md`: baja para orientación, media para exploración, alta para ejecución repetitiva. El briefing es calmado; el backlog es denso.

La densidad se consigue mediante jerarquía, agrupación, alineación, contraste, revelado progresivo, paneles secundarios, filtros persistentes y detalles bajo demanda, no reduciendo paddings. Una interfaz puede mostrar mucha información siempre que la jerarquía sea inequívoca.

La preferencia Comfortable / Compact es un ajuste de usuario que ambos modos deben sobrevivir con la identidad intacta.

## Interacción firma: movimiento consciente de dependencias

Mover trabajo revela sus consecuencias antes de confirmar el movimiento.

Agarrar un elemento hace aparecer los elementos que dependen de él, arrastrándose detrás en orden de dependencia. El trabajo muy referenciado se lee como más pesado y viaja más despacio. El usuario aprende el alcance real de una reordenación desde el primer tirón, y no de un diálogo de confirmación posterior.

- Soltar confirma el elemento y sus dependientes juntos.
- Un modificador corta dependencias concretas para dejar atrás a los dependientes; las dependencias cortadas quedan marcadas visiblemente hasta resolverse.
- El contenido no afectado se calma mientras el remolque lo cruza. Las zonas de destino declaran qué aceptan.
- **La vía de teclado es equivalente, no un plan B:** enuncia el conjunto de dependientes como una lista contada y revisable antes de confirmar.
- El táctil escala el efecto a distancias más cortas.

Este es el momento memorable del producto, y existe porque las dependencias y los bloqueos son lo que el usuario realmente necesita entender.

## Política de drag & drop

El drag & drop se implementa únicamente donde la acción es genuinamente espacial.

**Permitido:** reordenar tareas dentro de un estado, prioridad o sprint; mover tareas entre estados; reordenar bloques o secciones de documentación; ordenar prioridades; reorganizar elementos configurables de una vista; asignar trabajo cuando el gesto sea inequívoco y reversible.

**Prohibido:** navegación; acciones críticas; cambios de permisos; eliminación; cualquier operación irreversible; cualquier cosa que sea más rápida con un selector.

Toda acción de arrastre provee: drag handle visible, previsualización fiel, zona de destino clara, indicador exacto de inserción, auto-scroll, animación de reordenación, confirmación visual, deshacer, alternativa por teclado y alternativa por menú contextual.

La alternativa accesible debe ofrecer: mover arriba, mover abajo, mover a estado, mover a proyecto, cambiar prioridad y seleccionar destino.

**Secuencia:** no hay librería de drag & drop instalada, y no se añadirá ninguna antes de identificar por auditoría un único flujo prioritario real. La librería se elige después, por compatibilidad con React 19, accesibilidad y reordenación animada. Una implementación casera no es aceptable.

## Política responsive

El escritorio es el entorno principal y recibe la experiencia completa. La tablet es un entorno real de trabajo ligero. El móvil sirve para consulta, seguimiento y acción rápida.

**Objetivos móviles:** leer el briefing; entender qué ha cambiado; consultar proyectos; revisar actividad; responder o comentar; cambiar estados simples; asignar; aprobar o rechazar; recibir y resolver alertas; buscar; consultar detalles.

**No son objetivos móviles:** configuración compleja; edición masiva; planificación avanzada; administración de permisos; reorganizaciones extensas; edición compleja de documentación; gestión de tablas grandes; análisis detallado de repositorios.

El suelo móvil es funcional, no meramente visual. Ninguna pantalla puede romperse ni quedar inaccesible. Las tareas complejas pueden ofrecer una versión simplificada, redirigir a una vista específica, o informar con claridad de que se realizan mejor en escritorio, preservando siempre el acceso completo de lectura.

La tablet debe soportar paneles divididos, gestión de tareas, drag & drop, revisión, documentación y navegación contextual.

Una ventana estrecha acoplada junto al editor en un segundo monitor es una disposición explícitamente soportada, porque es el uso real descrito.

## Contrato de accesibilidad

Vinculante, enumerado en `PRODUCT.md` e implementado aquí.

- WCAG 2.2 AA es el suelo; se supera siempre que sea razonable.
- Contraste cercano a AAA para texto e información crítica.
- Toda la aplicación es operable solo con teclado, con orden de tabulación lógico y sin trampas de foco.
- Todo elemento interactivo tiene un estado de foco claro y visible.
- La información nunca se transmite solo mediante color.
- Toda acción de arrastre tiene equivalente por teclado y por menú contextual.
- Todo el motion respeta `prefers-reduced-motion`.
- Áreas táctiles amplias; cancelación de puntero soportada.
- Los errores son claros, específicos y accionables.
- Soporte sólido para lectores de pantalla: HTML semántico primero, ARIA solo donde la semántica no llegue, live regions para cambios de estado reales con la cortesía correcta.
- Verificado con `@axe-core/playwright`, pasadas solo con teclado, al menos un lector de pantalla y modo forced-colors. Las herramientas automáticas detectan aproximadamente un tercio de los problemas reales, así que las pasadas manuales forman parte de la definición de terminado.
