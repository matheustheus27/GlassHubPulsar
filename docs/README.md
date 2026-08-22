# 📚 GlassHub Professional Resume Documentation

Welcome to the official technical documentation hub for **GlassHub Professional Resume**! This documentation is designed to be comprehensive, didactic, and accessible — serving both **interns during onboarding** and **staff engineers** who need to quickly understand architectural decisions and extend the ecosystem.

---

## 🗺️ Documentation Sitemap

To streamline your navigation, the documentation is divided into 5 structured modules:

| Module | File | Description & Core Content | Target Audience |
| :--- | :--- | :--- | :--- |
| **🏛️ Architecture & System** | [ARCHITECTURE.md](ARCHITECTURE.md) | Topology overview, decoupled microservices, relational model (PostgreSQL/Prisma), message queuing with BullMQ + Redis, Nginx gateway, and hybrid observability (Datadog APM + PostgreSQL execution logs). | Interns, Software Engineers, Staff, DevOps |
| **🔌 REST API Reference** | [API_REFERENCE.md](API_REFERENCE.md) | Comprehensive catalog of REST endpoints (JWT/2FA Authentication, Resume & Cover Letter CRUD, ATS Engine, Asynchronous PDF Generation, Support Chat, and Account Deletion). | Frontend Devs, Backend Devs, Integrators |
| **🎨 Frontend & Design System** | [FRONTEND_AND_TEMPLATES.md](FRONTEND_AND_TEMPLATES.md) | GlassHub Design System guide (Atomic Design), specifications for the 4 Resume Themes, Symmetrical Link Balancing Algorithm (2x2, 3x2, 1x4), and Internationalization Dictionary (`uiTranslations.ts`). | Frontend Devs, UI/UX Designers |
| **🚀 Deploy & DevOps** | [DEPLOYMENT_AND_DEVOPS.md](DEPLOYMENT_AND_DEVOPS.md) | Docker Compose orchestration, Nginx gateway configuration, Linux Puppeteer calibration (A4 fonts and headless Chromium), and Datadog DogStatsD telemetry setup. | DevOps, SREs, Backend Devs |
| **🤝 Contributing & Workflow** | [CONTRIBUTING_AND_WORKFLOW.md](CONTRIBUTING_AND_WORKFLOW.md) | Step-by-step guide for local development environment setup, running Prisma migrations, creating new BullMQ workers, and coding conventions. | New Developers, Interns, Contributors |

---

## 💡 How to Navigate the Documentation

### If you are an Intern / Junior Engineer:
1. Start by reading [ARCHITECTURE.md](ARCHITECTURE.md) to understand how system components connect (Frontend ➔ Nginx ➔ Backend ➔ PostgreSQL/Redis ➔ Workers).
2. Follow the step-by-step instructions in [CONTRIBUTING_AND_WORKFLOW.md](CONTRIBUTING_AND_WORKFLOW.md) to spin up the local environment using Docker.
3. Consult [FRONTEND_AND_TEMPLATES.md](FRONTEND_AND_TEMPLATES.md) if you are working on UI components or creating new themes.

### If you are a Mid-Level / Senior / Staff Engineer:
1. Review [ARCHITECTURE.md](ARCHITECTURE.md) to understand data persistence trade-offs and worker queue isolation.
2. Refer to [API_REFERENCE.md](API_REFERENCE.md) for REST contracts, JSON schemas, error handling, and payload structures.
3. Read [DEPLOYMENT_AND_DEVOPS.md](DEPLOYMENT_AND_DEVOPS.md) to inspect container isolation, Nginx routing policies, and Datadog APM instrumentation.

---

## 🌟 Core Engineering Principles

- **Decoupling and Resilience:** Heavy computations (such as high-fidelity PDF rendering via Puppeteer or LLM translation) never block the main Express backend event loop. They are delegated to asynchronous worker queues managed by BullMQ and Redis.
- **High-Fidelity Glassmorphism:** Surfaces utilize semi-transparent dark backings with background blur (`backdrop-filter: blur(16px)`), specular light reflection borders, and dynamic HSL/RGB neon gradients.
- **Pixel-Perfect Export Precision:** PDFs generated via server-side Puppeteer strictly match the web preview in layout, A4 page bounds, controlled page breaks, and millimeter margins.
- **Hybrid Observability:** System execution traces and anomalies are recorded both in Datadog APM and locally in the PostgreSQL `SystemExecutionLog` table for instant querying in the Admin Cockpit.

---

## 👨‍💻 Support & Enquiries

If you have questions or discover documentation gaps, please submit an issue or reach out to the architecture team.
