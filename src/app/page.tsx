import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { categoryStyle } from "@/lib/categoryStyle";
import ChatBar from "@/components/ChatBar";

// Keep the directory fast for visitors while reflecting admin changes shortly after.
export const revalidate = 60;

export default async function Home() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, color, is_main, links(id, name, url, description, image_url)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "links", ascending: true });

  const all = categories ?? [];
  const main = all.find((c) => c.is_main) ?? all[0];
  const rest = all.filter((c) => c.id !== main?.id);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-400">FOT</span>
        <Link
          href="/admin"
          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-sky-300/35 hover:bg-sky-300/10 hover:text-sky-100"
        >
          Admin access
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-20 pt-10 sm:px-8 sm:pt-16">
        <section className="mx-auto mb-10 w-full max-w-3xl text-center sm:mb-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Fulfilment Operations knowledge centre
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-[0.08em] text-zinc-50 sm:text-6xl">
            FOT UNIVERSE
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
            Find the right tool, learn how FOT works, or ask a question before you ask around.
          </p>
        </section>

        <section className="mx-auto mb-10 w-full max-w-3xl sm:mb-12">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-sm font-medium text-zinc-100">How can we help?</p>
              <p className="mt-1 text-xs text-zinc-500">Ask about processes, tools, forms, or onboarding.</p>
            </div>
            <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300 sm:block">
              FOT assistant
            </span>
          </div>
          <ChatBar />
        </section>

        {!main ? (
          <p className="text-zinc-500">
            No links yet. Run the setup SQL in Supabase, or add some from the admin panel.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-8">
            <section className="hero-panel rounded-3xl p-5 sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${categoryStyle(main.name, main.color).dot} ${categoryStyle(main.name, main.color).ring}`}
                />
                <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.24em] text-zinc-100">
                  {main.name}
                </h2>
                </div>
                <span className="text-xs text-zinc-500">Most used tools</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {main.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`planet-card group flex min-h-28 flex-row items-center gap-3 rounded-2xl px-4 py-4 text-left sm:flex-col sm:items-center sm:text-center ${categoryStyle(main.name, main.color).border}`}
                  >
                    {link.image_url && (
                      <Image
                        src={link.image_url}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <span className="min-w-0"><span className="block text-sm font-medium text-zinc-100">{link.name}</span>{link.description && <span className="mt-1 block text-xs leading-5 text-zinc-500">{link.description}</span>}</span>
                  </a>
                ))}
                {main.links.length === 0 && (
                  <p className="col-span-full text-sm text-zinc-500">No links in this category yet.</p>
                )}
              </div>
            </section>

            {rest.length > 0 && (
              <div className="grid w-full gap-5 sm:grid-cols-2">
                {rest.map((category) => {
                  const style = categoryStyle(category.name, category.color);
                  return (
                  <section key={category.id} className="glass-panel rounded-2xl p-5 sm:p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${style.dot} ${style.ring}`} />
                      <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200">
                        {category.name}
                      </h2>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {category.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`planet-card flex min-h-16 flex-row items-center gap-3 rounded-xl px-3 py-3 text-left ${style.border}`}
                        >
                          {link.image_url && (
                            <Image
                              src={link.image_url}
                              alt=""
                              width={32}
                              height={32}
                              unoptimized
                            className="h-8 w-8 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <span className="min-w-0"><span className="block text-sm font-medium text-zinc-100">{link.name}</span>{link.description && <span className="mt-0.5 block truncate text-xs text-zinc-500">{link.description}</span>}</span>
                        </a>
                      ))}
                      {category.links.length === 0 && (
                        <p className="col-span-full text-sm text-zinc-500">
                          No links in this category yet.
                        </p>
                      )}
                    </div>
                  </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
