"use client";

import { useState } from "react";
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
  // templates whose preview image failed to load fall back to an icon
  const [noPreview, setNoPreview] = useState<Set<string>>(new Set());

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {templates.map((template) => {
        const Icon = icons[template.id] ?? FileText;
        const isPending = pending === template.id;
        const showImage = !noPreview.has(template.id);

        return (
          <button
            key={template.id}
            data-engine={template.engine}
            onClick={() => create({ templateId: template.id }, template.id)}
            disabled={isPending}
            className="group relative overflow-hidden rounded-xl border border-border bg-surface text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift disabled:opacity-60"
          >
            <div className="h-1 bg-accent" />

            <div className="relative flex h-36 items-center justify-center overflow-hidden border-b border-border bg-white">
              {showImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/templates/${template.id}.png`}
                  alt={`${template.name} preview`}
                  className="h-full w-full object-contain object-top"
                  onError={() =>
                    setNoPreview((prev) => new Set(prev).add(template.id))
                  }
                />
              ) : (
                <Icon className="h-10 w-10 text-accent" />
              )}
              {isPending && (
                <span className="absolute inset-0 flex items-center justify-center bg-surface/70">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                </span>
              )}
            </div>

            <div className="space-y-1 p-3">
              <span className="font-medium text-text">{template.name}</span>
              <p className="text-sm text-text-muted">{template.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
