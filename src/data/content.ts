export type Language = 'es' | 'en';
export type Theme = 'dark' | 'light';
export type Section = 'home' | 'about' | 'certs' | 'projects' | 'contributions';

export interface Project {
  t: string;
  c: 'WEB' | 'API'| 'NSM';
  u: string;
  d: { es: string; en: string };
  tags?: string[];
  stats?: {
    stars?: number;
    commits?: number;
    forks?: number;
  };
}

export interface Cert {
  t: string | { es: string; en: string };
  i: string;
  y: string | { es: string; en: string };
  c: 'EDU' | 'CERT' | 'INTERN';
  u: string;
}

export interface Content {
  role: string;
  bio: string;
  nav: {
    home: string;
    about: string;
    certs: string;
    projects: string;
    contributions: string;
  };
  profileTitle: string;
  profileSlogan: string;
  profileDesc: string;
  stackTitle: string;
  stackCategories: {
    secnet: string;
    automation: string;
    pipeline: string;
  };
  langTitle: string;
  projectsTitle: string;
  contributionsTitle: string;
  certsTitle: string;
  categories: {
    ALL: string;
    WEB: string;
    MOBILE: string;
    NSM: string;
    BACKEND: string;
    API: string;
    EDU: string;
    CERT: string;
    INTERN: string;
  };
  status: string;
  designedBy: string;
  tooltips: {
    github: string;
    linkedin: string;
    mail: string;
    theme: string;
  };
}

export const DATA = {
  name: "MARIANA",
  surname: "SINISTERRA",
  alias: "MARIANA-CODEBASE",
  githubUser: "Mariana-Codebase",
  contributionsSince: "2025-01-01",
  githubLanguages: {} as Record<string, string>,
  githubCategories: {
      "web-portfolio": "WEB",
      "github-api": "API"
      "NSM": "NSM"
  } as Record<string, string>,
  skills: {
    secnet: ["CCNAV7", "Network Analysis", "Hardware Security"],
    automation: ["Python", "Linux CLI", "Bash Scripting"],
    pipeline: ["AWS", "Docker", "Pipeline Hardening"]
  },
  langs: [
    { n: { es: "ESPAÑOL", en: "SPANISH" }, l: { es: "Nativo", en: "Native" } },
    { n: { es: "INGLÉS", en: "ENGLISH" }, l: { es: "Nativo", en: "Native" } }
  ],
  projects: [],
  certs: [
    { t: { es: "Ingeniería Informática", en: "Computer Engineering" }, i: "Politecnico Jaime Isaza Cadavid", y: { es: "En curso", en: "In progress" }, c: "EDU" as const, u: "#" },
    { t: { es: "Talento especializado Redes y Ciberseguridad", en: "Specialized Talent in Networks and Cybersecurity" }, i: "Universidad Nacional de Colombia", y: "2022", c: "EDU" as const, u: "/certificados/Universidad Nacional Redes y Ciberseguridad.pdf" },
    { t: { es: "Técnico en programación de software", en: "Software Programming Technician" }, i: "SENA", y: "2018", c: "EDU" as const, u: "/certificados/Técnico en programación de software.pdf" },
    { t: { es: "CCNAv7: Introducción a Redes", en: "CCNAv7: Introduction to Networks" }, i: "Universidad Nacional de Colombia / Cisco", y: "2023", c: "CERT" as const, u: "/certificados/1000085358 Certificado CCNA1.pdf" },
    { t: { es: "CCNAv7: Switching, Routing and Wireless Essentials", en: "CCNAv7: Switching, Routing and Wireless Essentials" }, i: "Universidad Nacional de Colombia / Cisco", y: "2023", c: "CERT" as const, u: "/certificados/1000085358 Certificado CCNA2.pdf" },
    { t: { es: "CyberOps Associate", en: "CyberOps Associate" }, i: "Universidad Nacional de Colombia / Cisco", y: "2023", c: "CERT" as const, u: "/certificados/1000085358 Certificado CO.pdf" },
    { t: { es: "Programación en Python", en: "Python Programming" }, i: "Universidad de los Andes (Coursera)", y: "2023", c: "CERT" as const, u: "/certificados/Programación en Phyton Uniandes.pdf" },
    { t: { es: "Introducción a la Seguridad Cibernética", en: "Introduction to Cybersecurity" }, i: "Universidad Nacional de Colombia / Cisco", y: "2022", c: "CERT" as const, u: "/certificados/1000085358 Certificado ICS.pdf" },
    { t: { es: "Cybersecurity Essentials", en: "Cybersecurity Essentials" }, i: "Universidad Nacional de Colombia / Cisco", y: "2022", c: "CERT" as const, u: "/certificados/1000085358 Certificado CSE.pdf" },
    { t: { es: "Ethical Hacking", en: "Ethical Hacking" }, i: "Hacker Mentor", y: "2022", c: "CERT" as const, u: "/certificados/Ethical Hacking.pdf" },
    { t: { es: "Internship Pragma", en: "Internship Pragma" }, i: "Pragma/ CUEE 2.0", y: "2023", c: "INTERN" as const, u: "/certificados/Pasantía Pragma.pdf" }
  ]
};

