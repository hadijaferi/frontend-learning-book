export interface NavigationItem {
  readonly id: string;
  readonly label: string;
}

export interface NavigationChapter {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly items: readonly NavigationItem[];
}

// Chapter 01 keeps the existing React lessons and expands into other frontend disciplines.
// Future chapters (AI, Go) will use separate navigation entries when their content is published.
export const navigationChapters: readonly NavigationChapter[] = [
  {
    id: "frontend",
    title: "Frontend",
    description: "فصل ۰۱ · مبانی تا معماری پیشرفته",
    items: [
      { id: "toc", label: "فهرست مطالب فعلی" },
      { id: "goals", label: "هدف‌های React Rendering" },
      { id: "concept", label: "Render و Commit" },
      { id: "flow", label: "مسیر آپدیت State" },
      { id: "reconcile", label: "Reconciliation و Fiber" },
      { id: "snapshot", label: "State Snapshot و Batching" },
      { id: "tree", label: "کامپوننت‌ها، memo و key" },
      { id: "code", label: "تمرین‌های React + TS" },
      { id: "pitfall", label: "سوءبرداشت‌های رایج" },
      { id: "interview", label: "سؤال‌های مصاحبه" },
      { id: "glossary", label: "واژه‌نامه React و منابع" },
      { id: "javascript", label: "JavaScript & Browser Internals" },
      { id: "typescript", label: "Advanced TypeScript" },
      { id: "state-management", label: "State Management & Data Fetching" },
      { id: "nextjs", label: "Next.js Architecture" },
      { id: "performance", label: "Performance & Virtualization" },
      { id: "service-workers", label: "Service Workers, PWA & Offline" },
      { id: "security", label: "Web Security & Networking" },
      { id: "security-xss-csrf", label: "↳ XSS و CSRF در React و Next.js" },
      { id: "nx", label: "Nx Monorepo & Micro-frontends" },
      { id: "docker", label: "Docker & Frontend DevOps" },
      { id: "testing", label: "Testing & Code Quality" },
      { id: "design-systems", label: "Design Systems & Accessibility" },
      { id: "architecture", label: "Frontend System Design" },
      { id: "vite", label: "Vite & Frontend Build Tools" },
      { id: "vercel", label: "Vercel & Deployment" },
    ],
  },
];
