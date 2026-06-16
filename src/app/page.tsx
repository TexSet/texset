import Image from "next/image";

// placeholder landing page. the real dashboard (new project, templates, recents)
// lands in a later step.
export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Image src="/TexSet.svg" alt="TexSet" width={64} height={64} priority />
      <h1 className="text-2xl font-semibold">TexSet</h1>
      <p className="text-text-muted">A fast, local-first LaTeX editor.</p>
    </main>
  );
}
