type MessageTree = {
  [key: string]: string | MessageTree;
};

export const en = {
  common: {
    brand: "HubForge",
    signIn: "Sign in",
    openWorkspace: "Open workspace",
    open: "Open",
    demoMode: "Demo mode",
    signOut: "Sign out",
    mockData: "Mock data",
    language: "Language",
    english: "English",
    spanish: "Spanish",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    continue: "Continue",
  },
  nav: {
    marketing: "Marketing",
    problem: "Problem",
    product: "Product",
    security: "Security",
    app: "App",
    overview: "Overview",
    projects: "Projects",
    tasks: "Tasks",
    team: "Team",
    calendar: "Calendar",
    organization: "Organization",
  },
  landing: {
    headline: "Build together without losing context.",
    subtitle:
      "HubForge connects planning, availability, responsibilities, and GitHub activity in one collaborative workspace for small technical and creative teams.",
    enterDemo: "Enter demo workspace",
    signInPreview: "Sign in preview",
    boardProject: "Aurora Launch",
    boardOrg: "Northlight Studio",
    ready: "Ready",
    inProgress: "In progress",
    review: "Review",
    dropZone: "Drop zone",
    taskReady: "Availability calendar polish",
    taskProgress: "Build task board columns",
    taskReview: "Review access role matrix",
    problemsTitle: "Problems",
    problem1Title: "Work is scattered",
    problem1Body:
      "Plans live in one tool, availability in another, and GitHub activity somewhere else.",
    problem2Title: "Ownership is unclear",
    problem2Body:
      "Teams know the backlog exists, but not who can take the next critical task.",
    problem3Title: "Context gets lost",
    problem3Body:
      "Decisions, blockers, and chat drift away from the project they belong to.",
    productTitle: "One workspace for people, work, and signal",
    productSubtitle:
      "HubForge is not another generic task board. It keeps ownership, capacity, and technical activity readable in the same place.",
    cap1Title: "Roles that mean something",
    cap1Body:
      "Separate access permissions from functional responsibilities so leads, designers, and engineers stay aligned.",
    cap2Title: "Availability in the plan",
    cap2Body:
      "See who is free before you assign work. Calendar and capacity stay next to the board.",
    cap3Title: "GitHub without context loss",
    cap3Body:
      "Connect repositories later to sync issues and surface PR activity beside project ownership.",
    cap4Title: "Secure by default",
    cap4Body:
      "Organization boundaries, server-side authorization, and RLS-ready multi-tenant design from day one.",
    securityTitle: "Built for trust between organizations",
    securityBody:
      "Multi-tenant boundaries, least privilege, and audit-ready actions are part of the product foundation—not a later patch.",
    exploreDemo: "Explore the demo",
    footerTagline: "HubForge · collaborative project workspace",
    footerStatus: "Bootstrap phase · demo data only",
  },
  login: {
    title: "Sign in",
    body: "Continue with GitHub through Supabase Auth. Sessions are cookie-based and refreshed by the Next.js proxy.",
    continueGithub: "Continue with GitHub",
    enterDemo: "Enter demo workspace",
    configWarning:
      "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and a publishable/anon key to .env.local, then enable the GitHub provider.",
  },
  app: {
    demoWorkspace: "Demo workspace",
    openTasks: "Open tasks",
    members: "Members",
    unread: "Unread",
    latestNotifications: "Latest notifications",
    teamPresence: "Team presence",
    new: "New",
  },
  projects: {
    title: "Projects",
    subtitle:
      "Projects belong to an organization and carry their own members, roles, and boards.",
    organization: "Organization",
    create: "Create project",
    name: "Project name",
    description: "Description",
    emptyHint: "Create your first project to start planning work.",
  },
  organizations: {
    title: "Organizations",
    create: "Create organization",
    name: "Organization name",
    slug: "Slug",
    subtitle:
      "Organizations are the top-level tenant for projects, members, and permissions.",
    current: "Current organization",
    switchHint: "Demo mode stores organizations in this browser.",
    liveHint: "Signed-in workspaces persist in Supabase with RLS.",
  },
  onboarding: {
    title: "Set up your workspace",
    body: "Create an organization, then a project. Demo mode uses local data until you sign in.",
    stepOrg: "1. Organization",
    stepProject: "2. Project",
  },
  team: {
    title: "Team",
    subtitle:
      "Access roles control permissions. Functional roles describe what people do.",
    invite: "Invite member",
    email: "Email",
    accessRole: "Access role",
    functionalRole: "Functional role",
    pending: "Pending invitations",
    saveRoles: "Save roles",
    empty: "Invite teammates to this organization.",
  },
  tasks: {
    title: "Tasks",
    subtitle: "Create work, assign owners, and move cards across the board.",
    create: "Create task",
    taskTitle: "Title",
    description: "Description",
    priority: "Priority",
    assignee: "Assignee",
    emptyProject: "Select or create a project before managing tasks.",
    unassigned: "Unassigned",
  },
} as const satisfies MessageTree;

export type Dictionary = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
