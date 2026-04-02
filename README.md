# Cloudflare Workers React Template

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/benneberg/videometo)

A production-ready fullstack boilerplate combining Cloudflare Workers (backend) with a modern React frontend powered by Vite, shadcn/ui, Tailwind CSS, and TanStack Query. Includes Durable Objects for stateful storage, type-safe APIs, error handling, and a beautiful responsive UI.

## Features

- **Fullstack TypeScript**: Shared types between frontend and Workers backend
- **Cloudflare Durable Objects**: Built-in global state management (counter, demo items CRUD)
- **Modern React Stack**: Vite, React 18, React Router, TanStack Query, Zod validation
- **shadcn/ui Components**: Fully customizable, accessible UI library with Tailwind CSS
- **Responsive Design**: Dark/light themes, mobile-first, sidebar layout
- **Development Tools**: Hot reload, error reporting, logging, CORS
- **Production Ready**: SPA asset handling, observability, migrations
- **Deployment Optimized**: One-command deploy to Cloudflare Workers/Pages

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Framer Motion, Sonner toasts
- **Backend**: Hono, Cloudflare Workers, Durable Objects, SQLite storage
- **Data/State**: TanStack Query, Zustand, React Hook Form, Zod
- **Utilities**: clsx, tailwind-merge, date-fns, uuid
- **Dev Tools**: Bun, ESLint, Wrangler, Cloudflare Vite plugin

## Quick Start

```bash
bun install
bun dev
```

Access at `http://localhost:3000`.

## Installation

1. **Prerequisites**:
   - [Bun](https://bun.sh/) (package manager)
   - [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
   - Cloudflare account (free tier works)

2. **Clone & Install**:
   ```bash
   git clone <your-repo>
   cd <project>
   bun install
   ```

3. **Generate Types** (Workers bindings):
   ```bash
   bun run cf-typegen
   ```

## Development

- **Start Dev Server** (frontend + Workers proxy):
  ```bash
  bun dev
  ```
  Frontend: `http://localhost:3000`  
  API: `http://localhost:3000/api/*`

- **Type Check**:
  ```bash
  bun run lint
  ```

- **Preview Production Build**:
  ```bash
  bun run preview
  ```

- **Custom Routes**: Add API endpoints in `worker/userRoutes.ts` (auto-reloads in dev).

- **Demo Features**:
  - `/api/health` - Health check
  - `/api/demo` - CRUD demo items (Durable Object storage)
  - `/api/counter` - Global counter
  - Client error reporting: `/api/client-errors`

## Customization

- **UI**: Edit `src/pages/HomePage.tsx`, use shadcn components (`npx shadcn-ui@latest add <component>`)
- **Backend**: Extend `worker/userRoutes.ts`, add DO methods in `worker/durableObject.ts`
- **Sidebar**: Customize `src/components/app-sidebar.tsx` and `src/components/layout/AppLayout.tsx`
- **Theme**: Toggle via `ThemeToggle`, CSS vars in `src/index.css`
- **Shared Types**: `shared/types.ts` for API contracts

**Do not modify**: `worker/index.ts`, `worker/core-utils.ts`, `wrangler.jsonc`

## Deployment

Deploy to Cloudflare Workers with Pages (SPA + API):

```bash
bun run deploy
```

Or manually:

```bash
bun run build
npx wrangler deploy
```

- Assets served as SPA (404s rewrite to `index.html`)
- API routes (`/api/*`) handled by Workers first
- Durable Objects auto-migrate via `wrangler.jsonc`
- Set `wrangler.toml` secrets if needed: `wrangler secret put <KEY>`

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/benneberg/videometo)

## Environment Variables

Handled via Cloudflare dashboard or `wrangler.toml`:

```toml
[vars]
PUBLIC_API_URL = "https://your-worker.youraccount.workers.dev"
```

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/commands/)

## License

MIT - Feel free to use in commercial projects.