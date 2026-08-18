"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function uploadLinkImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: FormDataEntryValue | null
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("link-images").upload(path, file, {
    contentType: file.type,
  });
  if (error) return null;

  return supabase.storage.from("link-images").getPublicUrl(path).data.publicUrl;
}

export async function addLink(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");

  if (!name || !url || !categoryId) return;

  const { data: siblings } = await supabase
    .from("links")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (siblings?.[0]?.sort_order ?? -1) + 1;
  const imageUrl = await uploadLinkImage(supabase, formData.get("image"));

  await supabase.from("links").insert({
    name,
    url,
    description: description || null,
    image_url: imageUrl,
    category_id: categoryId,
    sort_order: nextSortOrder,
  });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function editLink(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!id || !name || !url) return;

  const imageUrl = await uploadLinkImage(supabase, formData.get("image"));

  await supabase
    .from("links")
    .update({
      name,
      url,
      description: description || null,
      ...(imageUrl ? { image_url: imageUrl } : {}),
    })
    .eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function reorderLinks(categoryId: string, orderedIds: string[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("links").update({ sort_order: index }).eq("id", id).eq("category_id", categoryId)
    )
  );

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteLink(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("links").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function addCategory(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim();
  if (!name) return;

  const { data: siblings } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (siblings?.[0]?.sort_order ?? -1) + 1;

  await supabase
    .from("categories")
    .insert({ name, color: color || null, sort_order: nextSortOrder });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function reorderCategories(orderedIds: string[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("categories").update({ sort_order: index }).eq("id", id)
    )
  );

  revalidatePath("/");
  revalidatePath("/admin");
}

export async function setMainCategory(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("categories").update({ is_main: false }).neq("id", id);
  await supabase.from("categories").update({ is_main: true }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function deleteCategory(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function saveConfluenceSettings(formData: FormData) {
  const supabase = await createClient();
  const confluence_base_url = String(formData.get("confluence_base_url") ?? "").trim();
  const confluence_email = String(formData.get("confluence_email") ?? "").trim();
  const confluence_api_token = String(formData.get("confluence_api_token") ?? "").trim();
  const confluence_space_key = String(formData.get("confluence_space_key") ?? "").trim();

  await supabase
    .from("settings")
    .update({
      confluence_base_url: confluence_base_url || null,
      confluence_email: confluence_email || null,
      ...(confluence_api_token ? { confluence_api_token } : {}),
      confluence_space_key: confluence_space_key || null,
    })
    .eq("id", "default");

  revalidatePath("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
