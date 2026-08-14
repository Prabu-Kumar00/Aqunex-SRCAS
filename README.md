# Aqunex | Autonomous Water Quality Monitoring Platform

## 1. Prerequisites

- Node.js (v18 or later)
- npm
- Git

## 2. Clone and Install

```bash
git clone https://github.com/Prabu-Kumar00/Aqunex-SRCAS.git
cd Aqunex-SRCAS
npm install
```

## 3. Firebase Service Account (backend)

1. In Firebase Console:  
   Project Settings → Service accounts → “Generate new private key”.
2. Download `serviceAccountKey.json` and place it in the project root (same folder as `package.json`).

## 4. Firebase Web Config (frontend)

In the HTML files (dashboard and reports), replace the `firebaseConfig` object with your project’s config from:

Firebase Console → Project Settings → “Your apps” → Web app → Config.

## 5. Run the Server

```bash
npm start
```

Then open:

- Dashboard: `http://localhost:3001/dashboard`  
- Reports: `http://localhost:3001/reports`

## 6. Mock Data (optional)

```bash
npm run mock:start # start generating mock data
npm run mock:cleanup # delete all mock data
```