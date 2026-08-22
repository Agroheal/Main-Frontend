import { useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMember } from "@/lib/adminActions";
import {
  OfflineRegistrationSuccessDialog,
  type OfflineRegistrationCredentials,
} from "@/components/admin/OfflineRegistrationSuccessDialog";

interface Props {
  onRegistered: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function OfflineRegistrationForm({ onRegistered, onSuccess, onError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referrer, setReferrer] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<OfflineRegistrationCredentials | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      onError("Full Name and Email are required.");
      return;
    }

    setLoading(true);
    try {
      const result = await createMember({
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        referral_code: referrer.trim() || undefined,
      });
      setTempCredentials({
        fullName: name.trim(),
        email: result.email,
        pass: result.temp_password,
        memberId: result.member_id,
      });
      onSuccess(`Member ${name} registered successfully! (Member ID: ${result.member_id || "Assigned"})`);
      setName("");
      setEmail("");
      setPhone("");
      setReferrer("");
      onRegistered();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to complete offline registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Offline Member Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Michael O Abbey" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email Address</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="member@gmail.com" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone Number (Optional)</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08062925713" />
            <p className="mt-1 text-[11px] text-muted-foreground">The member can add this themselves after logging in.</p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Referrer Code (Optional)</label>
            <Input value={referrer} onChange={(e) => setReferrer(e.target.value)} placeholder="e.g. KOGBE" />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 w-full gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {loading ? "Registering..." : "Register Member & Setup Green Card"}
          </Button>
        </form>
      </CardContent>

      <OfflineRegistrationSuccessDialog
        credentials={tempCredentials}
        onOpenChange={(open) => !open && setTempCredentials(null)}
        onCopied={() => onSuccess("Credentials copied to clipboard!")}
      />
    </Card>
  );
}
