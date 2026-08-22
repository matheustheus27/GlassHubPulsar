# 🔌 REST API Reference - GlassHub Professional Resume

This document provides a comprehensive reference for all REST API endpoints provided by the **GlassHub Professional Resume** Express backend. The API follows RESTful conventions, consumes and returns JSON payloads, and requires **JSON Web Token (JWT)** authentication via the `Authorization` header.

---

## 🔑 Authentication & Headers

### Standard Request Headers
```http
Content-Type: application/json
Authorization: Bearer <YOUR_JWT_TOKEN>
```

### Seeded Default Credentials
Upon initializing the database via Docker/Prisma, the following seeded accounts are ready for testing:

| Account Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **`ADMIN`** | `admin@glasshub.com` | `AdminPassword123!` | Full access to Admin Cockpit, system logs, Datadog metrics, BullMQ queues, and executive PDF reports. |
| **`USER`** | `test@glasshub.com` | `TestPassword123!` | Access to Candidate Workspace with pre-filled resume data. |

---

## 1. 🛡️ Authentication & Security (`/api/auth`)

### `POST /api/auth/register`
Registers a new user account.

- **Request Body:**
  ```json
  {
    "name": "Matheus Silva",
    "email": "matheus@example.com",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response (`201 Created`):**
  ```json
  {
    "message": "User registered successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u-12345",
      "name": "Matheus Silva",
      "email": "matheus@example.com",
      "role": "USER"
    }
  }
  ```

---

### `POST /api/auth/login`
Authenticates an existing user and returns a JWT token.

- **Request Body:**
  ```json
  {
    "email": "test@glasshub.com",
    "password": "TestPassword123!"
  }
  ```
- **Success Response (`200 OK`):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u-67890",
      "name": "Test User",
      "email": "test@glasshub.com",
      "role": "USER",
      "is2FAEnabled": false
    }
  }
  ```

---

### `POST /api/auth/2fa/setup`
Generates a TOTP secret and QR code URL for setting up Two-Factor Authentication (2FA).

- **Response (`200 OK`):**
  ```json
  {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
  ```

---

### `POST /api/auth/2fa/verify`
Validates a 6-digit TOTP token and enables 2FA on the account.

- **Request Body:**
  ```json
  {
    "code": "123456"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "message": "Two-Factor Authentication enabled successfully."
  }
  ```

---

## 2. 📄 Resume Management (`/api/resume`)

### `GET /api/resume`
Retrieves the current resume of the authenticated user in the requested language.

- **Query Parameters:** `?lang=pt-BR` or `?lang=en-US`
- **Response (`200 OK`):**
  ```json
  {
    "id": "res-9988",
    "language": "pt-BR",
    "version": 1,
    "title": "Senior Software Engineer",
    "personalDetails": {
      "fullName": "Matheus Silva",
      "jobTitle": "Fullstack & Cloud Architect",
      "email": "matheus@glasshub.com",
      "phone": "+55 11 99999-8888",
      "location": "São Paulo, Brazil",
      "links": [
        { "label": "GitHub", "url": "https://github.com/matheustheus27", "icon": "github" },
        { "label": "LinkedIn", "url": "https://linkedin.com/in/matheustheus27", "icon": "linkedin" }
      ]
    },
    "summary": {
      "text": "Engineer with 8+ years experience leading microservice architectures and <BOLD>Glassmorphism</BOLD> UIs."
    },
    "skills": [
      { "category": "Frontend", "items": ["React", "TypeScript", "Vite", "Tailwind CSS"] },
      { "category": "Backend & Cloud", "items": ["Node.js", "Express", "PostgreSQL", "Docker", "Redis"] }
    ],
    "experiences": [
      {
        "company": "Tech Corp",
        "position": "Tech Lead",
        "period": "2022 - Present",
        "bullets": ["Led team of 10 engineers.", "Reduced latency by 40%."]
      }
    ]
  }
  ```

---

### `PUT /api/resume`
Updates resume payload data.

