# 📄 GlassmorphicProfessionalResume - Dynamic CV & Cover Letter Engine

A modern, full-stack ecosystem designed to manage, render, and export professional resumes and cover letters dynamically. This project replaces traditional, rigid styling approaches with a decoupled architecture, utilizing a highly customizable frontend and a dedicated backend service exclusively focused on consistent PDF document generation.

---

## 🎯 Project Objectives & New Features

* **Dual Document Support:** Manage and export both **Resumes (CVs)** and **Cover Letters** seamlessly from the same application.
* **New Projects Section:** Native support for showcasing personal and professional projects in the resume layout, including descriptions, tech stacks, and links.
* **Autonomous PDF Calibration Engine:** The backend rendering engine automatically calculates element dimensions, viewports, and page splits dynamically, running internal layout validation tests to guarantee perfect visual distribution on output.
* **User Feedback & Notifications:** Integrated real-time notifications to inform the user of the exact status of PDF generation (success or failure).
* **Content Abstraction:** Decouple professional data (experiences, skills, projects, cover letter content, contact info) from the presentation layer using modular data schemas.
* **Internationalization (i18n):** Native support for multiple languages (Portuguese and English) switchable dynamically at runtime.
* **Rendering Consistency:** Eliminate layout and formatting inconsistencies caused by client-side browser print engines by delegating PDF generation to a controlled server-side Linux environment inside a container.
* **Development Reactivity:** Full Hot Reload integration across both services, making changes to data, layouts, or server scripts immediately available.

---

## 🏗️ Project Architecture & Directory Structure

The project is structured with the frontend application at the core workspace root and the backend isolated in a dedicated subdirectory using a modular, decoupled architecture:

* **Frontend (`/frontend`):** An interactive, rich user interface built with **React and TypeScript** to manage CV and Cover Letter layouts, dynamic translations, custom styling typography, and export feedback notifications.
* **Backend (`/backend`):** A dedicated microservice acting as the PDF export engine, structured with:
  * **Routes:** Endpoints handling incoming HTTP requests.
  * **Controllers:** Coordinates request processing, document routing, and HTTP responses.
  * **Services:** Isolated document builders (Resume & Cover Letter) managing Puppeteer browser instances and PDF compilation logic.
  * **Templates:** Reusable document structures and HTML blueprints used to assemble the final export pages.
  * **Layouts:** Style rules, grid systems, and structural formatting for physical page alignment and print rendering.
  * **Tests:** Automated tests to validate layout dimensions, element bounding boxes, and dynamic PDF page generation.

---

## 📁 Data Customization & Privacy Shield

To protect your personal information (such as real phone numbers, emails, addresses, and employment history) when publishing your fork or repository publicly, the project utilizes an automated **Template Customization Layer**.

All candidate structure models are stored in the **`frontend/src/app/data/`** directory. The real `.ts` production files are automatically ignored by `.gitignore` to prevent data leaks, while public `.ts.example` files are provided as structural templates.

### 👤 Candidate Information Templates

To build your own resume and cover letter, customize the fields inside these structural files:

* **`frontend/src/app/data/PersonalData.ts.example`**: Contains core personal details (Full Name, professional title, location map links, and contact channels like Email, Phone, GitHub, and LinkedIn).
* **`frontend/src/app/data/SummaryData.ts.example`**: Holds the professional summary or profile pitch paragraph for each supported language.
* **`frontend/src/app/data/SkillsData.ts.example`**: Defines technical skills categories (e.g., Languages, Frameworks, Databases).
* **`frontend/src/app/data/ExperienceData.ts.example`**: Stores professional background history, roles, periods, and accomplishment bullet points.
* **`frontend/src/app/data/ProjectsData.ts.example`**: Holds personal and open-source project details, key achievements, highlights, and repository or live demo links.
* **`frontend/src/app/data/EducationData.ts.example`**: Contains academic degrees, vocational courses, certifications, and institutional descriptions.
* **`frontend/src/app/data/CoverLetterData.ts.example`**: Holds template text and variables for generating personalized Cover Letters.

### 🎨 Visual & Layout Settings

* **`src/app/data/SettingsData.ts.example`**: Edit this template to change the color palettes, fonts, font sizes, weights, or container dimensions for both Light and Dark modes.

---

## 🐳 Dockerization & Automated Bootstrap

The entire ecosystem is containerized using Docker and calibrated with local volumes. To provide a zero-setup onboarding experience, the orchestration layer handles all file initialization automatically.

### 🔄 Intelligent Initialization Automation

When you execute `docker-compose up`, the multi-stage environment performs the following automated synchronization routines before starting up the dev servers:

1. **Frontend Bootstrapping:** The container scans the `src/app/data/` folder. For every missing production file (e.g., `PersonalData.ts`), it automatically creates a functional clone from its corresponding template (`PersonalData.ts.example`).

Any changes subsequently made to your active data components or backend rendering scripts will trigger an instant Hot Reload in the running container without service interruption.

### Prerequisites

* [Docker](https://docs.docker.com/get-docker/) installed.
* [Docker Compose](https://docs.docker.com/compose/install/) installed.

---

## 🚀 How to Run the Project

You can spin up the entire ecosystem simultaneously using the Docker Compose configuration located at the root of the project.

### 1. Build and Start the Containers

Run the following command to build the images, initialize missing data files from templates, and launch the services in development mode:

```bash
docker-compose up --build
