import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitDonation } from "@/lib/api/reports.functions";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/donate")({
  head: () => ({ meta: [{ title: "Donate — Take Care" }] }),
  component: Donate,
});

function Donate() {
  const donate = useServerFn(submitDonation);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(25);
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await donate({ data: { name, email, amount, message: message || undefined } });
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Heart className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Thank you, {name}!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for supporting Take Care. Donation functionality is currently under development.
          We'll reach out at {email} when it's ready.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Support Take Care</h1>
        <p className="mt-2 text-sm text-muted-foreground">Help us grow community-driven civic action and fund future initiatives.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={255}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Donation Amount (USD)</label>
            <input type="number" min={1} max={1000000} required value={amount} onChange={(e) => setAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            <div className="mt-2 flex gap-2">
              {[10, 25, 50, 100].map((v) => (
                <button type="button" key={v} onClick={() => setAmount(v)}
                  className={`rounded-md border px-3 py-1 text-sm ${amount === v ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>
                  ${v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Message <span className="text-muted-foreground">(optional)</span></label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <button disabled={submitting} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {submitting ? "Submitting…" : "Submit"}
          </button>
          <p className="text-center text-xs text-muted-foreground">Donation functionality is under development — no real payments will be processed.</p>
        </form>
      </div>
    </div>
  );
}
