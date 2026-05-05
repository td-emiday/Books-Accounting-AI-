import { Invoices } from "@/components/invoices";
import { getInvoices } from "@/lib/queries/invoices";

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  return <Invoices invoices={invoices} />;
}
