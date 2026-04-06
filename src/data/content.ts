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
    monitoring: string;
    automation: string;
    development: string;
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
      "github-api": "API",
      "NSM": "NSM"
  } as Record<string, string>,
  skills: {
    secnet: ["CyberOps Associate", "CCNAV7", "Burp Suite", "OWASP ZAP", "Nmap", "Metasploit", "Wireshark", "Network Analysis"],
    monitoring: ["Splunk", "OpenSearch", "Kibana", "Grafana", "SIEM", "Active Directory"],
    automation: ["Python", "Bash Scripting", "PowerShell", "Linux CLI"],
    development: ["FastAPI", "React", "TypeScript", "SQL", "MongoDB"]
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
    bio: "Enfocada en ciberseguridad y automatización. Contribuyo a código abierto en proyectos como OpenClaw, participo en Bug Bounty en HackerOne, busco vulnerabilidades y soluciones en sistemas reales.",
    nav: { home: "INICIO", about: "PERFIL", certs: "FORMACIÓN", projects: "PROYECTOS", contributions: "CONTRIBUCIONES" },
    profileTitle: "/ Perfil Profesional",
    profileSlogan: "Código, infraestructura y seguridad.",
    profileDesc: "CyberOps Associate y CCNAV7 Certified. En seguridad, trabajo en análisis de vulnerabilidades, ejercicios de Red Team, Active Directory, threat hunting y monitoreo con stacks como Splunk, OpenSearch y Grafana. En desarrollo, construyo APIs con FastAPI, automatizo con Python, Bash y PowerShell, y trabajo con React, TypeScript, SQL, MongoDB y Docker. Me muevo entre el rol ofensivo y el de desarrollo, entiendo los sistemas desde adentro y desde afuera.",
    stackTitle: "Stack Tecnológico",
    stackCategories: {
      secnet: "SECURITY & NETWORKS",
      monitoring: "THREAT HUNTING & MONITORING",
      automation: "AUTOMATION & TOOLING",
      development: "DEVELOPMENT"
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
    bio: "Focused on cybersecurity and automation. I contribute to open source projects like OpenClaw, participate in Bug Bounty on HackerOne, and look for vulnerabilities and solutions in real-world systems.",
    nav: { home: "HOME", about: "PROFILE", certs: "EDUCATION", projects: "PROJECTS", contributions: "CONTRIBUTIONS" },
    profileTitle: "/ Professional Profile",
    profileSlogan: "Securing the digital infrastructure.",
    profileDesc: "CyberOps Associate and CCNAv7 Certified. In security, I work on vulnerability analysis, Red Team exercises, Active Directory, threat hunting, and monitoring with stacks like Splunk, OpenSearch, and Grafana. In development, I build APIs with FastAPI, automate with Python, Bash, and PowerShell, and work with React, TypeScript, SQL, MongoDB, and Docker. I move between offensive security and development, understanding systems from both the inside and the outside.",
    stackTitle: "Security‑focused tech stack",
    stackCategories: {
      secnet: "Security & Networks",
      monitoring: "Threat Hunting & Monitoring",
      automation: "Automation & Tooling",
      development: "Development"
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
