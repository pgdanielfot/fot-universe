import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

type DirectoryCategory = {
  id: string;
  name: string;
  color: string | null;
  is_main: boolean;
  links: {
    id: string;
    name: string;
    url: string;
    description: string | null;
    image_url: string | null;
  }[];
};

// This client has no user cookies: the directory is public and can therefore be
// shared from Next's data cache across all portal visitors.
async function fetchDirectory(): Promise<DirectoryCategory[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, color, is_main, links(id, name, url, description, image_url)")
    .order("sort_order", { ascending: true })
    .order("sort_order", { referencedTable: "links", ascending: true });

  if (error) throw error;
  return (data ?? []) as DirectoryCategory[];
}

export const getDirectory = unstable_cache(fetchDirectory, ["fot-public-directory"], {
  revalidate: 3600,
  tags: ["fot-public-directory"],
});
