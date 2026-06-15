"use client";

import { useRouter } from "next/navigation";
import { FileText, GraduationCap, Presentation, User, Mail } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

const templates: Template[] = [
  { id: "article", name: "Article", description: "Academic paper with sections", icon: FileText },
  { id: "thesis", name: "Thesis", description: "Full thesis with chapters", icon: GraduationCap },
  { id: "beamer", name: "Beamer", description: "Slide presentation", icon: Presentation },
  { id: "cv", name: "CV / Resume", description: "Professional resume", icon: User },
  { id: "letter", name: "Letter", description: "Formal letter", icon: Mail },
];

export function TemplateGrid() {
  const router = useRouter();

  async function createFromTemplate(templateId: string, templateName: string) {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `New ${templateName}`,
        template: templateId,
      }),
    });

    if (res.ok) {
      const project = await res.json();
      router.push(`/editor/${project.id}`);
    }
  }

  return (
    <section>
      <h2 className="text-sm font-medium text-text-secondary mb-3">Templates</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => createFromTemplate(t.id, t.name)}
            className="group flex flex-col items-center gap-3 p-4 rounded-xl border border-border
                       bg-surface-raised hover:border-accent hover:shadow-glow
                       transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center
                          group-hover:bg-accent group-hover:text-white transition-colors duration-200">
              <t.icon size={20} className="text-accent group-hover:text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">{t.name}</p>
              <p className="text-xs text-text-muted mt-0.5">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
