# PIMS — Police Investigation Management System

A full-stack web application for managing police investigations, leads, cases, and associated evidence. Built for the Endicott Police Department.

---

## Features

- **Lead & Case Management** — Create, assign, track, and close investigative leads and cases
- **Lead Returns** — Structured return workflows with versioning and audit history
- **Evidence & Chain of Custody** — Track persons, vehicles, enclosures, evidence, audio, video, and pictures
- **Document Review** — Upload and review case documents with inline PDF viewing
- **Report Generation** — Generate PDF reports with executive summaries
- **Role-Based Access Control** — Admin, investigator, and officer roles with scoped permissions
- **Real-time Presence** — Track active users on case records
- **Notifications** — Due date alerts and in-app notifications
- **Audit Logs** — Full activity logging across all case actions
- **MFA & SSO** — Multi-factor authentication with Microsoft Azure AD (MSAL)
- **Scratchpad & Timeline** — Freeform notes and chronological case timelines

---

## Tech Stack

**Backend**
- Node.js, Express
- MongoDB with Mongoose
- JWT + MSAL (Azure AD) authentication
- Azure Blob Storage, AWS S3
- Puppeteer, PDFKit, pdf-lib (report generation)
- Nodemailer, Redis (ioredis), Multer, GridFS

**Frontend**
- React
- Microsoft MSAL React (SSO)
- Hosted on Azure App Service / Netlify

---

## Project Structure

```
PIMS/
├── backend/
│   └── src/
│       ├── config/         # DB connection, environment config
│       ├── controller/     # Route controllers
│       ├── jobs/           # Scheduled jobs (due date notifier)
│       ├── middleware/     # Auth middleware
│       ├── models/         # Mongoose models
│       ├── routes/         # Express route definitions
│       ├── seeds/          # DB seed scripts
│       └── server.js       # App entry point
└── frontend/
    └── src/
        ├── Pages/          # Feature pages (leads, cases, reports, etc.)
        ├── components/     # Shared UI components
        ├── hooks/          # Custom React hooks
        ├── utils/          # Utility functions
        └── msalConfig.js   # Azure AD SSO configuration
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB instance
- Azure AD app registration (for SSO/MFA)
- Azure Blob Storage or AWS S3 credentials

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in MONGO_URI, JWT_SECRET, Azure/AWS keys
npm run dev            # starts on port 7002
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # fill in REACT_APP_API_URL, MSAL config
npm start              # starts on port 3000
```

### Production Build

```bash
cd frontend && npm run build
# backend serves the build folder in production mode
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | Server port (default: 7002) |
| `AZURE_*` | Azure Blob Storage credentials |
| `AWS_*` | AWS S3 credentials |
| `AZURE_AD_*` | Azure AD tenant/client config for MSAL |

---

## Deployment

- System is deployed on **Azure App Service** (Canada Central)
- Production domain: `pims.endicott.org`

---

## License

Internal use only — Endicott Police Department.
