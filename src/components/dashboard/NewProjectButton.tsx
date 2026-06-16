"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCreateProject } from "./useCreateProject";

export function NewProjectButton() {
  const { create, pending } = useCreateProject();

  return (
    <Button
      size="lg"
      icon={Plus}
      loading={pending === "blank"}
      onClick={() => create({}, "blank")}
    >
      Blank document
    </Button>
  );
}
