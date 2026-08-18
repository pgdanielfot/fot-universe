import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { categoryStyle } from "@/lib/categoryStyle";
import ChatBar from "@/components/ChatBar";

export const revalidate = 0;

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
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-8 pb-24 pt-16">
        <div className="mb-14 mt-6 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold tracking-widest glow-title sm:text-6xl">
            FOT UNIVERSE
          </h1>
          <p className="mt-4 text-sm tracking-wide text-zinc-500">
            Your gateway to every galaxy in the FOT system
          </p>
        </div>

        <ChatBar />

        {!main ? (
          <p className="text-zinc-500">
            No links yet. Run the setup SQL in Supabase, or add some from the admin panel.
          </p>
        ) : (
          <div className="flex w-full flex-col gap-10">
            <section className="hero-panel rounded-2xl p-8">
              <div className="mb-6 flex items-center gap-3">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${categoryStyle(main.name, main.color).dot} ${categoryStyle(main.name, main.color).ring}`}
                />
                <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.3em] text-zinc-200">
                  {main.name}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {main.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`planet-card flex flex-col items-center gap-2 rounded-xl px-4 py-4 text-center ${categoryStyle(main.name, main.color).border}`}
                  >
                    {link.image_url && (
                      <Image
                        src={link.image_url}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="rounded-lg object-cover"
                      />
                    )}
                    <span className="text-sm font-medium text-zinc-100">{link.name}</span>
                    {link.description && (
                      <span className="text-xs text-zinc-500">{link.description}</span>
                    )}
                  </a>
                ))}
                {main.links.length === 0 && (
                  <p className="col-span-full text-sm text-zinc-500">No links in this category yet.</p>
                )}
              </div>
            </section>

            {rest.length > 0 && (
              <div className="grid w-full gap-6 sm:grid-cols-2">
                {rest.map((category) => {
                  const style = categoryStyle(category.name, category.color);
                  return (
                  <section key={category.id} className="glass-panel rounded-2xl p-6">
                    <div className="mb-5 flex items-center gap-3">
                      <span className={`h-2 w-2 rounded-full ${style.dot} ${style.ring}`} />
                      <h2 className="font-[family-name:var(--font-display)] text-xs font-semibold uppercase tracking-[0.25em] text-zinc-300">
                        {category.name}
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {category.links.map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`planet-card flex flex-col items-center gap-2 rounded-xl px-4 py-3 text-center ${style.border}`}
                        >
                          {link.image_url && (
                            <Image
                              src={link.image_url}
                              alt=""
                              width={32}
                              height={32}
                              unoptimized
                              className="rounded-lg object-cover"
                            />
                          )}
                          <span className="text-sm font-medium text-zinc-100">{link.name}</span>
                          {link.description && (
                            <span className="text-xs text-zinc-500">{link.description}</span>
                          )}
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
