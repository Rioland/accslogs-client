import supabaseClient from "@/lib/supabaseClient";

/** Bill products that pay *someone* — ePINs have no recipient to save. */
export type BeneficiaryProduct = "airtime" | "data" | "electricity" | "tv" | "betting";

export const BENEFICIARY_PRODUCTS: readonly BeneficiaryProduct[] = [
  "airtime",
  "data",
  "electricity",
  "tv",
  "betting",
];

export function isBeneficiaryProduct(value: string): value is BeneficiaryProduct {
  return (BENEFICIARY_PRODUCTS as readonly string[]).includes(value);
}

export type Beneficiary = {
  id: string;
  product_type: BeneficiaryProduct;
  service_id: string;
  customer_id: string;
  variation_id: string | null;
  nickname: string | null;
  customer_name: string | null;
  last_used_at: string;
};

/**
 * A number the customer has paid before but never saved, recovered from bill
 * history so the picker is useful from day one.
 */
export type RecentRecipient = {
  product_type: BeneficiaryProduct;
  service_id: string;
  customer_id: string;
  variation_id: string | null;
  last_used_at: string;
};

export type BeneficiaryInput = {
  product_type: BeneficiaryProduct;
  service_id: string;
  customer_id: string;
  variation_id?: string | null;
  nickname?: string | null;
  customer_name?: string | null;
};

const COLUMNS =
  "id, product_type, service_id, customer_id, variation_id, nickname, customer_name, last_used_at";

export function beneficiaryKey(b: {
  product_type: string;
  service_id: string;
  customer_id: string;
}) {
  return `${b.product_type}|${b.service_id}|${b.customer_id.trim()}`;
}

function isMissingTable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    /schema cache|does not exist/i.test(error.message || "")
  );
}

/**
 * `available: false` means the table has not been created yet (migration not
 * run). The page then hides the save option but still offers recent numbers.
 */
export async function listBeneficiaries(
  userId: string,
): Promise<{ items: Beneficiary[]; available: boolean }> {
  const { data, error } = await supabaseClient
    .from("bill_beneficiaries")
    .select(COLUMNS)
    .eq("user_id", userId)
    .order("last_used_at", { ascending: false })
    .limit(200);

  if (error) {
    if (isMissingTable(error)) return { items: [], available: false };
    console.warn("bill beneficiaries:", error.message);
    return { items: [], available: true };
  }
  return { items: (data as Beneficiary[]) || [], available: true };
}

/** Distinct recipients from the customer's recent successful bill payments. */
export async function listRecentRecipients(userId: string): Promise<RecentRecipient[]> {
  const { data, error } = await supabaseClient
    .from("bill_payments")
    .select("product_type, service_id, customer_id, variation_id, status, created_at")
    .eq("user_id", userId)
    .in("status", ["completed", "processing"])
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  const seen = new Set<string>();
  const out: RecentRecipient[] = [];
  for (const row of data as Array<Record<string, string | null>>) {
    const product = String(row.product_type || "");
    const customer = String(row.customer_id || "").trim();
    if (!isBeneficiaryProduct(product) || !customer || !row.service_id) continue;
    const item: RecentRecipient = {
      product_type: product,
      service_id: String(row.service_id),
      customer_id: customer,
      variation_id: row.variation_id ?? null,
      last_used_at: String(row.created_at),
    };
    const key = beneficiaryKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/**
 * Insert, or refresh an existing beneficiary's last-used time. Optional fields
 * are only sent when known, so paying a saved beneficiary without typing a
 * nickname keeps the nickname it already has.
 */
export async function saveBeneficiary(userId: string, input: BeneficiaryInput) {
  const row: Record<string, unknown> = {
    user_id: userId,
    product_type: input.product_type,
    service_id: input.service_id,
    customer_id: input.customer_id.trim(),
    last_used_at: new Date().toISOString(),
  };
  if (input.variation_id) row.variation_id = input.variation_id;
  const nickname = input.nickname?.trim();
  if (nickname) row.nickname = nickname.slice(0, 60);
  const name = input.customer_name?.trim();
  if (name) row.customer_name = name.slice(0, 120);

  const { error } = await supabaseClient
    .from("bill_beneficiaries")
    .upsert(row, { onConflict: "user_id,product_type,service_id,customer_id" });
  if (error) throw new Error(error.message);
}

export async function deleteBeneficiary(id: string) {
  const { error } = await supabaseClient.from("bill_beneficiaries").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
