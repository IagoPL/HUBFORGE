import type { Dictionary } from "@/i18n/dictionaries/en";

export const es = {
  common: {
    brand: "HubForge",
    signIn: "Iniciar sesión",
    openWorkspace: "Abrir espacio",
    open: "Abrir",
    demoMode: "Modo demo",
    signOut: "Cerrar sesión",
    mockData: "Datos de prueba",
    language: "Idioma",
    english: "Inglés",
    spanish: "Español",
    save: "Guardar",
    cancel: "Cancelar",
    create: "Crear",
    continue: "Continuar",
  },
  nav: {
    marketing: "Marketing",
    problem: "Problema",
    product: "Producto",
    security: "Seguridad",
    app: "App",
    overview: "Resumen",
    projects: "Proyectos",
    tasks: "Tareas",
    team: "Equipo",
    calendar: "Calendario",
    organization: "Organización",
  },
  landing: {
    headline: "Construid juntos sin perder el contexto.",
    subtitle:
      "HubForge conecta planificación, disponibilidad, responsabilidades y actividad de GitHub en un espacio colaborativo para equipos técnicos y creativos pequeños.",
    enterDemo: "Entrar al espacio demo",
    signInPreview: "Vista previa de acceso",
    boardProject: "Aurora Launch",
    boardOrg: "Northlight Studio",
    ready: "Listo",
    inProgress: "En curso",
    review: "Revisión",
    dropZone: "Zona de soltar",
    taskReady: "Pulir calendario de disponibilidad",
    taskProgress: "Construir columnas del tablero",
    taskReview: "Revisar matriz de roles de acceso",
    problemsTitle: "Problemas",
    problem1Title: "El trabajo está disperso",
    problem1Body:
      "Los planes viven en una herramienta, la disponibilidad en otra y la actividad de GitHub en otro sitio.",
    problem2Title: "La propiedad no está clara",
    problem2Body:
      "Los equipos saben que hay backlog, pero no quién puede asumir la siguiente tarea crítica.",
    problem3Title: "Se pierde el contexto",
    problem3Body:
      "Decisiones, bloqueos y conversaciones se alejan del proyecto al que pertenecen.",
    productTitle: "Un espacio para personas, trabajo y señal",
    productSubtitle:
      "HubForge no es otro tablero genérico. Mantiene ownership, capacidad y actividad técnica legibles en el mismo lugar.",
    cap1Title: "Roles con significado",
    cap1Body:
      "Separa permisos de acceso de responsabilidades funcionales para alinear leads, diseño e ingeniería.",
    cap2Title: "Disponibilidad en el plan",
    cap2Body:
      "Mira quién está libre antes de asignar trabajo. Calendario y capacidad junto al tablero.",
    cap3Title: "GitHub sin perder contexto",
    cap3Body:
      "Conecta repositorios más adelante para sincronizar issues y ver PRs junto a la ownership del proyecto.",
    cap4Title: "Seguro por defecto",
    cap4Body:
      "Límites entre organizaciones, autorización en servidor y diseño multi-tenant con RLS desde el primer día.",
    securityTitle: "Hecho para confiar entre organizaciones",
    securityBody:
      "Límites multi-tenant, mínimo privilegio y acciones auditables forman parte de la base del producto.",
    exploreDemo: "Explorar la demo",
    footerTagline: "HubForge · espacio colaborativo de proyectos",
    footerStatus: "Fase bootstrap · solo datos demo",
  },
  login: {
    title: "Iniciar sesión",
    body: "Continúa con GitHub mediante Supabase Auth. Las sesiones van en cookies y se renuevan con el proxy de Next.js.",
    continueGithub: "Continuar con GitHub",
    enterDemo: "Entrar al espacio demo",
    configWarning:
      "Supabase aún no está configurado. Añade NEXT_PUBLIC_SUPABASE_URL y una clave publishable/anon en .env.local y activa el proveedor de GitHub.",
  },
  app: {
    demoWorkspace: "Espacio demo",
    openTasks: "Tareas abiertas",
    members: "Miembros",
    unread: "Sin leer",
    latestNotifications: "Últimas notificaciones",
    teamPresence: "Presencia del equipo",
    new: "Nueva",
  },
  projects: {
    title: "Proyectos",
    subtitle:
      "Los proyectos pertenecen a una organización y tienen sus propios miembros, roles y tableros.",
    organization: "Organización",
    create: "Crear proyecto",
    name: "Nombre del proyecto",
    description: "Descripción",
    emptyHint: "Crea tu primer proyecto para empezar a planificar el trabajo.",
  },
  organizations: {
    title: "Organizaciones",
    create: "Crear organización",
    name: "Nombre de la organización",
    slug: "Slug",
    subtitle:
      "Las organizaciones son el tenant superior para proyectos, miembros y permisos.",
    current: "Organización actual",
    switchHint: "En modo demo las organizaciones se guardan en este navegador.",
  },
  onboarding: {
    title: "Configura tu espacio",
    body: "Crea una organización y después un proyecto. Puedes seguir con datos demo hasta conectar Supabase.",
    stepOrg: "1. Organización",
    stepProject: "2. Proyecto",
  },
} as const satisfies Dictionary;
