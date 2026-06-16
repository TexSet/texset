"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Placeholder editor. It confirms the project loads end to end; the real
// CodeMirror + PDF preview lands in the next step.
export default function EditorPage({ params }: { params: { id: string } }) {
  const [name, setName] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${params.id}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setName(data.project.name))
      .catch(() => setMissing(true));
  }, [params.id]);

  return (
    <div className="min-h-screen">
      <header className="glass flex h-14 items-center gap-3 border-b border-border px-6">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm text-text-muted transition hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <span className="font-medium">{name ?? (missing ? "Not found" : "Loading...")}</span>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        {missing ? (
          <p className="text-text-muted">This project doesn&apos;t exist.</p>
        ) : (
          <p className="text-text-muted">The editor is coming together. Hang tight.</p>
        )}
      </main>
    </div>
  );
}
