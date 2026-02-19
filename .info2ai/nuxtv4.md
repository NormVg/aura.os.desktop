This document outlines the directory structure and key architectural concepts for **Nuxt 4**, covering the new `app/` directory standard and separation of concerns.

# Nuxt 4 Directory Structure

Nuxt 4 introduces a cleaner, more modular structure by default. The most significant change is grouping all Vue application code into an `app/` directory, while keeping server code and configuration at the root.

## 1. File Tree Overview

```text
root/
├── .nuxt/                  # Auto-generated (do not touch)
├── .output/                # Build output
├── app/                    # [NEW] Main Vue application context
│   ├── assets/             # Uncompiled assets (Sass, images, fonts)
│   ├── components/         # Vue components (auto-imported)
│   ├── composables/        # Vue composables (auto-imported)
│   ├── layouts/            # Page layouts
│   ├── middleware/         # Route middleware (client/universal)
│   ├── pages/              # File-based routing views
│   ├── plugins/            # Vue plugins
│   ├── utils/              # Helper functions (client/universal)
│   ├── app.config.ts       # Runtime app configuration
│   ├── app.vue             # Root Vue component
│   ├── error.vue           # Error page component
│   └── router.options.ts   # (Optional) Custom Router config
├── content/                # (Optional) Nuxt Content markdown files
├── layers/                 # (Optional) Reusable Nuxt layers
├── modules/                # (Optional) Local modules
├── node_modules/           # Dependencies
├── public/                 # Static files served as-is (robots.txt, favicon)
├── server/                 # Server-side Nitro code (API, routes)
│   ├── api/                # API routes (/api/*)
│   ├── middleware/         # Server middleware (runs on every request)
│   ├── plugins/            # Nitro plugins
│   ├── routes/             # Server routes (non-API)
│   └── utils/              # Server-only utilities
├── .env                    # Environment variables
├── nuxt.config.ts          # Main build configuration
└── tsconfig.json           # TypeScript configuration

```

---

## 2. Key Directories Explained

### The `app/` Directory (Client Context)

In Nuxt 4, the "source directory" (`srcDir`) defaults to `app/`. This isolates your Vue code from server code and build configs.

* **`components/`**: Place `.vue` components here. Subdirectories effectively namespace the component name (e.g., `app/components/base/Button.vue` -> `<BaseButton />`).
* **`pages/`**: Creates routes automatically. `app/pages/about.vue` becomes `/about`.
* **`composables/`**: Auto-imported logic. Export named functions (e.g., `export const useUser = () => ...`).
* **`app.vue`**: The main entry point. Use this if you don't need routing (landing pages) or to wrap `<NuxtPage />` for global layouts.

### The `server/` Directory (Nitro Context)

Code here runs **only** on the server (during SSR or API calls). It does **not** get bundled into the client client.

* **`api/`**: Files here automatically become API endpoints prefixed with `/api`.
* Example: `server/api/users.ts` maps to `GET /api/users`.


* **`routes/`**: Similar to `api/` but without the `/api` prefix. Good for generating `sitemap.xml` or `robots.txt` dynamically.
* **`utils/`**: Functions exported here are auto-imported **only within the `server/` directory**. They are not available in `app/`.

### The `public/` Directory

Static files that must be accessible via URL but don't need processing (Webpack/Vite).

* File: `public/logo.png`
* Access: `<img src="/logo.png" />`

---

## 3. Important Nuxt 4 "Stuff" & Changes

### A. Context Isolation (Type Safety)

Nuxt 4 creates separate "virtual" TypeScript environments for `app/` and `server/`.

* **Benefit**: You cannot accidentally import a server utility (like a database connector) into a client-side Vue component. If you try, TypeScript will throw an error.
* **Shared Code**: If you need code shared between both (e.g., types/interfaces), put it in a `shared/` directory (if configured) or the root `utils/` (though standard Nuxt 4 encourages clear separation).

### B. Data Fetching Changes (`useFetch` / `useAsyncData`)

* **Stale Data**: In Nuxt 4, when you refetch data, the old data is cleared **immediately** (value becomes `null` while loading). In Nuxt 3, it kept the old data until the new data arrived.
* **Shared Refs**: Requests with the exact same key will share the same `data`, `error`, and `pending` states automatically across components.

### C. Auto-Imports

Nuxt automatically scans `components`, `composables`, and `utils` to auto-import them.

* **Client**: Imports from `app/composables` and `app/utils`.
* **Server**: Imports from `server/utils`.

### D. Layers (`layers/`)

Nuxt 4 treats `layers/` as a first-class citizen. You can drop a whole mini-Nuxt app inside a folder in `layers/`, and it will extend your main app. Useful for separating domains (e.g., `layers/marketing`, `layers/dashboard`).

### E. Configuration

* **`nuxt.config.ts`**: Stays at the root. Handles modules, build settings, and runtime config.
* **`app.config.ts`**: Moves to `app/app.config.ts`. Used for reactive UI configuration (like themes, titles) that updates without a rebuild.
