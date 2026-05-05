import { Clients } from "@/components/clients";
import { getClients } from "@/lib/queries/clients";

export default async function ClientsPage() {
  const clients = await getClients();
  return <Clients clients={clients} />;
}
