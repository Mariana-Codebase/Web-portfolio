export type Language = 'es' | 'en';
export type Theme = 'dark' | 'light';
export type Section = 'home' | 'about' | 'certs' | 'projects';

export interface Project {
  t: string;
  c: 'WEB' | 'MOBILE' | 'BACKEND';
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
  };
  profileTitle: string;
  profileSlogan: string;
  profileDesc: string;
  stackTitle: string;
  stackCategories: {
    frontend: string;
    backend: string;
    cloud: string;
  };
  langTitle: string;
  projectsTitle: string;
  certsTitle: string;
  categories: {
    ALL: string;
    WEB: string;
    MOBILE: string;
    BACKEND: string;
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
    leetcode: string;
    theme: string;
  };
}

export const DATA = {
  name: "MARIANA",
  surname: "SINISTERRA",
  alias: "MARIANA_DEV",
  githubUser: "Mariana-Codebase",
  githubLanguages: {
    "web-portfolio": "React · TypeScript · Vite · Tailwind · Three.js"
  },
  githubCategories: {
    "web-portfolio": "WEB"
  },
  skills: {
    frontend: ["React", "TypeScript", "TailwindCSS"],
    backend: ["Node.js", "Python", "GraphQL"],
    cloud: ["AWS", "Docker"]
  },
  langs: [
    { n: { es: "ESPAÑOL", en: "SPANISH" }, l: { es: "Nativo", en: "Native" } },
    { n: { es: "INGLÉS", en: "ENGLISH" }, l: { es: "Avanzado", en: "Advanced" } }
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
    role: "Desarrolladora Full-Stack",
    bio: "Estudiante de Ingeniería Informática. Actualmente exploro la intersección entre el código y la infraestructura, utilizando Python para crear herramientas que hagan los procesos más ágiles y seguros. En constante evolución técnica.",
    nav: { home: "INICIO", about: "PERFIL", certs: "FORMACIÓN", projects: "PROYECTOS" },
    profileTitle: "/ Perfil Profesional",
    profileSlogan: "Ingeniería que conecta.",
    profileDesc: "Como Desarrolladora Full-Stack, me enfoco en crear soluciones técnicas que no solo funcionen, sino que escalen. Mi experiencia abarca desde el frontend interactivo hasta arquitecturas backend robustas.",
    stackTitle: "Stack Tecnológico",
    stackCategories: {
      frontend: "Frontend",
      backend: "Backend",
      cloud: "Cloud & DevOps"
    },
    langTitle: "Idiomas",
    projectsTitle: "Proyectos_",
    certsTitle: "Formación_",
    categories: { ALL: "TODOS", WEB: "WEB", MOBILE: "MÓVIL", BACKEND: "BACKEND", EDU: "EDUCACIÓN", CERT: "CERTIFICACIONES", INTERN: "PASANTÍAS" },
    status: "ESTADO: ESTABLE",
    designedBy: "Diseñado y creado por",
    tooltips: { github: "GitHub", linkedin: "LinkedIn", mail: "Correo", leetcode: "LeetCode", theme: "Cambiar Tema" }
  },
  en: {
    role: "Full-Stack Developer",
    bio: "Computer Engineering student. Currently exploring the intersection between code and infrastructure, using Python to create tools that make processes more agile and secure. In constant technical evolution.",
    nav: { home: "HOME", about: "PROFILE", certs: "EDUCATION", projects: "PROJECTS" },
    profileTitle: "/ Professional Profile",
    profileSlogan: "Engineering that connects.",
    profileDesc: "As a Full-Stack Developer, I focus on creating technical solutions that don't just work, but scale. My experience spans from interactive frontend to robust backend architectures.",
    stackTitle: "Tech Stack",
    stackCategories: {
      frontend: "Frontend",
      backend: "Backend",
      cloud: "Cloud & DevOps"
    },
    langTitle: "Languages",
    projectsTitle: "Projects_",
    certsTitle: "Education_",
    categories: { ALL: "ALL", WEB: "WEB", MOBILE: "MOBILE", BACKEND: "BACKEND", EDU: "EDUCATION", CERT: "CERTIFICACIONES", INTERN: "INTERNSHIPS" },
    status: "STATUS: STABLE",
    designedBy: "Designed and created by",
    tooltips: { github: "GitHub", linkedin: "LinkedIn", mail: "Email", leetcode: "LeetCode", theme: "Switch Theme" }
  }
};
