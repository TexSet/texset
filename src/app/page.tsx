import { listProjects } from "@/lib/projects";
import { templates } from "@/lib/templates";
import { Sidebar } from "@/components/dashboard/Sidebar";
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
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="min-w-0 flex-1 animate-fade-in space-y-10 px-8 py-10">
        <section id="templates" className="space-y-4">
          <h2 className="text-lg font-semibold">Templates</h2>
          <TemplateGrid templates={templateCards} />
        </section>

        <section id="projects" className="space-y-4">
          <h2 className="text-lg font-semibold">My Projects</h2>
          <ProjectsGallery initialProjects={projects} />
        </section>
      </main>
    </div>
  );
}
