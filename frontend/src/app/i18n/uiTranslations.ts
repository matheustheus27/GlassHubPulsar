/**
 * Dedicated UI Internationalization (i18n) Dictionary
 * Manages all interface labels, buttons, navigation, headers, forms, and dialogs.
 */

export const uiTranslations = {
  'pt-BR': {
    // Brand & App
    appName: 'GlassHub Pulsar',
    tagline: 'Plataforma corporativa de criação, inteligência ATS e gestão de currículos executivos',
    specBadge: 'Padrão GlassHub Enterprise',

    // Navigation & Tabs
    tabResume: 'Currículo',
    tabCover: 'Carta de Apresentação',
    viewSplit: 'Dividido',
    viewEditor: 'Editor',
    viewPreview: 'Visualização',

    // Navbar Dropdowns & Notifications
    menuAppearance: 'Aparência',
    menuDocument: 'Documento',
    menuAccount: 'Conta',
    notificationsLabel: 'Notificações',
    noNotifications: 'Nenhuma notificação no momento',
    markAllReadBtn: 'Marcar como lidas',
    clearAllNotifsBtn: 'Limpar tudo',

    // Appearance
    themeLabel: 'Tema & Contraste',
    themeMode: 'Modo',
    themeDark: 'Escuro',
    themeLight: 'Claro',
    colorPaletteLabel: 'Paleta de Cores (WCAG AAA)',

    // Document & Versions
    templatesLabel: 'Modelo de Currículo',
    languageLabel: 'Idioma da Interface',
    versionsLabel: 'Versões do Currículo',
    addInternationalVersion: 'Adicionar Versão Internacional',
    activeVersionBadge: 'Ativo',

    // Account
    roleAdmin: 'ADMINISTRADOR',
    roleUser: 'USUÁRIO',
    adminCockpitBtn: 'Admin Cockpit',
    logoutBtn: 'Sair da Conta',

    // Top Actions
    exportPdfBtn: 'Exportar PDF',
    exportingPdf: 'Gerando PDF no Worker...',
    pdfSuccess: '✓ PDF exportado com sucesso!',
    pdfError: 'Erro na exportação de PDF',

    // Metrics Bar
    metricCompletion: 'Preenchimento',
    metricAtsEstimated: 'ATS Score Estimado',
    metricAnalyze: 'Analisar →',
    metricActiveTemplate: 'Modelo Ativo',
    metricPrimaryColor: 'Cor Primária',

    // Floating Triggers
    floatingAtsBtn: 'ATS Score',
    floatingAiBtn: 'Assistente IA & Quick Fill',

    // Form Sections
    sectionPersonal: '👤 Dados Pessoais',
    sectionSummary: '📝 Sumário',
    sectionExperience: '💼 Experiências',
    sectionSkills: '⚡ Habilidades',
    sectionEducation: '🎓 Educação',
    sectionProjects: '🚀 Projetos',
    sectionCoverLetter: '✉️ Carta de Apresentação',

    // Form Field Labels & Placeholders
    personalHeading: 'Identificação & Informações de Contato',
    labelFullName: 'Nome Completo',
    phFullName: 'Ex: Alexandre Oliveira',
    labelJobTitle: 'Cargo / Posição Pretendida',
    phJobTitle: 'Ex: Engenheiro de Software Full-Stack Sênior',
    labelEmail: 'E-mail de Contato',
    phEmail: 'seu.email@gmail.com',
    labelPhone: 'Telefone / WhatsApp',
    phPhone: '+55 (11) 99999-9999',
    labelLocation: 'Localização',
    phLocation: 'São Paulo, SP - Brasil',
    labelGithub: 'GitHub URL',
    phGithub: 'https://github.com/usuario',
    labelLinkedin: 'LinkedIn URL',
    phLinkedin: 'https://linkedin.com/in/usuario',
    labelPortfolio: 'Portfólio / Website',
    phPortfolio: 'https://seusite.com',
    labelInstagram: 'Instagram URL',
    phInstagram: 'https://instagram.com/usuario',
    labelFacebook: 'Facebook URL',
    phFacebook: 'https://facebook.com/usuario',
    labelTwitter: 'X (Antigo Twitter) URL',
    phTwitter: 'https://x.com/usuario',

    summaryHeading: 'Resumo Profissional',
    phSummary: 'Descreva seu perfil, especializações e principais conquistas...',

    experienceHeading: 'Histórico Profissional',
    addExperienceBtn: 'Adicionar Cargo',
    removeExperienceBtn: 'Remover',
    phCompany: 'Empresa',
    phPosition: 'Cargo',
    phPeriod: 'Período (Ex: 2022 - Presente)',
    bulletsLabel: 'Pontos de Impacto & Métricas:',
    addBulletBtn: 'Adicionar bullet de impacto',

    skillsHeading: 'Competências & Tecnologias',
    addSkillCatBtn: 'Nova Categoria',
    phSkillCat: 'Nome da Categoria (Ex: Backend & Nuvem)',
    phAddSkillTag: 'Adicionar tecnologia e pressionar Enter...',
    addTagBtn: 'Adicionar',

    educationHeading: 'Formação Acadêmica',
    addEducationBtn: 'Adicionar Formação',
    phInstitution: 'Instituição de Ensino (Ex: USP)',
    phDegree: 'Curso / Grau (Ex: Bacharelado em Ciência da Computação)',
    phEduPeriod: 'Período (Ex: 2016 - 2020)',
    phEduDesc: 'Descrição ou foco da formação...',

    projectsHeading: 'Projetos de Destaque',
    addProjectBtn: 'Adicionar Projeto',
    phProjectTitle: 'Nome do Projeto (Ex: Glassmorphic Resume)',
    phProjectDesc: 'Descrição resumida do projeto e tecnologias...',
    phProjectLink: 'URL do Projeto ou Repositório',
    addProjectBulletBtn: 'Adicionar detalhe do projeto',

    coverHeading: 'Estrutura da Carta de Apresentação',
    labelGreeting: 'Saudação Inicial',
    phGreeting: 'Prezados membros do comitê de seleção,',
    labelParagraphs: 'Parágrafos da Carta',
    labelValediction: 'Despedida',
    phValediction: 'Atenciosamente,',
    labelSignature: 'Assinatura',
    phSignature: 'Seu Nome',

    // Quick Fill AI & Chat
    quickFillTitle: 'Preenchimento Rápido com IA',
    quickFillDesc: 'Cole seu resumo do LinkedIn, bio profissional ou atribuições brutas. A IA converterá tudo em campos estruturados para o seu currículo.',
    phRawText: 'Cole aqui seu texto bruto ou biografia profissional...',
    structureWithAiBtn: 'Estruturar com IA',
    applyToResumeBtn: 'Aplicar no Formulário',
    chatTitle: 'Assistente de Recrutamento',
    phChatMessage: 'Digite sua dúvida ou peça sugestões de melhoria...',
    sendBtn: 'Enviar',

    // International Version Modal
    modalVersionTitle: 'Adicionar Versão Internacional',
    modalVersionDesc: 'Crie uma versão do seu currículo em outro idioma para candidaturas globais.',
    targetLanguageLabel: 'Selecione o Idioma de Destino:',
    optionAiTranslate: 'Preencher com IA (TranslateGemma / Llama 3.2)',
    optionAiTranslateDesc: 'Traduz automaticamente todos os seus dados e experiências preservando a formatação.',
    optionBlank: 'Criar em Branco / Manual',
    optionBlankDesc: 'Cria uma versão vazia para você escrever o currículo do zero no novo idioma.',
    createVersionBtn: 'Criar Versão',
    cancelBtn: 'Cancelar',

    // Admin Cockpit
    adminTitle: 'Painel Administrativo & Telemetria Híbrida',
    adminDesc: 'Monitoramento integrado Datadog APM + Logs PostgreSQL e Gestão de Workers',
    compositeHealthTitle: 'Índice Composto de Saúde do Sistema',
    serverUptime: 'Uptime do Servidor',
    heapMemory: 'Heap Memory',
    totalRequests: 'Requisições Registradas',
    errorRate: 'Taxa de Erros',
    datadogStatus: 'Agente Datadog',
    datadogConnected: '● Conectado (DogStatsD 8125 / Logs)',
    localLogsTitle: 'Logs de Execução Recentes (PostgreSQL)',
    workerQueuesTitle: 'Filas de Mensageria (BullMQ / Redis)',
    generateExecutiveReportBtn: 'Gerar Relatório Executivo Híbrido (PDF)',
    backToWorkspaceBtn: 'Voltar ao Workspace'
  },

  'en-US': {
    // Brand & App
    appName: 'GlassHub Pulsar',
    tagline: 'Enterprise platform for resume creation, ATS scoring, and executive talent management',
    specBadge: 'GlassHub Enterprise Standard',

    // Navigation & Tabs
    tabResume: 'Resume',
    tabCover: 'Cover Letter',
    viewSplit: 'Split',
    viewEditor: 'Editor',
    viewPreview: 'Preview',

    // Navbar Dropdowns & Notifications
    menuAppearance: 'Appearance',
    menuDocument: 'Document',
    menuAccount: 'Account',
    notificationsLabel: 'Notifications',
    noNotifications: 'No notifications at this time',
    markAllReadBtn: 'Mark all as read',
    clearAllNotifsBtn: 'Clear all',

    // Appearance
    themeLabel: 'Theme & Contrast',
    themeMode: 'Mode',
    themeDark: 'Dark',
    themeLight: 'Light',
    colorPaletteLabel: 'Color Palette (WCAG AAA)',

    // Document & Versions
    templatesLabel: 'Resume Template',
    languageLabel: 'Interface Language',
    versionsLabel: 'Resume Versions',
    addInternationalVersion: 'Add International Version',
    activeVersionBadge: 'Active',

    // Account
    roleAdmin: 'ADMINISTRATOR',
    roleUser: 'USER',
    adminCockpitBtn: 'Admin Cockpit',
    logoutBtn: 'Sign Out',

    // Top Actions
    exportPdfBtn: 'Export PDF',
    exportingPdf: 'Rendering PDF in Worker...',
    pdfSuccess: '✓ PDF exported successfully!',
    pdfError: 'PDF Export Error',

    // Metrics Bar
    metricCompletion: 'Completion',
    metricAtsEstimated: 'Estimated ATS Score',
    metricAnalyze: 'Analyze →',
    metricActiveTemplate: 'Active Template',
    metricPrimaryColor: 'Primary Color',

    // Floating Triggers
    floatingAtsBtn: 'ATS Score',
    floatingAiBtn: 'AI Assistant & Quick Fill',

    // Form Sections
    sectionPersonal: '👤 Personal Info',
    sectionSummary: '📝 Summary',
    sectionExperience: '💼 Experience',
    sectionSkills: '⚡ Skills',
    sectionEducation: '🎓 Education',
    sectionProjects: '🚀 Projects',
    sectionCoverLetter: '✉️ Cover Letter',

    // Form Field Labels & Placeholders
    personalHeading: 'Identification & Contact Information',
    labelFullName: 'Full Name',
    phFullName: 'E.g., Alexander Oliver',
    labelJobTitle: 'Target Job Title',
    phJobTitle: 'E.g., Senior Full-Stack Software Engineer',
    labelEmail: 'Contact Email',
    phEmail: 'your.email@gmail.com',
    labelPhone: 'Phone / WhatsApp',
    phPhone: '+1 (555) 019-2834',
    labelLocation: 'Location',
    phLocation: 'San Francisco, CA - USA',
    labelGithub: 'GitHub URL',
    phGithub: 'https://github.com/username',
    labelLinkedin: 'LinkedIn URL',
    phLinkedin: 'https://linkedin.com/in/username',
    labelPortfolio: 'Portfolio / Website',
    phPortfolio: 'https://yoursite.com',
    labelInstagram: 'Instagram URL',
    phInstagram: 'https://instagram.com/username',
    labelFacebook: 'Facebook URL',
    phFacebook: 'https://facebook.com/username',
    labelTwitter: 'X (Twitter) URL',
    phTwitter: 'https://x.com/username',

    summaryHeading: 'Executive Summary',
    phSummary: 'Describe your expertise, track record, and key achievements...',

    experienceHeading: 'Professional Experience',
    addExperienceBtn: 'Add Role',
    removeExperienceBtn: 'Remove',
    phCompany: 'Company',
    phPosition: 'Position',
    phPeriod: 'Period (E.g., 2022 - Present)',
    bulletsLabel: 'Key Metrics & Impact Bullets:',
    addBulletBtn: 'Add impact bullet point',

    skillsHeading: 'Skills & Technologies',
    addSkillCatBtn: 'New Category',
    phSkillCat: 'Category Name (E.g., Cloud & Distributed Systems)',
    phAddSkillTag: 'Add technology and press Enter...',
    addTagBtn: 'Add',

    educationHeading: 'Education & Academics',
    addEducationBtn: 'Add Education',
    phInstitution: 'Institution (E.g., Stanford University)',
    phDegree: 'Degree (E.g., B.S. in Computer Science)',
    phEduPeriod: 'Period (E.g., 2016 - 2020)',
    phEduDesc: 'Description or academic focus...',

    projectsHeading: 'Featured Projects',
    addProjectBtn: 'Add Project',
    phProjectTitle: 'Project Name',
    phProjectDesc: 'Brief description and technologies used...',
    phProjectLink: 'Project or Repository URL',
    addProjectBulletBtn: 'Add project highlight',

    coverHeading: 'Cover Letter Structure',
    labelGreeting: 'Salutation',
    phGreeting: 'Dear Hiring Committee,',
    labelParagraphs: 'Body Paragraphs',
    labelValediction: 'Valediction',
    phValediction: 'Sincerely,',
    labelSignature: 'Signature',
    phSignature: 'Your Name',

    // Quick Fill AI & Chat
    quickFillTitle: 'Quick Fill with AI',
    quickFillDesc: 'Paste your LinkedIn summary or raw bio. The AI will convert everything into structured fields for your resume.',
    phRawText: 'Paste your raw text or career summary here...',
    structureWithAiBtn: 'Structure with AI',
    applyToResumeBtn: 'Apply to Resume Form',
    chatTitle: 'Career & AI Recruiter Assistant',
    phChatMessage: 'Ask a question or request resume enhancement tips...',
    sendBtn: 'Send',

    // International Version Modal
    modalVersionTitle: 'Add International Version',
    modalVersionDesc: 'Create a localized version of your resume for global job applications.',
    targetLanguageLabel: 'Select Target Language:',
    optionAiTranslate: 'Fill with AI (TranslateGemma / Llama 3.2)',
    optionAiTranslateDesc: 'Automatically translates all your details and experiences while preserving formatting.',
    optionBlank: 'Create Blank / Manual',
    optionBlankDesc: 'Creates an empty version for you to author the resume from scratch in the target language.',
    createVersionBtn: 'Create Version',
    cancelBtn: 'Cancel',

    // Admin Cockpit
    adminTitle: 'Admin Cockpit & Hybrid Telemetry',
    adminDesc: 'Unified Datadog APM + PostgreSQL Logs and Worker Queue Orchestration',
    compositeHealthTitle: 'Composite System Health Score',
    serverUptime: 'Server Uptime',
    heapMemory: 'Heap Memory',
    totalRequests: 'Recorded Requests',
    errorRate: 'Error Rate',
    datadogStatus: 'Datadog Agent',
    datadogConnected: '● Connected (DogStatsD 8125 / Logs)',
    localLogsTitle: 'Recent Execution Traces (PostgreSQL)',
    workerQueuesTitle: 'Message Queues (BullMQ / Redis)',
    generateExecutiveReportBtn: 'Generate Hybrid Executive Report (PDF)',
    backToWorkspaceBtn: 'Back to Workspace'
  }
};

export type UILanguage = keyof typeof uiTranslations;
