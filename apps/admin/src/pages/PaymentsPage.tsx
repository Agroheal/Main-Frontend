import { Loader2 } from "lucide-react";
import { useAdminMembers } from "@/hooks/useAdminMembers";
import { PaymentsLogTable } from "@/components/admin/PaymentsLogTable";

export default function PaymentsPage() {
  const { paymentLogs, loading } = useAdminMembers();

  if (loading && paymentLogs.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading payment logs...
      </div>
    );
  }

  return <PaymentsLogTable logs={paymentLogs} />;
}
