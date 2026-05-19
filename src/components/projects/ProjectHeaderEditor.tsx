"use client";

import { useState } from "react";
import { Settings, Save, X } from "lucide-react";
import { AccessSummary } from "@/components/access/AccessSummary";

export function ProjectHeaderEditor({
  project,
  canEdit,
}: {
  project: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    coverColor: string | null;
  };
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [key, setKey] = useState(project.key);
  const [description, setDescription] = useState(project.description ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, key, description }),
      });
      if (res.ok) window.location.reload();
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
        title="Project settings"
      >
        <Settings className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-96 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Project settings</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-[hsl(var(--secondary))]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Name</label>
              <input className="input-field text-sm" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Shortname</label>
              <input
                className="input-field text-sm font-mono uppercase"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 6).replace(/[^A-Z]/g, ""))}
                maxLength={6}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[hsl(var(--muted-foreground))] mb-1">Description</label>
            <textarea className="input-field text-sm resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <AccessSummary
            allowedRoles={["admin"]}
            allowedUsers={[]}
            mentionText={`${name} ${description}`}
            note="Admins can edit this project. Add @email or @name in the name or description to grant that user access."
          />
          <button onClick={save} disabled={saving || !name.trim() || key.length < 2} className="btn-primary w-full justify-center">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save project"}
          </button>
        </div>
      )}
    </div>
  );
}
