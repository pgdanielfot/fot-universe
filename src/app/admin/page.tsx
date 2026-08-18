import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addCategory, signOut } from "./actions";
import { categoryStyle, ACCENT_OPTIONS } from "@/lib/categoryStyle";
import CategoryList from "./CategoryList";
import ConfluenceSync from "./ConfluenceSync";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color, is_main, links(id, name, url, description, image_url)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "links", ascending: true });

  const { data: settingsRow } = await supabase
    .from("settings")
    .select("confluence_base_url, confluence_email, confluence_api_token, confluence_space_key")
    .eq("id", "default")
    .single();

  const settings = {
    confluence_base_url: settingsRow?.confluence_base_url ?? null,
    confluence_email: settingsRow?.confluence_email ?? null,
    confluence_space_key: settingsRow?.confluence_space_key ?? null,
    has_token: Boolean(settingsRow?.confluence_api_token),
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-8 py-6">
        <span className="font-[family-name:var(--font-display)] text-sm tracking-widest text-zinc-100">
          FOT UNIVERSE — ADMIN
        </span>
        <div className="flex items-center gap-4 text-xs tracking-widest">
          <Link href="/" className="text-zinc-500 hover:text-zinc-100">
            VIEW SITE
          </Link>
          <form action={signOut}>
            <button className="text-zinc-500 hover:text-zinc-100">SIGN OUT</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-8 pb-16">
        <ConfluenceSync settings={settings} />

        <section className="glass-panel mb-10 rounded-2xl p-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Add category
          </h2>
          <form action={addCategory} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                name="name"
                required
                placeholder="e.g. Finance"
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-white/30 focus:outline-none"
              />
              <button className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:opacity-90">
                Add
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500">Color:</span>
              {ACCENT_OPTIONS.map((key, i) => (
                <label key={key} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={key}
                    defaultChecked={i === 0}
                    className="peer sr-only"
                  />
                  <span
                    className={`block h-5 w-5 rounded-full ${categoryStyle("", key).dot} ring-2 ring-transparent ring-offset-2 ring-offset-black peer-checked:ring-white/70`}
                  />
                </label>
              ))}
            </div>
          </form>
        </section>

        <CategoryList initialCategories={categories ?? []} />
      </main>
    </div>
  );
}
