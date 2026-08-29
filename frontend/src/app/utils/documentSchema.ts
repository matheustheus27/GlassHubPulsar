export const defaultDocumentData = {
  personalDetails: {
    name: 'Alexandre Silveira',
    title: 'Senior Full-Stack & Systems Architect',
    contact: {
      email: { email: 'alexandre.silveira@exemplo.com', icon: '✉️' },
      phone: { phone: '+55 (11) 98765-4321', link: 'https://wa.me/5511987654321', icon: '📞' },
      networking: {
        portfolio: { name: 'Portfólio', url: 'https://alexandre.dev', icon: 'portfolio' },
        linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/alexandre-silveira', icon: 'linkedin' },
        github: { name: 'GitHub', url: 'https://github.com/alexandre-silveira', icon: 'github' }
      }
    },
    location: {
      location: 'São Paulo, SP - Brasil',
      link: 'https://www.google.com/maps/search/?api=1&query=S%C3%A3o%20Paulo%2C%20SP%20-%20Brasil',
      icon: '📍'
    }
  },
  summaryDetails: {
    summaryTitle: 'RESUMO PROFISSIONAL',
    summary: 'Engenheiro de Software Sênior com mais de 8 anos de experiência em arquitetura de microsserviços distribuídos, computação em nuvem e design systems reativos. Especialista em Node.js, TypeScript, React e infraestrutura resiliente de alta disponibilidade.'
  },
  skillsDetails: {
    skillsTitle: 'COMPETÊNCIAS & TECNOLOGIAS',
    skills: [
      {
        name: 'Backend & Cloud',
        items: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'GraphQL']
      },
      {
        name: 'Frontend & UI Systems',
        items: ['React', 'Next.js', 'TailwindCSS', 'Glassmorphism', 'WebSockets', 'Vite', 'HTML5/CSS3']
      },
      {
        name: 'DevOps & Telemetria',
        items: ['Datadog APM', 'CI/CD Pipelines', 'BullMQ', 'Puppeteer', 'Nginx', 'Jest/Vitest']
      }
    ]
  },
  experienceDetails: {
    experienceTitle: 'HISTÓRICO PROFISSIONAL',
    experiences: [
      {
        company: 'CloudSphere Enterprise',
        position: 'Lead Software Architect',
        period: '2021 - Presente',
        bullets: [
          'Liderou a reestruturação da malha de microsserviços reduzindo latência P99 em 42% sob carga de 100k req/min.',
          'Implementou pipeline de telemetria híbrida com Datadog e PostgreSQL com 99.99% de SLA operacional.'
        ]
      },
      {
        company: 'TechMatrix Global',
        position: 'Senior Full-Stack Engineer',
        period: '2018 - 2021',
        bullets: [
          'Desenvolveu plataforma SaaS escalável com React e Node.js atendendo a mais de 250 mil usuários ativos mensais.',
          'Implementou workers distribuídos com BullMQ e Redis para processamento e exportação de relatórios em tempo real.'
        ]
      }
    ]
  },
  educationDetails: {
    educationTitle: 'FORMAÇÃO ACADÊMICA',
    educations: [
      {
        organization: 'Universidade de São Paulo (USP)',
        degree: 'Bacharelado em Ciência da Computação',
        period: 'Concluído em 2017',
        description: 'Foco em Sistemas Distribuídos, Algoritmos Avançados e Engenharia de Software.'
      }
    ]
  },
  projectDetails: {
    projectTitle: 'PROJETOS DE DESTAQUE',
    projects: [
      {
        title: 'GlassHub Enterprise Core',
        link: 'https://github.com/alexandre-silveira/glasshub',
        description: 'Design System e framework modular baseado em estética Glassmorphic e Atomic Design.',
        bullets: [
          'Criado do zero com componentes reutilizáveis, suporte a múltiplos temas e alta conformidade com WCAG AAA.'
        ]
      }
    ]
  },
  coverLetterDetails: {
    greeting: 'Prezados membros do comitê de seleção,',
    text: [
      'Gostaria de apresentar minha candidatura à vaga de Engenheiro de Software Sênior / Arquiteto na vossa organização.',
      'Com vasta vivência em sistemas de alta escalabilidade, telemetria de produção e microsserviços modernos, tenho convicção de que posso agregar valor expressivo às metas técnicas da empresa.'
    ],
    valediction: 'Atenciosamente,',
    signature: 'Alexandre Silveira'
  }
};

export const createCleanDocumentData = (user?: { name?: string; email?: string } | null) => ({
  personalDetails: {
    name: user?.name || '',
    title: '',
    contact: {
      email: { email: user?.email || '', icon: '✉️' },
      phone: { phone: '', link: '', icon: '📞' },
      networking: {
        portfolio: { name: 'Portfólio', url: '', icon: 'portfolio' },
        linkedin: { name: 'LinkedIn', url: '', icon: 'linkedin' },
        github: { name: 'GitHub', url: '', icon: 'github' }
      }
    },
    location: {
      location: '',
      link: '',
      icon: '📍'
    }
  },
  summaryDetails: {
    summaryTitle: 'RESUMO PROFISSIONAL',
    summary: ''
  },
  skillsDetails: {
    skillsTitle: 'COMPETÊNCIAS & TECNOLOGIAS',
    skills: []
  },
  experienceDetails: {
    experienceTitle: 'HISTÓRICO PROFISSIONAL',
    experiences: []
  },
  educationDetails: {
    educationTitle: 'FORMAÇÃO ACADÊMICA',
    educations: []
  },
  projectDetails: {
    projectTitle: 'PROJETOS DE DESTAQUE',
    projects: []
  },
  coverLetterDetails: {
    greeting: 'Prezados membros do comitê de seleção,',
    text: [''],
    valediction: 'Atenciosamente,',
    signature: user?.name || ''
  }
});
