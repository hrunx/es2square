# ES2Square — AI-Assisted Energy Survey & Audit Platform

ES2Square (Energy Survey & Square) streamlines end‑to‑end energy audits for buildings. It captures client intake data, processes utility bills and floor plans, detects equipment with AI, runs LLM‑powered analysis, and generates decision‑ready reports that quantify savings, ROI, and carbon reductions.

## Why it matters (for business stakeholders)
- **Faster sales cycles**: Guided intake + instant, AI‑assisted “Initial Report” to unlock the conversation quickly.
- **Quantified value**: Clear savings, ROI, payback, and CO₂ reduction estimates drive stakeholder buy‑in.
- **Operational efficiency**: Centralized workflow reduces manual data wrangling and repeated analyses.
- **Repeatable process**: Standardized outputs across audits improve consistency and quality.

## What it does (for technical stakeholders)
- **Web app (React + Vite + Tailwind)** for client intake, file upload, and audit workflows.
- **Supabase** for database, storage, and serverless functions (Edge Functions) used as LLM proxies and analysis utilities.
- **AI integrations**:
  - DeepSeek via Supabase Edge Function proxies to avoid CORS and protect API usage patterns.
  - Optional equipment detection in-browser using TensorFlow COCO‑SSD.
  - OCR utilities for extracting text from bills and floor plans.
- **Reporting**: AI‑assisted analysis consolidated into a structured audit report (executive summary, key metrics, recommendations) with export options.

---

## Screens and flows
- **Client Intake**: Create a building record, capture contact and building details.
- **Document Processing**: Upload electricity bills and floor plans; OCR parses and normalizes data.
- **Room & Equipment Assessment**: Enter rooms manually or from plans; capture equipment details and use AI detection where supported.
- **Initial Report**: Quick, AI‑assisted summary to estimate savings and opportunities.
- **Detailed Audit**: Deeper equipment/usage modeling and AI analysis to generate a comprehensive report.

---

## Architecture Overview

- **Frontend**: React (Vite) with TailwindCSS
  - Feature modules under `src/components` and `src/lib`
  - Translation hooks and a lightweight runtime translator
  - TensorFlow model for equipment detection (optional)
- **Backend (via Supabase)**:
  - Postgres DB with migrations under `supabase/migrations`
  - Storage buckets (e.g., `audit-files`) for uploads
  - Edge Functions in `supabase/functions` used as:
    - `auden-proxy`: chat forwarding to DeepSeek (assistant experience)
    - `deepseek-proxy`: generic DeepSeek chat proxy
    - `deepseek-file-proxy`: orchestrates file analysis via LLM
    - `deepseek-analyze`: additional analysis utilities
- **LLM Usage**: DeepSeek is called from the frontend through the proxies; API key is injected from env (see below).

---

## Tech Stack
- React 18, TypeScript, Vite 5
- TailwindCSS 3
- Supabase (Auth/DB/Storage + Edge Functions)
- TensorFlow.js COCO‑SSD (equipment detection)
- Chart.js (visualizations)
- ESLint, TypeScript for quality and safety

---

## Environment Variables
Create a `.env` file (not committed) in the project root.

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# DeepSeek API key for LLM analysis
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key

# Auden proxy (chat assistant over DeepSeek via Supabase function)
# Recommended: point to your Supabase Edge Function route
# Example:
VITE_AUDEN_PROXY=${VITE_SUPABASE_URL}/functions/v1/auden-proxy
```

Notes
- The app expects these to be available at build/runtime via Vite’s `import.meta.env`.
- Do not commit real keys. Use environment‑specific values in your deployment.

---

## Supabase Setup
1. Install Supabase CLI and log in
   ```bash
   supabase login
   ```
2. Link your project (replace `YOUR_PROJECT_REF`)
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
3. Apply database migrations
   ```bash
   supabase db push
   ```
4. Create the storage bucket used for uploads (private by default)
   ```bash
   supabase storage create-bucket audit-files --public=false
   ```
5. Deploy Edge Functions
   ```bash
   supabase functions deploy auden-proxy
   supabase functions deploy deepseek-proxy
   supabase functions deploy deepseek-file-proxy
   supabase functions deploy deepseek-analyze
   ```

RLS & Security
- Migrations enable Row Level Security (RLS) and policies aligned with the app’s flows.
- Use Supabase Auth and service role keys for server‑side operations where appropriate.

---

## Install & Run (Local)
```bash
# 1) Install deps
npm install

# 2) Set up your .env (see above)

# 3) Start the dev server
npm run dev

# 4) Build & preview
npm run build
npm run preview

# 5) Lint
npm run lint
```

Vite Dev Proxy
- The dev server proxies calls to `/functions/v1/*` to `${VITE_SUPABASE_URL}` and adds `apikey`/`Authorization` headers for you (see `vite.config.ts`).

---

## Key Modules (where to look in the code)
- `src/App.tsx`: App shell, client intake flow and routing of audit steps.
- `src/components/*`:
  - `ClientIntakeForm.tsx`: creates building record and orchestrates intake steps.
  - `InitialReport.tsx` / `DetailedAudit.tsx` / `AuditReport.tsx`: audit flows and report UI.
  - `AIEquipmentDetection.tsx`: optional TensorFlow COCO‑SSD based detection.
- `src/lib/*`:
  - `supabase.ts`: Supabase client initialization.
  - `deepseek.ts`, `auden.ts`: LLM proxy calls.
  - `ocr.ts`: OCR utilities for extracting text from images/PDFs.
  - `reportGenerator.ts`, `finalReport.ts`: analysis normalization and report composition.

---

## Typical Workflow
1. Start a new audit and capture building details.
2. Upload bills and/or floor plans; OCR extracts and normalizes data.
3. Add rooms and equipment (or detect equipment with AI where possible).
4. Generate an Initial Report for quick insights.
5. Continue to a Detailed Audit for refined recommendations and full report.
6. Export or share the report with stakeholders.

---

## Business Metrics in Reports
- **Executive Summary**: savings, ROI, payback, CO₂ reductions.
- **Energy Performance**: annual consumption, peak demand, energy cost.
- **Recommendations**: itemized, prioritized measures with impact and cost ranges.

---

## Deployment Notes
- Use environment‑specific `.env` values per environment.
- Keep `VITE_SUPABASE_ANON_KEY` scoped to anon‑level access; enforce RLS for sensitive tables.
- Host the frontend on any static host (e.g., Vercel/Netlify), and point it to your Supabase project.

---

## Roadmap Ideas
- Cost curves and sensitivity analysis
- Automated PDF export and branded templates
- Multi‑language content with higher coverage
- Integrations with asset management/CMMS

---

## License
Proprietary — all rights reserved unless a separate license file is provided.
