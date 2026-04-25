import { Clients } from "@/components/clients";
import { CLIENTS } from "@/lib/data/clients";

export default function ClientsPage() {
  return <Clients clients={CLIENTS} />;
}
