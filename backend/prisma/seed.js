const prisma = require('./client');
const { hashPassword } = require('../utils/passwordHelper');

async function seed() {
  console.log('[Seed] Seeding PostgreSQL database with GlassHub real hashed accounts...');

  const adminPasswordHash = hashPassword('AdminPassword123!');
  const testPasswordHash = hashPassword('TestPassword123!');

  // 1. Admin Account: admin@glasshub.com
  const admin = await prisma.user.upsert({
    where: { email: "admin@glasshub.com" },
    update: { 
      role: "ADMIN", 
      isActive: true,
      passwordHash: adminPasswordHash
    },
    create: {
      id: "admin-uuid-0000-0000-000000000001",
      email: "admin@glasshub.com",
      name: "GlassHub Administrator",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      isActive: true
    }
  });

  // 2. Test User Account: test@glasshub.com
  const testUser = await prisma.user.upsert({
    where: { email: "test@glasshub.com" },
    update: { 
      role: "USER", 
      isActive: true,
      passwordHash: testPasswordHash
    },
    create: {
      id: "user-uuid-0000-0000-000000000002",
      email: "test@glasshub.com",
      name: "Alexandre Oliveira",
      passwordHash: testPasswordHash,
      role: "USER",
      isActive: true
    }
  });

  // 3. User Settings for test user
  await prisma.userSettings.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      userId: testUser.id,
      activeTheme: "dark",
      activeTemplate: "GlassModern",
      primaryColor: "#06b6d4",
      glassBlur: 20,
      glassOpacity: 0.7,
      defaultLanguage: "pt-BR"
    }
  });

  // 4. Initial Resume Data for test user
  await prisma.resumeData.upsert({
    where: { id: "resume-seed-test-user-001" },
    update: {},
    create: {
      id: "resume-seed-test-user-001",
      userId: testUser.id,
      version: 1,
      language: "pt-BR",
      title: "Curriculum Vitae Executivo",
      isCurrent: true,
      personalDetails: {
        name: "Alexandre Silva Oliveira",
        title: "Engenheiro de Software Full-Stack Sênior",
        contact: {
          email: { email: "test@glasshub.com", icon: "✉️" },
          phone: { phone: "+55 (11) 98765-4321", link: "https://wa.me/5511987654321", icon: "📞" },
          networking: {
            github: { name: "GitHub", url: "https://github.com/alexandre-oliveira", icon: "🐙" },
            linkedin: { name: "LinkedIn", url: "https://linkedin.com/in/alexandre-oliveira", icon: "💼" }
          }
        },
        location: { location: "São Paulo, SP - Brasil", link: "https://maps.google.com", icon: "📍" }
      },
      summary: {
        summaryTitle: "RESUMO PROFISSIONAL",
        summary: "Engenheiro de Software Sênior com sólida trajetória no desenvolvimento de <BOLD>microsserviços escaláveis</BOLD>, arquitetura orientada a eventos e interfaces modernas com <HIGHLIGHT>estética Glassmorphic</HIGHLIGHT>. Especialista em Node.js, TypeScript, React e ecossistemas em nuvem de alta resiliência."
      },
      skills: {
        skillsTitle: "COMPETÊNCIAS & TECNOLOGIAS",
        skills: [
          { name: "Linguagens & Frameworks", items: ["TypeScript", "JavaScript", "React", "Node.js", "Express", "Next.js"] },
          { name: "Bancos de Dados & Filas", items: ["PostgreSQL", "Prisma ORM", "Redis", "BullMQ"] },
          { name: "DevOps & Ferramentas", items: ["Docker", "Nginx", "Datadog APM", "Puppeteer", "Git"] }
        ]
      },
      experiences: {
        experienceTitle: "HISTÓRICO PROFISSIONAL",
        experiences: [
          {
            company: "TechNova Enterprise Solutions",
            position: "Engenheiro de Software Sênior & Tech Lead",
            period: "2022 - Presente",
            bullets: [
              "Liderança na arquitetura de microsserviços distribuídos, reduzindo a latência de resposta em <BOLD>42%</BOLD>.",
              "Implementação de pipelines de processamento assíncrono com Redis e BullMQ gerenciando mais de 500k eventos diários.",
              "Estruturação do Design System corporativo com padrões rigorosos de acessibilidade <HIGHLIGHT>WCAG AAA</HIGHLIGHT>."
            ]
          },
          {
            company: "Inovix Cloud Systems",
            position: "Desenvolvedor Full-Stack",
            period: "2020 - 2022",
            bullets: [
              "Desenvolvimento de aplicações reativas em React e Node.js com renderização de relatórios em tempo real.",
              "Otimização de consultas PostgreSQL e modelagem relacional de alta performance."
            ]
          }
        ]
      },
      education: {
        educationTitle: "FORMAÇÃO ACADÊMICA",
        educations: [
          {
            organization: "Universidade de São Paulo (USP)",
            degree: "Bacharelado em Ciência da Computação",
            period: "2016 - 2020",
            description: "Foco em sistemas distribuídos, algoritmos avançados e engenharia de software."
          }
        ]
      },
      projects: {
        projectTitle: "PROJETOS DE DESTAQUE",
        projects: [
          {
            title: "GlassHub Pulsar",
            description: "Plataforma enterprise de geração de currículos com motor cósmico Glassmorphic, paginação A4 e IA.",
            link: "https://github.com/matheustheus27/GlassHubPulsar",
            bullets: ["Arquitetura desacoplada de microsserviços com Puppeteer e telemetria Datadog."]
          }
        ]
      }
    }
  });

  console.log('[Seed] PostgreSQL database seeded successfully with admin@glasshub.com and test@glasshub.com!');
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seed;
