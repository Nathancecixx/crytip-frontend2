# Crypto Tip Jar Front-End Documentation

Welcome to the documentation for the Crypto Tip Jar front-end. This guide provides an overview of the application's architecture, development workflows, and feature set so that contributors and operators can understand how to maintain and extend the project effectively.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Application Structure](#application-structure)
4. [Environment Configuration](#environment-configuration)
5. [Development Workflow](#development-workflow)
6. [UI/UX Guidelines](#uiux-guidelines)
7. [State Management](#state-management)
8. [API Integration](#api-integration)
9. [Wallet Integration](#wallet-integration)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)

---

## Project Overview

Crypto Tip Jar is a decentralized tipping platform that enables content creators to receive cryptocurrency donations. The front-end is built with **Next.js** and provides creators with tools to manage profiles, generate tip pages, and track contributions. Visitors can browse creator pages, connect a wallet, and send tips quickly and securely.

## Technology Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript with React 18
- **Styling:** Tailwind CSS with typography utilities
- **State Management:** Zustand for shared application state
- **Blockchain:** Solana Web3.js and Wallet Adapter libraries
- **Form Validation:** Zod for schema-based validation

This stack offers a performant, scalable, and developer-friendly environment, allowing both server-side rendering and static generation where appropriate.

## Application Structure

The project follows Next.js App Router conventions. The top-level `app/` directory contains route segments and shared layouts.

```
app/
├── layout.tsx        # Root layout and global providers
├── page.tsx          # Landing page
├── docs/             # Documentation route
├── dashboard/        # Authenticated creator dashboard
├── editor/           # Tip page editor
├── login/            # Authentication flow
└── [slug]/           # Public creator tip pages
```

Supporting directories include:

- `components/`: Reusable UI components such as cards, buttons, and layout primitives.
- `lib/`: Utility helpers for API clients, blockchain interactions, and shared logic.
- `store/`: Zustand store definitions for the editor and dashboard experiences.
- `content/Documentation.md`: This documentation file, rendered on the `/docs` route.

## Environment Configuration

Create a `.env.local` file to configure runtime settings. Required variables include:

- `NEXT_PUBLIC_API_BASE_URL`: Base URL of the backend API.
- `NEXT_PUBLIC_SOLANA_CLUSTER`: Cluster endpoint (e.g., `https://api.mainnet-beta.solana.com`).
- `NEXT_PUBLIC_SOLANA_COMMITMENT`: Commitment level for Solana RPC calls.

Additional environment variables may be introduced as features expand. Keep secrets out of source control.

## Development Workflow

1. **Install Dependencies:** `npm install`
2. **Run the Dev Server:** `npm run dev` and open `http://localhost:3000`.
3. **Type Checking:** `npm run lint` validates TypeScript and ESLint rules.
4. **Testing (Future):** Integrate component and integration tests as the project grows.

Use feature branches for changes, submit pull requests, and ensure code reviews validate quality and consistency.

## UI/UX Guidelines

- Utilize Tailwind utility classes and shared components to maintain a cohesive visual identity.
- Follow responsive design principles—most components should gracefully adapt to mobile, tablet, and desktop viewports.
- Use typography helpers (e.g., `prose`) for rich text content.
- Provide meaningful empty states and loading indicators.

## State Management

Zustand stores under `app/store/` keep UI state synchronized across components. Stores are structured by domain—editor, dashboard, and wallet interactions. Each store exposes selectors and actions for clear data flow. When adding new global state, define the schema with TypeScript interfaces and keep mutations predictable and side-effect free.

## API Integration

The front-end communicates with the Crypto Tip Jar backend via RESTful endpoints defined in `lib/api`. Requests are wrapped with helper functions that automatically attach authentication headers and handle errors. Use Zod schemas to validate request and response payloads to maintain robustness.

## Wallet Integration

Wallet connectivity relies on the Solana Wallet Adapter suite:

- `@solana/web3.js` provides primitives for crafting and sending transactions.
- `@solana/wallet-adapter-react` exposes hooks and context providers.
- `@solana/wallet-adapter-react-ui` renders wallet selection modals.

Wrap pages that require wallet access with the wallet provider defined in `app/layout.tsx`. Always guard actions that depend on a connected wallet and surface clear error messaging when connections fail.

## Testing Strategy

Automated testing is currently limited, but the long-term plan includes:

- **Unit Tests:** Validate critical utilities in `lib/` and `store/` using Jest or Vitest.
- **Component Tests:** Use React Testing Library to ensure UI components render as expected.
- **End-to-End Tests:** Introduce Playwright or Cypress for flows like tipping and profile management.

When introducing new features, accompany them with tests where feasible.

## Deployment

1. **Build:** `npm run build`
2. **Start:** `npm run start`

The build output is production-ready and can be deployed to any platform that supports Node.js (e.g., Vercel, Netlify, or custom infrastructure). Ensure environment variables are configured in the hosting provider.

## Troubleshooting

- **Missing Environment Variables:** Verify `.env.local` contains required keys.
- **Wallet Connection Errors:** Confirm the Solana cluster endpoint is reachable and wallet adapters are up-to-date.
- **API Failures:** Inspect network requests in the browser dev tools and validate API responses against Zod schemas.

## Contributing

1. Fork the repository and create a feature branch.
2. Make your changes with clear commits and descriptive messages.
3. Ensure linting passes and update documentation when behavior changes.
4. Open a pull request describing the motivation, implementation details, and testing performed.

Thank you for contributing to Crypto Tip Jar! Together we can build a vibrant ecosystem that empowers creators and supporters worldwide.
