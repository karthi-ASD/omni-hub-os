import { useParams } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";
import { ClientAccessHubTab } from "@/components/clients/access-hub/ClientAccessHubTab";
import { useAuth } from "@/contexts/AuthContext";

const ClientAccessHubPage = () => {
  const { id } = useParams<{ id: string }>();
  const { isClientUser, clientId } = useAuth();
  usePageTitle("Access & Integrations", "Client credentials and integrations hub");

  const resolvedClientId = isClientUser ? clientId : id;

  if (!resolvedClientId) {
    return <div className="text-center py-12 text-muted-foreground">No client selected</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Access & Integrations</h1>
        <p className="text-sm text-muted-foreground">Manage credentials, marketing integrations, and renewal tracking</p>
      </div>
      <ClientAccessHubTab clientId={resolvedClientId} isClientView={isClientUser} />
    </div>
  );
};

export default ClientAccessHubPage;
