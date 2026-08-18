"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { deleteLink, editLink, reorderLinks } from "./actions";

type LinkRow = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  image_url: string | null;
};

export default function LinkList({
  categoryId,
  initialLinks,
}: {
  categoryId: string;
  initialLinks: LinkRow[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (links.length === 0) {
    return <p className="mb-4 text-sm text-zinc-500">No links yet.</p>;
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }

    const from = links.findIndex((l) => l.id === dragId);
    const to = links.findIndex((l) => l.id === targetId);
    if (from === -1 || to === -1) return;

    const next = [...links];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setLinks(next);
    setDragId(null);
    startTransition(() => {
      reorderLinks(categoryId, next.map((l) => l.id));
    });
  }

  return (
    <ul className="mb-4 flex flex-col gap-2">
      {links.map((link) =>
        editingId === link.id ? (
          <li
            key={link.id}
            className="rounded-lg border border-white/20 bg-white/[0.04] px-3 py-3 text-sm"
          >
            <form
              action={editLink}
              className="flex flex-col gap-2"
              onSubmit={() => setEditingId(null)}
            >
              <input type="hidden" name="id" value={link.id} />
              <input
                name="name"
                required
                defaultValue={link.name}
                placeholder="Link name"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <input
                name="url"
                required
                type="url"
                defaultValue={link.url}
                placeholder="https://..."
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <input
                name="description"
                defaultValue={link.description ?? ""}
                placeholder="Short description (optional)"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <input
                name="image"
                type="file"
                accept="image/*"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-zinc-100"
              />
              {link.image_url && (
                <p className="text-xs text-zinc-500">
                  Has an image already — pick a new file above to replace it.
                </p>
              )}
              <div className="flex gap-3">
                <button className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:opacity-90">
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </li>
        ) : (
          <li
            key={link.id}
            draggable
            onDragStart={() => setDragId(link.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(link.id)}
            className={`flex cursor-grab items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm active:cursor-grabbing ${
              dragId === link.id ? "opacity-40" : ""
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="shrink-0 text-zinc-600">⠿</span>
              {link.image_url ? (
                <Image
                  src={link.image_url}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="shrink-0 rounded-md object-cover"
                />
              ) : (
                <span className="h-7 w-7 shrink-0 rounded-md bg-white/5" />
              )}
              <div className="min-w-0">
                <p className="truncate">
                  <span className="font-medium text-zinc-100">{link.name}</span>{" "}
                  <span className="text-zinc-500">— {link.url}</span>
                </p>
                {link.description && (
                  <p className="truncate text-xs text-zinc-500">{link.description}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3 pl-3">
              <button
                onClick={() => setEditingId(link.id)}
                className="text-xs text-zinc-400 hover:text-zinc-100"
              >
                Edit
              </button>
              <form action={deleteLink}>
                <input type="hidden" name="id" value={link.id} />
                <button className="text-xs text-red-400 hover:text-red-300">Remove</button>
              </form>
            </div>
          </li>
        )
      )}
    </ul>
  );
}
