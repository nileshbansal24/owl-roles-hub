import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminInstitutions from "@/components/admin/AdminInstitutions";
import AdminCandidates from "@/components/admin/AdminCandidates";
import AdminJobs from "@/components/admin/AdminJobs";
import AdminMassUpload from "@/components/admin/AdminMassUpload";
import AdminEmails from "@/components/admin/AdminEmails";
import { useAdminStats } from "@/hooks/useAdminStats";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { stats, institutions, candidates, jobs, emails, loading, refetch } = useAdminStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <AdminOverview stats={stats} loading={loading} />;
      case "emails":
        return <AdminEmails emails={emails} loading={loading} />;
      case "institutions":
        return <AdminInstitutions institutions={institutions} loading={loading} onRefetch={refetch} />;
      case "candidates":
        return <AdminCandidates candidates={candidates} loading={loading} />;
      case "jobs":
        return <AdminJobs jobs={jobs} loading={loading} />;
      case "mass-upload":
        return <AdminMassUpload loading={loading} />;
      default:
        return <AdminOverview stats={stats} loading={loading} />;
    }
  };

  return (
    <AdminLayout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminDashboard;