- **Request Body:** Complete `ResumeData` JSON payload.
- **Response (`200 OK`):** Returns the updated resume object.

---

### `POST /api/resume/import`
Parses and extracts structured resume data from an uploaded `.pdf` or `.docx` document via LLM AI.

- **Content-Type:** `multipart/form-data`
- **Form Data:** `file`: `<RESUME_DOCUMENT.pdf>`
- **Response (`200 OK`):** Returns structured JSON ready to populate editor fields.

---

## 3. 🎯 ATS Scoring Engine (`/api/ats`)

### `POST /api/ats/score`
Evaluates the current resume payload against a target job description and returns ATS compatibility metrics.

- **Request Body:**
  ```json
  {
    "jobDescription": "Looking for Node.js and React developer experienced with PostgreSQL and BullMQ queues..."
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "atsScore": 88,
    "matchedKeywords": ["Node.js", "React", "PostgreSQL", "BullMQ"],
    "missingKeywords": ["GraphQL", "Kubernetes"],
    "recommendations": [
      "Add quantitative metrics to experience descriptions.",
      "Highlight projects utilizing relational PostgreSQL databases."
    ]
  }
  ```

---

## 4. 🖨️ Asynchronous PDF Export (`/api/pdf`)

### `POST /api/pdf/export`
Enqueues a PDF rendering job into the BullMQ `worker-pdf` queue.

- **Request Body:**
  ```json
  {
    "template": "GlassModern",
    "themeColor": "#06b6d4",
    "language": "pt-BR"
  }
  ```
- **Response (`202 Accepted`):**
  ```json
  {
    "jobId": "job-pdf-45612",
    "status": "PENDING",
    "message": "PDF export job enqueued successfully."
  }
  ```

---

### `GET /api/pdf/status/:jobId`
Polls the progress status of an enqueued PDF export job.

- **Response (`200 OK`):**
  ```json
  {
    "jobId": "job-pdf-45612",
    "status": "COMPLETED",
    "progress": 100,
    "downloadUrl": "/api/pdf/download/job-pdf-45612"
  }
  ```

---

## 5. 💬 Support Tickets & Chat (`/api/tickets`)

### `POST /api/tickets`
Opens a new support ticket.

- **Request Body:**
  ```json
  {
    "type": "TECHNICAL_ISSUE",
    "subject": "PDF Export alignment issue on Firefox",
    "description": "When generating PDF on Firefox, margins are slightly shifted."
  }
  ```

---

### `GET /api/tickets/:id/sse`
Connects to a Server-Sent Events (SSE) stream for real-time support chat messages between candidates and support agents.

---

## 6. ⚠️ Account Deletion & Recovery (`/api/user`)

### `POST /api/user/delete-request`
Schedules account deletion with a **30-day soft-deletion grace period**.

- **Response (`200 OK`):**
  ```json
  {
    "message": "Account deletion scheduled. Your account will be deactivated and permanently purged in 30 days.",
    "scheduledPermanentDeletionAt": "2026-09-21T03:00:00.000Z",
    "recoveryToken": "rec-token-776655"
  }
  ```

---

### `POST /api/user/recover`
Restores an account scheduled for deletion using the single-use recovery token sent via email.

- **Request Body:**
  ```json
  {
    "recoveryToken": "rec-token-776655"
  }
  ```
- **Response (`200 OK`):**
  ```json
  {
    "message": "Account reactivated successfully! Scheduled deletion has been cancelled."
  }
  ```

---

## 7. 🛠️ Admin Cockpit & Telemetry (`/api/admin`)

*Requires JWT Bearer token with `role: "ADMIN"`.*

- `GET /api/admin/metrics` - Returns aggregated metrics from Datadog DogStatsD and system load.
- `GET /api/admin/logs` - Queries PostgreSQL `SystemExecutionLog` table with severity level filters (`INFO`, `WARN`, `ERROR`).
- `GET /api/admin/report-pdf` - Generates an executive system status report in PDF on demand.
