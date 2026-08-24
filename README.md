<!-- markdownlint-disable MD033 -->

<div align="center">

  <img src="https://glass-hub-engine.vercel.app/api/logo?project=pulsar&theme=glass-dark&animated=true&width=280&height=280" alt="GlassHub Pulsar Logo" width="280" height="280" />

  # 📄 GlassHub Pulsar

  <p><strong>Enterprise Document & AI Engine designed to manage, render, analyze, and export executive resumes and cover letters with a high-fidelity Glassmorphic visual identity.</strong></p>

  <p>
    <a href="LICENSE">
      <img src="https://glass-hub-engine.vercel.app/api/badge?label=License&value=MIT&icon=sparkles&theme=glass-dark&glow=true" alt="License MIT" />
    </a>
    <a href="https://nodejs.org">
      <img src="https://glass-hub-engine.vercel.app/api/badge?label=Node.js&value=v20.x&icon=nodejs&theme=glass-dark&glow=true" alt="Node.js" />
    </a>
    <a href="https://react.dev">
      <img src="https://glass-hub-engine.vercel.app/api/badge?label=React&value=v18.3&icon=react&theme=glass-dark&glow=true" alt="React" />
    </a>
    <a href="https://www.typescriptlang.org">
      <img src="https://glass-hub-engine.vercel.app/api/badge?label=TypeScript&value=v5.5&icon=typescript&theme=glass-dark&glow=true" alt="TypeScript" />
    </a>
    <a href="https://www.postgresql.org">
      <img src="https://glass-hub-engine.vercel.app/api/badge?label=PostgreSQL&value=v16&icon=postgresql&theme=glass-dark&glow=true" alt="PostgreSQL" />
    </a>
    <a href="https://www.docker.com">
      <img src="https://glass-hub-engine.vercel.app/api/badge?label=Docker&value=Ready&icon=docker&theme=glass-dark&glow=true" alt="Docker" />
    </a>
  </p>

</div>

---

## 📚 Comprehensive Documentation (`docs/`)

For in-depth guides, REST API specifications, architectural decisions, and step-by-step instructions written in simple, clear, and didactic language accessible for both interns and staff engineers:

