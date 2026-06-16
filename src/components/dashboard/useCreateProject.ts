"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Creates a project (blank or from a template) and opens it in the editor. The
// pending value is the key of whatever is currently being created, so a single
// card can show its own spinner without disabling the rest.
export function useCreateProject() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function create(body: { templateId?: string }, key: string) {
    if (pending) return;
    setPending(key);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Could not create the project");
      const project = await res.json();
      router.push(`/editor/${project.id}`);
    } catch (err) {
      console.error(err);
      setPending(null);
    }
  }

  return { create, pending };
}
