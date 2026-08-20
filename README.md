<!-- markdownlint-disable MD033 -->

# 📄 GlassHub Professional Resume - Enterprise Document & AI Engine

A modern, production-ready enterprise ecosystem designed to manage, render, analyze, and export executive resumes and cover letters. Built with a decoupled microservice architecture, strict **GlassHub Design System (Atomic Design)**, PostgreSQL relational persistence, BullMQ asynchronous workers, Puppeteer Linux PDF calibration, and hybrid telemetry combining **Datadog APM** and PostgreSQL execution logs.

---

## 🎯 Architectural Highlights & Capabilities

* **Public Landing Page & Gateway:** Luxury landing page at the root route (`/`) explaining the platform, showcasing the 4 Glassmorphic templates, ATS scoring intelligence, and providing a clean modal gateway for login and registration.
* **GlassHub Design System & Atomic Design:** Multi-layer frosted glass surfaces (`backdrop-filter: blur(20px)`), luminous specular borders, neon glow rings, and WCAG AAA compliant typography.
* **4 Extensible Resume Themes:** Seamlessly switch between `GlassModern`, `GlassMinimalist`, `GlassExecutive`, and `GlassCompact` without data loss.
* **Symmetrical Link Balancing Algorithm:** Mathematical bounding-box algorithm balancing contact links dynamically (2x2, 3x2, 1x4) to eliminate orphan widow links in both web previews and PDF exports.
* **Social & Networking Contacts:** Built-in support for GitHub, LinkedIn, Portfolio Website, Instagram, Facebook, and X (formerly Twitter).
* **Dedicated Interface i18n Dictionary:** Complete interface internationalization (`uiTranslations.ts`) for Portuguese and English interface translations.
* **On-Demand International Resume Versions:** Create localized versions of your resume with choice of manual authoring or automated background translation via `worker-translation` (TranslateGemma / Llama 3.2).
* **Conversational Quick Fill AI & Career Recruiter Assistant:** Context-aware recruiter chat answering specific queries, rewriting bullets, and converting raw text into structured resume fields.
* **Resume Importer (.PDF & .DOCX):** Intelligent parser extracting candidate profiles from existing Word documents and PDFs directly into structured resume fields using Llama 3.2.
* **Customer Help & Support Center:** Interactive FAQs, step-by-step user manuals, and ticket desk for technical issues, suggestions, and account deletion.
* **Real-Time Live Chat with Support Agents:** Instant real-time customer service chat between candidates and admin attendants with live SSE/WebSocket message streaming.
* **30-Day Soft Account Deletion & Recovery Routine:** Security workflow for account deletion with a 30-day grace period, automated email notifications, single-use recovery tokens, and automated permanent purge routines.
* **Hybrid Admin Cockpit & Executive PDF Health Reports:** Live dashboard monitoring Datadog APM DogStatsD metrics, PostgreSQL execution traces (`SystemExecutionLog`), BullMQ message queues, support desk tickets, and generating on-demand executive status PDF reports.
* **Hardened Infrastructure & Nginx Gateway:** Fully orchestrated via Docker Compose with Nginx reverse proxy on port 80, PostgreSQL 16 with persistent named volumes, Redis 7, and Datadog agent.

---

## 🔑 Default Seeded Accounts & Credentials

The platform database seeds the following default accounts upon initialization:

| Account Type | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@glasshub.com` | `AdminPassword123!` | Acesso total ao Admin Cockpit, telemetria híbrida Datadog + PostgreSQL, controle de filas BullMQ e relatórios executivos em PDF. |
| **Usuário de Teste** | `test@glasshub.com` | `TestPassword123!` | Acesso ao Workspace do usuário com dados completos de currículo pré-configurados no PostgreSQL, editor reativo e live preview. |

> [!NOTE]
> Novos usuários podem ser criados instantaneamente através do botão **"Criar Conta"** na Landing Page inicial (com confirmação de senha e formulário limpo para preenchimento de dados pessoais).

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
| `<HIGHLIGHT>text</HIGHLIGHT>` | `<mark class="...">text</mark>` | <mark style="background-color: rgb(8, 145, 178); padding: 2px 4px; border-radius: 2px;">Highlighted text</mark> |
| `<STRIKETHROUGH>text</STRIKETHROUGH>` | `<s>text</s>` | ~~Strikethrough text~~ |

---

## 🚀 Quick Start with Docker

1. **Clone the repository:**
   ```bash
   git clone https://github.com/matheustheus27/Glassmorphic-Professional-Resume-Template.git
   cd Glassmorphic-Professional-Resume-Template
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
   - **Public Landing Page & Gateway:** Open `http://localhost` (or `http://localhost:80`)
   - **Login:** Use `test@glasshub.com` / `TestPassword123!` or `admin@glasshub.com` / `AdminPassword123!`.
   - **Admin Cockpit:** Access `/admin/cockpit` or log in directly with administrator credentials.

---

## 👨‍💻 Autor & Desenvolvedor

Desenvolvido por **[Matheus](https://matheustheus27.github.io/)**