- 🏛️ [**Architecture Guide (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md) - System topology, decoupled microservices, Prisma/PostgreSQL relational model, BullMQ asynchronous queues, and hybrid Datadog + PostgreSQL telemetry.
- 🔌 [**REST API Reference (`docs/API_REFERENCE.md`)**](docs/API_REFERENCE.md) - Complete catalog of REST endpoints, JSON payloads, JWT/2FA authentication, ATS engine, PDF export, and account deletion lifecycle.
- 🎨 [**Frontend & Themes (`docs/FRONTEND_AND_TEMPLATES.md`)**](docs/FRONTEND_AND_TEMPLATES.md) - GlassHub Design System (Atomic Design), the 4 resume themes (`GlassModern`, `GlassMinimalist`, `GlassExecutive`, `GlassCompact`), Symmetrical Link Balancing Algorithm, and i18n dictionary.
- 🚀 [**Deploy & DevOps Guide (`docs/DEPLOYMENT_AND_DEVOPS.md`)**](docs/DEPLOYMENT_AND_DEVOPS.md) - Docker Compose orchestration, Nginx security gateway & routing, Linux Puppeteer calibration for A4 PDFs, and Datadog DogStatsD agent.
- 🤝 [**Contributing Guide (`docs/CONTRIBUTING_AND_WORKFLOW.md`)**](docs/CONTRIBUTING_AND_WORKFLOW.md) - Local environment setup, Prisma migrations, developing new BullMQ workers, and code conventions.

---

## 💎 Visual Identity & Glassmorphism Aesthetics

**GlassHub Pulsar** strictly enforces the cosmic Glassmorphism visual language:
- 🌌 **Translucent Glass Surfaces:** Dark semi-transparent finish with background blur (`backdrop-filter: blur(16px)`).
- 💎 **Specular Light Reflections:** Light incidence highlights on surface top borders (`border-top: 1px solid rgba(255, 255, 255, 0.25)`).
- ⚡ **Neon Glow Rings:** Luminous dynamic rings in HSL/RGB (`#06b6d4`, `#38bdf8`, `#8b5cf6`).
- 📐 **Pixel-Perfect A4 Printing:** Native Linux environment calibration in headless Puppeteer for PDF exports identical to the web version.
- 🌐 **Native Internationalization:** Full support for resumes and interfaces in Portuguese (`pt-BR`) and English (`en-US`).

---

## 🎯 Architectural Highlights & Capabilities

* **Public Landing Page & Gateway:** Luxury landing page at the root route (`/`) explaining the platform, showcasing the 4 Glassmorphic templates, ATS scoring intelligence, and providing a clean modal gateway for login and registration.
* **GlassHub Design System & Atomic Design:** Multi-layer frosted glass surfaces, specular borders, neon glow rings, organized strictly in Atoms, Molecules, Organisms, Templates, and Pages.
* **4 Extensible Resume Themes:** Seamlessly switch between `GlassModern`, `GlassMinimalist`, `GlassExecutive`, and `GlassCompact` without data loss.
* **Symmetrical Link Balancing Algorithm:** Mathematical bounding-box algorithm balancing contact links dynamically (2x2, 3x2, 1x4) to eliminate orphan widow links in both web previews and PDF exports.
* **Social & Networking Contacts:** Built-in support for GitHub, LinkedIn, Portfolio Website, Instagram, Facebook, and X (formerly Twitter).
* **Dedicated Interface i18n Dictionary:** Complete interface internationalization (`uiTranslations.ts`) for Portuguese and English interface translations.
* **ATS Scoring Engine (Applicant Tracking System):** Intelligent ATS scoring analyzing keyword density, structure, and job description match.
* **AI Career Recruiter Assistant & PDF/DOCX Importer:** Resume parser extracting candidate profiles from existing Word documents and PDFs directly into structured fields using Llama 3.2.
* **Customer Support Desk & Real-Time Chat:** Real-time customer service chat between candidates and support agents with live SSE/WebSocket message streaming.
* **30-Day Soft Account Deletion & Recovery Routine:** Security workflow for account deletion with a 30-day grace period, automated email notifications, single-use recovery tokens, and automated permanent purge routines.
* **Hybrid Admin Cockpit & Executive PDF Health Reports:** Live dashboard monitoring Datadog APM DogStatsD metrics, PostgreSQL execution traces (`SystemExecutionLog`), BullMQ message queues, support desk tickets, and generating on-demand executive status PDF reports.

---

## 🔑 Default Seeded Accounts & Credentials

The platform database seeds the following default accounts upon initialization:

| Account Type | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@glasshub.com` | `AdminPassword123!` | Full access to Admin Cockpit, hybrid Datadog + PostgreSQL telemetry, BullMQ queue management, and executive status PDF reports. |
| **Test User** | `test@glasshub.com` | `TestPassword123!` | Access to Candidate Workspace with pre-filled resume data in PostgreSQL, reactive editor, and live preview. |

> [!NOTE]
> New users can be created instantly via the **"Create Account"** button on the Landing Page modal.

---

## 🏗️ System Topology & Services

```
                                  [ Port 80 ]
                                 ┌────────────┐
                                 │   NGINX    │ (Reverse Proxy & Security Gateway)
                                 └─────┬──────┘
                                       │
                       ┌────────────────┴────────────────┐
                       ▼                                 ▼
              ┌─────────────────┐               ┌─────────────────┐
              │    Frontend     │               │   Backend API   │
              │  (Vite + React) │               │    (Express)    │
              └─────────────────┘               └────────┬────────┘
                                                         │
                       ┌────────────────┬────────────────┼────────────────┐
                       ▼                ▼                ▼                ▼
               ┌───────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
               │  PostgreSQL   │ │    Redis    │ │   Ollama    │ │   Datadog   │
               │  (pg_data)    │ │   (Queues)  │ │ (Llama 3.2) │ │   (APM)     │
               └───────────────┘ └──────┬──────┘ └─────────────┘ └─────────────┘
                                        │
                 ┌──────────────────────┼──────────────────────┐
                 ▼                      ▼                      ▼
         ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
         │ worker-trans  │      │ worker-pdf    │      │ worker-notif  │
         │ (Translation) │      │ (Puppeteer)   │      │ (Multi-chan)  │
         └───────────────┘      └───────────────┘      └───────────────┘
```

---

## 🏷️ Custom Text Formatting Tags

To keep raw data clean while supporting rich inline typography, the platform processes custom formatting tags across both preview and Puppeteer PDF builds:

| Tag | Rendered HTML | Visual Effect |
| :--- | :--- | :--- |
| `<BOLD>text</BOLD>` | `<strong>text</strong>` | **Bold text** |
| `<ITALIC>text</ITALIC>` | `<em>text</em>` | *Italic text* |
| `<UNDERLINE>text</UNDERLINE>` | `<u>text</u>` | <u>Underlined text</u> |
| `<HIGHLIGHT>text</HIGHLIGHT>` | `<mark class="...">text</mark>` | <mark style="background-color: rgb(8, 145, 178); padding: 2px 4px; border-radius: 2px; color: white;">Highlighted text</mark> |
| `<STRIKETHROUGH>text</STRIKETHROUGH>` | `<s>text</s>` | ~~Strikethrough text~~ |

---

## 🚀 Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/matheustheus27/GlassHubPulsar.git
   cd GlassHubPulsar
   ```

2. **Initialize environment configuration:**
   ```bash
   node scripts/init-env.js
   ```

3. **Start the entire platform:**
   ```bash
   docker compose up --build
   ```

4. **Access the application:**
   - **Public Landing Page & Gateway:** Open `http://localhost` (port 80)
   - **Login:** Use `test@glasshub.com` / `TestPassword123!` or `admin@glasshub.com` / `AdminPassword123!`.
   - **Admin Cockpit:** Access `/admin/cockpit` or log in directly with administrator credentials.

---

## 👨‍💻 Author & Developer

Developed by **[Matheus](https://matheustheus27.github.io/)**
