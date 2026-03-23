import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PageHeader } from "@/components/ui/page-header";
import { AdminCommunicationDashboard } from "@/components/crm/AdminCommunicationDashboard";
import { Radio } from "lucide-react";

const AdminCommunicationsPage = () => {
  usePageTitle("Admin Communications");
  const { profile, roles } = useAuth();
  const businessId = profile?.business_id;

  console.log("ROLE:", { roles, screen: "admin-communications" });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Admin Communications"
        subtitle="Business-wide communication analytics and history"
        icon={Radio}
      />
      {businessId && <AdminCommunicationDashboard businessId={businessId} />}
    </div>
  );
};

export default AdminCommunicationsPage;