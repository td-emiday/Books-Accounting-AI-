"use server";

import { revalidatePath } from "next/cache";
import { requireAdminUser } from "@/lib/admin-auth";

const RESEND_API = "https://api.resend.com";

function audience(): string {
  const id = process.env.RESEND_AUDIENCE_ID;
  if (!id) throw new Error("RESEND_AUDIENCE_ID not set");
  return id;
}

function authHeaders() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function addSubscriber(form: { email: string; first_name: string; last_name: string }) {
  await requireAdminUser();
  const email = form.email.trim().toLowerCase();
  if (!email) throw new Error("Email required");
  const res = await fetch(`${RESEND_API}/audiences/${audience()}/contacts`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      email,
      first_name: form.first_name.trim() || undefined,
      last_name: form.last_name.trim() || undefined,
      unsubscribed: false,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  revalidatePath("/admin/subscribers");
}

export async function removeSubscriber(contactId: string) {
  await requireAdminUser();
  const res = await fetch(`${RESEND_API}/audiences/${audience()}/contacts/${contactId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  revalidatePath("/admin/subscribers");
}

export async function toggleUnsubscribed(contactId: string, unsubscribed: boolean) {
  await requireAdminUser();
  const res = await fetch(`${RESEND_API}/audiences/${audience()}/contacts/${contactId}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ unsubscribed }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  revalidatePath("/admin/subscribers");
}

interface Contact {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  unsubscribed: boolean;
}

export async function listSubscribers(): Promise<{ contacts: Contact[]; error?: string }> {
  try {
    await requireAdminUser();
  } catch (e) {
    return { contacts: [], error: e instanceof Error ? e.message : String(e) };
  }
  try {
    const res = await fetch(`${RESEND_API}/audiences/${audience()}/contacts`, {
      headers: authHeaders(),
      cache: "no-store",
    });
    if (!res.ok) return { contacts: [], error: `Resend ${res.status}: ${await res.text()}` };
    const json = (await res.json()) as { data: Contact[] };
    return { contacts: json.data ?? [] };
  } catch (e) {
    return { contacts: [], error: e instanceof Error ? e.message : String(e) };
  }
}
