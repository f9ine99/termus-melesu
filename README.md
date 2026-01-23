# Retra
> **"Return the Bottle"** — A specialized digital ledger for Ethiopian retail inventory management.

[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen)]()
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Mobile%20Optimized-blue)]()
[![Framework](https://img.shields.io/badge/Framework-Next.js%2015-black)]()

## Overview
**Retra** (formerly Termus Melesu) is a dedicated inventory and relationship management platform designed to mitigate bottle loss in small retail environments. The system streamlines the tracking of returnable glass bottles, ensuring financial accountability while preserving customer loyalty through a sophisticated trust-based profile system.

---

## Core Features

###  Progressive Web App (PWA)
- **Installable:** Functions as a native app on iOS and Android devices.
- **Offline-Ready:** Continue working seamlessly without an internet connection; data syncs automatically when online.
- **Home Screen Access:** Quick access with a custom icon and splash screen.

###  Modern User Experience
- **Glassmorphism UI:** A premium, translucent design system that provides depth and context.
- **Dynamic Notifications:** "Dynamic Island" style alerts that float elegantly over content.
- **Fluid Animations:** Smooth transitions and spring-based interactions for a natural feel.

###  Performance & Scale
- **Smart Virtualization:** Handles thousands of transactions effortlessly by rendering only what's visible.
- **On-Demand Loading:** "Load More" patterns keep the interface clean and snappy.
- **Full Data Export:** One-click CSV export for comprehensive offline analysis.

###  AI-Powered Analytics
- **Business Summaries:** Automated performance reporting powered by **Groq AI** (gpt-oss-120b).
- **Trend Analysis:** Visual insights into bottle circulation and financial health.
- **All-Time Tracking:** Monitor lifetime "Total Borrowed" and "Total Returned" stats alongside daily metrics.

###  Trust & Security
- **Trust-Based Logic:** Automated deposit tracking for new customers vs. credit profiles for trusted partners.
- **Secure Deletion:** PIN-protected transaction removal to prevent unauthorized data tampering.

---

## Technical Stack

- **Framework:** Next.js (App Router), React.
- **Styling:** Tailwind CSS, Framer Motion (Animations).
- **UI Components:** Radix UI, Lucide React, Sonner (Notifications).
- **Backend:** Supabase (PostgreSQL, Authentication, Real-time Sync).
- **AI Integration:** Groq AI (openai/gpt-oss-120b).
- **State Management:** React Hooks with Local Storage for offline resilience.
- **Analytics:** Vercel Analytics.

---

## Getting Started

### Prerequisites
- Node.js 18 or higher
- pnpm (recommended)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/termus-melesu.git
   cd termus-melesu
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Environment Configuration:
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Development Server:
   ```bash
   pnpm dev
   ```
   Access the application at [http://localhost:3000](http://localhost:3000).

---

## Project Structure

- `app/`: Application routes and API endpoints.
- `components/`: Modular UI components and screen-specific logic.
- `lib/`: Shared utilities, Supabase client, and core business logic.
- `public/`: Static assets and media.
- `styles/`: Global styling and Tailwind configurations.

---

## License
*Bottle Return Tracking System Project - 2026*

