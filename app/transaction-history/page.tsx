import { redirect } from "next/navigation";

/**
 * The real transaction history lives in the dashboard. This route previously
 * queried a `transactions` table that does not exist, so it always errored.
 * Nothing links here any more; the redirect only catches old bookmarks.
 */
export default function TransactionHistoryRedirect() {
  redirect("/dashboard/transaction-history");
}
