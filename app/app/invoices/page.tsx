import { Invoices } from "@/components/invoices";
import { INVOICES } from "@/lib/data/invoices";

export default function InvoicesPage() {
  return <Invoices invoices={INVOICES} />;
}
