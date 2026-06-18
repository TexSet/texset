"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

// Opens a .tex file and turns it into a new project, then jumps into the editor.
// Typst (.typ) joins the accepted types once that engine exists.
export function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function importFile(file: File) {
    setBusy(true);
    try {
      const content = await file.text();
      const name = file.name.replace(/\.tex$/i, "").trim() || "Imported document";

      const created = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!created.ok) throw new Error("Could not create the project");
      const project = await created.json();

      await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: content }),
      });

      router.push(`/editor/${project.id}`);
    } catch (err) {
      console.error(err);
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        icon={FileUp}
        loading={busy}
        className="w-full"
        onClick={() => inputRef.current?.click()}
      >
        Import .tex
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".tex"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) importFile(file);
          event.target.value = "";
        }}
      />
    </>
  );
}
