"use client";

import {
  FileText,
  IdCard,
  Mail,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type { EngineId } from "@/lib/engines";
import { useCreateProject } from "./useCreateProject";

export interface TemplateCard {
  id: string;
  name: string;
  description: string;
  engine: EngineId;
}

const icons: Record<string, LucideIcon> = {
  article: FileText,
  letter: Mail,
  resume: IdCard,
  presentation: Presentation,
};

export function TemplateGrid({ templates }: { templates: TemplateCard[] }) {
  const { create, pending } = useCreateProject();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {templates.map((template) => {
        const Icon = icons[template.id] ?? FileText;
        const isPending = pending === template.id;

        return (
          <button
            key={template.id}
            data-engine={template.engine}
            onClick={() => create({ templateId: template.id }, template.id)}
            disabled={isPending}
            className="group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4 pt-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
          >
            <span className="absolute inset-x-0 top-0 h-1 bg-accent" />
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
              {isPending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </span>
            <span className="font-medium text-text">{template.name}</span>
            <span className="text-sm text-text-muted">{template.description}</span>
          </button>
        );
      })}
    </div>
  );
}
