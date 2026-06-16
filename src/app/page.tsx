import { listProjects } from "@/lib/projects";
import { templates } from "@/lib/templates";
import { NewProjectButton } from "@/components/dashboard/NewProjectButton";
import { TemplateGrid } from "@/components/dashboard/TemplateGrid";
import { ProjectsGallery } from "@/components/dashboard/ProjectsGallery";

// the dashboard reads straight from the data layer on the server, so there's no
// client-side loading spinner on first paint
export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const projects = listProjects();
  const templateCards = templates.map(({ id, name, description, engine }) => ({
    id,
    name,
    description,
    engine,
  }));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 glass border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-6">
          <span className="text-base font-semibold tracking-tight">TexSet</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl animate-fade-in space-y-10 px-6 py-10">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-muted">New document</h2>
          <NewProjectButton />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-muted">Templates</h2>
          <TemplateGrid templates={templateCards} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-text-muted">My projects</h2>
          <ProjectsGallery initialProjects={projects} />
        </section>
      </main>
    </div>
  );
}
