import { useState, type FormEvent } from "react";
import { Copy, Loader2, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMember } from "@/lib/adminActions";

interface Props {
  onRegistered: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function openWhatsApp(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export function OfflineRegistrationForm({ onRegistered, onSuccess, onError }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referrer, setReferrer] = useState("");
  const [loading, setLoading] = useState(false);
  const [tempCredentials, setTempCredentials] = useState<{ email: string; pass: string; memberId?: string } | null>(
    null,
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      onError("Full Name, Email, and Phone number are required.");
      return;
    }

    setLoading(true);
    setTempCredentials(null);
    try {
      const result = await createMember({
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        referral_code: referrer.trim() || undefined,
      });
      setTempCredentials({ email: result.email, pass: result.temp_password, memberId: result.member_id });
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
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone Number</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08062925713" required />
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

        {tempCredentials && (
          <div className="mt-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3.5">
            <span className="mb-1.5 block text-sm font-semibold text-primary">Member Registration Complete!</span>
            <div className="break-all font-mono text-xs leading-relaxed">
              Member ID: <strong>{tempCredentials.memberId}</strong>
              <br />
              Email: <strong>{tempCredentials.email}</strong>
              <br />
              Password: <strong>{tempCredentials.pass}</strong>
            </div>
            <div className="mt-2.5 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Welcome to Agroheal LEAP!\n\nYour Green Card has been confirmed.\nMember ID: ${tempCredentials.memberId}\nEmail: ${tempCredentials.email}\nTemporary Password: ${tempCredentials.pass}\n\nLogin at: https://www.agroheal.solutions/login`,
                  );
                  onSuccess("Credentials copied to clipboard!");
                }}
              >
                <Copy className="h-3.5 w-3.5" /> Copy Details
              </Button>
              <Button
                type="button"
                size="sm"
                className="gap-1.5 bg-[#25D366] text-xs text-white hover:bg-[#1ebe57]"
                onClick={() =>
                  openWhatsApp(
                    `Hello! Your Agroheal LEAP Green Card registration is complete.\n\nMember ID: ${tempCredentials.memberId}\nEmail: ${tempCredentials.email}\nPassword: ${tempCredentials.pass}\n\nYou can sign in at: https://www.agroheal.solutions/login`,
                  )
                }
              >
                <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
