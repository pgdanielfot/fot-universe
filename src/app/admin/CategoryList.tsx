"use client";

import { useState, useTransition } from "react";
import { addLink, deleteCategory, setMainCategory, reorderCategories } from "./actions";
import { categoryStyle } from "@/lib/categoryStyle";
import LinkList from "./LinkList";

type LinkRow = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  image_url: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
  color: string | null;
  is_main: boolean;
  links: LinkRow[];
};

export default function CategoryList({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }

    const from = categories.findIndex((c) => c.id === dragId);
    const to = categories.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return;

    const next = [...categories];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setCategories(next);
    setDragId(null);
    startTransition(() => {
      reorderCategories(next.map((c) => c.id));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {categories.map((category) => {
        const style = categoryStyle(category.name, category.color);
        return (
          <section
            key={category.id}
            draggable
            onDragStart={(e) => {
              if ((e.target as HTMLElement).closest("input, button, textarea, form")) {
                e.preventDefault();
                return;
              }
              setDragId(category.id);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(category.id)}
            className={`glass-panel rounded-2xl p-6 ${dragId === category.id ? "opacity-40" : ""}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex cursor-grab items-center gap-2 active:cursor-grabbing">
                <span className="text-zinc-600">⠿</span>
                <span className={`h-2 w-2 rounded-full ${style.dot} ${style.ring}`} />
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  {category.name}
                </h3>
                {category.is_main && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-300">
                    MAIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!category.is_main && (
                  <form action={setMainCategory}>
                    <input type="hidden" name="id" value={category.id} />
                    <button className="text-xs text-zinc-400 hover:text-zinc-100">
                      Set as main
                    </button>
                  </form>
                )}
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={category.id} />
                  <button className="text-xs text-red-400 hover:text-red-300">
                    Delete category
                  </button>
                </form>
              </div>
            </div>

            <LinkList categoryId={category.id} initialLinks={category.links} />

            <form action={addLink} className="flex flex-wrap gap-2">
              <input type="hidden" name="categoryId" value={category.id} />
              <input
                name="name"
                required
                placeholder="Link name"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <input
                name="url"
                required
                type="url"
                placeholder="https://..."
                className="flex-[2] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <input
                name="description"
                placeholder="Short description (optional)"
                className="flex-[2] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <input
                name="image"
                type="file"
                accept="image/*"
                className="flex-[2] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-zinc-100"
              />
              <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:opacity-90">
                Add link
              </button>
            </form>
          </section>
        );
      })}
    </div>
  );
}
