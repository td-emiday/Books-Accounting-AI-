import { redirect } from "next/navigation";

// Bank & Cash is shelved for now. Anyone landing on the old URL goes to
// the new Transactions page.
export default function BankPage() {
  redirect("/app/transactions");
}