export const CONTENT: Record<Language, Content> = {
  es: {
    role: "Estudiante de Ingeniería Informática orientada a ciberseguridad",
    bio: "Enfocada en la intersección entre código, infraestructura y seguridad. Especializada en construir herramientas en Python para automatizar flujos de trabajo de seguridad y he contribuido parches de seguridad de nivel producción al ecosistema OpenClaw (v2026.2.24). Certificada CCNA, con un profundo interés en el análisis de redes y la seguridad de hardware. Actualmente evolucionando de builder a defender.",
    nav: { home: "INICIO", about: "PERFIL", certs: "FORMACIÓN", projects: "PROYECTOS", contributions: "CONTRIBUCIONES" },
    profileTitle: "/ Perfil Profesional",
    profileSlogan: "Código, infraestructura y seguridad.",
    profileDesc: "Estudiante de último año de Ingeniería Informática enfocada en la automatización de ciberseguridad e infraestructuras. Con certificación CCNAV7, diseño herramientas en Python para el endurecimiento de sistemas y la optimización de seguridad en pipelines CI/CD.",
    stackTitle: "Stack Tecnológico",
    stackCategories: {
      secnet: "Redes y seguridad",
      automation: "Automatización y herramientas",
      pipeline: "CI/CD y DevOps"
    },
    langTitle: "Idiomas",
    projectsTitle: "Proyectos_",
    contributionsTitle: "Contribuciones_",
    certsTitle: "Formación_",
    categories: { ALL: "TODOS", WEB: "WEB", NSM:"NSM", MOBILE: "MÓVIL", BACKEND: "BACKEND", API: "API", EDU: "EDUCACIÓN", CERT: "CERTIFICACIONES", INTERN: "PASANTÍAS" },
    status: "ESTADO: DEFENDER MODE",
    designedBy: "Diseñado y creado por",
    tooltips: { github: "GitHub", linkedin: "LinkedIn", mail: "Correo", theme: "Cambiar Tema" }
  },
  en: {
    role: "Computer Engineering student focused on security",
    bio: "Focused on the intersection of code, infrastructure, and security. I build Python-based tools to automate security workflows and have contributed production-level security patches to the OpenClaw ecosystem (v2026.2.24). CCNA certified with a deep interest in network analysis and hardware security. Currently evolving from a builder to a defender.",
    nav: { home: "HOME", about: "PROFILE", certs: "EDUCATION", projects: "PROJECTS", contributions: "CONTRIBUTIONS" },
    profileTitle: "/ Professional Profile",
    profileSlogan: "Securing the digital infrastructure.",
    profileDesc: "Final-year Computer Engineering student focused on cybersecurity and infrastructure automation. CCNAv7 certified. I build Python tools for system hardening and CI/CD pipeline security optimization.",
    stackTitle: "Security‑focused tech stack",
    stackCategories: {
      secnet: "Security & Networks",
      automation: "Automation & Tooling",
      pipeline: "CI/CD & DevOps"
    },
    langTitle: "Languages",
    projectsTitle: "Projects_",
    contributionsTitle: "Contributions_",
    certsTitle: "Education_",
    categories: { ALL: "ALL", WEB: "WEB", NSM:"NSM", MOBILE: "MOBILE", BACKEND: "BACKEND", API: "API", EDU: "EDUCATION", CERT: "CERTIFICATIONS", INTERN: "INTERNSHIPS" },
    status: "STATUS: DEFENDER MODE",
    designedBy: "Designed and created by",
    tooltips: { github: "GitHub", linkedin: "LinkedIn", mail: "Email", theme: "Switch Theme" }
  }
};
