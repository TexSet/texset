"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TemplateGrid } from "@/components/dashboard/TemplateGrid";
import { RecentsList } from "@/components/dashboard/RecentsList";
import Image from "next/image";

interface Project {
  id: string;
  name: string;
  template: string | null;
  updated_at: number;
  last_opened: number | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function createBlankProject() {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Untitled Document" }),
    });

    if (res.ok) {
      const project = await res.json();
      router.push(`/editor/${project.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* header */}
      <header className="sticky top-0 z-50 glass-strong">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-2.5">
            <Image src="/TexSet.svg" alt="TexSet" width={28} height={28} />
            <span className="text-base font-semibold text-text-primary">TexSet</span>
          </div>
        </div>
      </header>

      {/* content */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10 animate-fade-in">
        {/* new project */}
        <section>
          <h2 className="text-sm font-medium text-text-secondary mb-3">New Project</h2>
          <Button
            icon={Plus}
            variant="secondary"
            size="lg"
            onClick={createBlankProject}
          >
            Blank Document
          </Button>
        </section>

        {/* templates */}
        <TemplateGrid />

        {/* recent projects */}
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : (
          <RecentsList projects={projects} />
        )}
      </main>
    </div>
  );
}
