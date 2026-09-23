import Image from "next/image";
import Link from "next/link";
import { categoryStyle } from "@/lib/categoryStyle";
import ChatBar from "@/components/ChatBar";
import { getDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";

type PortalLink = {
  id: string;
  name: string;
  url: string;
  description: string | null;
  image_url: string | null;
};

function ToolCard({ link, accent }: { link: PortalLink; accent: string }) {
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={`tool-card group flex min-h-20 items-center gap-3 rounded-2xl px-4 py-3 ${accent}`}>
      {link.image_url ? (
        <Image src={link.image_url} alt="" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded-xl object-cover" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-sm font-semibold text-zinc-300">{link.name.slice(0, 1)}</span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-zinc-100">{link.name}</span>
        {link.description && <span className="mt-0.5 block truncate text-xs text-zinc-400">{link.description}</span>}
      </span>
      <span className="text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300">↗</span>
    </a>
  );
}

export default async function Home() {
  const all = await getDirectory();
  const main = all.find((category) => category.is_main) ?? all[0];
  const rest = all.filter((category) => category.id !== main?.id);

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-300 text-xs font-bold text-slate-950">F</span>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">FOT Universe</span>
        </div>
        <Link href="/admin" className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white">Admin access</Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        <section className="hero-surface grid overflow-hidden rounded-[2rem] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">FOT knowledge centre</p>
            <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">Everything FOT, in one place.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-slate-300 sm:text-base">Find tools, learn a process, and get reliable answers without having to hunt through chats or bookmarks.</p>
            <div className="mt-8 flex gap-6 text-xs text-slate-400"><span><b className="mr-1 font-semibold text-slate-200">{all.length}</b> tool groups</span><span><b className="mr-1 font-semibold text-slate-200">1</b> shared starting point</span></div>
          </div>

          <div className="assistant-surface border-t border-white/10 px-5 py-7 sm:px-8 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold text-white">Ask FOT Assistant</p><p className="mt-1 text-xs leading-5 text-slate-400">Best for forms, processes, onboarding, and training materials.</p></div>
              <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">Available</span>
            </div>
            <ChatBar />
          </div>
        </section>

        {!main ? (
          <p className="py-16 text-center text-sm text-zinc-500">No tools have been added yet.</p>
        ) : (
          <div className="mt-12 space-y-10">
            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${categoryStyle(main.name, main.color).dot} ${categoryStyle(main.name, main.color).ring}`} /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Start here</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-white">{main.name}</h2></div></div>
                <span className="hidden text-xs text-slate-500 sm:block">Frequently used tools</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{main.links.map((link) => <ToolCard key={link.id} link={link} accent={categoryStyle(main.name, main.color).border} />)}</div>
            </section>

            {rest.length > 0 && (
              <section>
                <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Explore more</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-white">Tools by area</h2></div>
                <div className="grid gap-5 md:grid-cols-2">
                  {rest.map((category) => {
                    const style = categoryStyle(category.name, category.color);
                    return <section key={category.id} className="category-surface rounded-2xl p-5"><div className="mb-4 flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${style.dot} ${style.ring}`} /><h3 className="text-sm font-semibold text-zinc-100">{category.name}</h3><span className="text-xs text-slate-500">{category.links.length} tools</span></div><div className="grid gap-2 sm:grid-cols-2">{category.links.map((link) => <ToolCard key={link.id} link={link} accent={style.border} />)}</div></section>;
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
