import { NewProjectButton } from "./NewProjectButton";

// Left navigation for the dashboard. Holds the brand, the primary action, and
// jumps to the page sections. Roomy enough to grow an engine filter and a theme
// toggle later.
export function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col gap-6 border-r border-border bg-surface px-4 py-5">
      <span className="px-1 text-xl font-bold tracking-tight">
        Tex<span className="text-accent">Set</span>
      </span>

      <NewProjectButton />

      <nav className="flex flex-col gap-0.5 text-sm">
        <a
          href="#templates"
          className="rounded-md px-2 py-1.5 text-text-muted transition hover:bg-surface-2 hover:text-text"
        >
          Templates
        </a>
        <a
          href="#projects"
          className="rounded-md px-2 py-1.5 text-text-muted transition hover:bg-surface-2 hover:text-text"
        >
          My Projects
        </a>
      </nav>
    </aside>
  );
}
