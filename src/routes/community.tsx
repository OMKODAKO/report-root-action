import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, MapPin, MessageSquare, Heart, Users, Trophy, Trees, Sparkles } from "lucide-react";
import {
  getCommunity,
  getImpactStats,
  createDiscussion,
  toggleDiscussionLike,
  joinEvent,
  joinChallenge,
  addComment,
  getDiscussion,
} from "@/lib/api/community.functions";
import { useAuth } from "@/hooks/use-auth";

const communityQ = queryOptions({ queryKey: ["community"], queryFn: () => getCommunity() });
const impactQ = queryOptions({ queryKey: ["impact"], queryFn: () => getImpactStats() });

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Join Community — Take Care" },
      { name: "description", content: "Join monthly challenges, discussions, and community events to make a real-world impact." },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(communityQ),
      context.queryClient.ensureQueryData(impactQ),
    ]),
  component: Community,
  errorComponent: ({ error }) => <div className="p-8 text-center text-destructive">{error.message}</div>,
});

function Community() {
  const { data } = useSuspenseQuery(communityQ);
  const { data: impact } = useSuspenseQuery(impactQ);
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["community"] });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 space-y-12">
      <header>
        <h1 className="text-3xl font-bold md:text-4xl">Join the Community</h1>
        <p className="mt-2 text-muted-foreground">
          Participate in challenges, discussions, and events. Build something that lasts.
        </p>
      </header>

      {/* Impact */}
      <section>
        <h2 className="mb-4 text-xl font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Community Impact</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <ImpactStat label="Reports" value={impact.totalReports} />
          <ImpactStat label="Members" value={impact.totalUsers} />
          <ImpactStat label="Resolved" value={impact.resolvedReports} />
          <ImpactStat label="Active" value={impact.activeMembers} />
          <ImpactStat label="Events" value={impact.eventsOrganized} />
        </div>
      </section>

      {/* Monthly challenge */}
      {data.challenge && (
        <section className="rounded-2xl border bg-gradient-to-br from-primary/10 to-card p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Trees className="h-4 w-4" /> Monthly Challenge
          </div>
          <h2 className="mt-2 text-2xl font-bold">{data.challenge.title}</h2>
          <p className="mt-2 text-muted-foreground">{data.challenge.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-6 text-sm">
            <span>
              <span className="text-muted-foreground">Starts: </span>
              {new Date(data.challenge.start_date).toLocaleDateString()}
            </span>
            <span>
              <span className="text-muted-foreground">Ends: </span>
              {new Date(data.challenge.end_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary" /> {data.challenge.participants} participants
            </span>
          </div>
          <JoinChallengeButton challengeId={data.challenge.id} onDone={invalidate} userPresent={!!user} />
        </section>
      )}

      {/* Leaderboard */}
      <section>
        <h2 className="mb-4 text-xl font-semibold flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> Top Contributors</h2>
        {data.leaderboard.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributors yet — submit a report to climb the leaderboard.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {data.leaderboard.slice(0, 3).map((u) => (
              <div key={u.user_id} className="rounded-xl border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{u.rank === 1 ? "🥇" : u.rank === 2 ? "🥈" : "🥉"}</div>
                  <div>
                    <div className="font-semibold">{u.profile?.name ?? "Contributor"}</div>
                    <div className="text-xs text-muted-foreground">{u.total_points} pts</div>
                  </div>
                </div>
                {u.badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {u.badges.map((b: any) => (
                      <span key={b.id} title={b.name} className="text-lg">{b.icon}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {data.leaderboard.length > 3 && (
          <div className="mt-4 rounded-xl border bg-card">
            {data.leaderboard.slice(3).map((u) => (
              <div key={u.user_id} className="flex items-center justify-between border-b px-4 py-3 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-sm text-muted-foreground">#{u.rank}</span>
                  <span className="font-medium">{u.profile?.name ?? "Contributor"}</span>
                  <span className="flex gap-1">
                    {u.badges.slice(0, 4).map((b: any) => <span key={b.id}>{b.icon}</span>)}
                  </span>
                </div>
                <span className="text-sm font-semibold text-primary">{u.total_points} pts</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Events */}
      <section>
        <h2 className="mb-4 text-xl font-semibold flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Upcoming Events</h2>
        {data.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.events.map((e) => (
              <div key={e.id} className="rounded-xl border bg-card p-5 flex flex-col">
                <h3 className="font-semibold">{e.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{e.description}</p>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(e.event_date).toLocaleString()}</div>
                  <div className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.location}</div>
                  <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e.participants} attending</div>
                </div>
                <JoinEventButton eventId={e.id} onDone={invalidate} userPresent={!!user} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Badges showcase */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Badges to earn</h2>
        <div className="grid gap-3 md:grid-cols-5">
          {data.badges.map((b: any) => (
            <div key={b.id} className="rounded-xl border bg-card p-4 text-center">
              <div className="text-3xl">{b.icon}</div>
              <div className="mt-1 font-semibold text-sm">{b.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{b.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Discussions */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Community Discussions</h2>
        </div>
        <NewDiscussionForm onCreated={invalidate} userPresent={!!user} />
        <div className="mt-6 space-y-3">
          {data.discussions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No discussions yet — start the first one.</p>
          ) : (
            data.discussions.map((d) => (
              <DiscussionItem key={d.id} discussion={d} onChange={invalidate} userPresent={!!user} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ImpactStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function JoinChallengeButton({ challengeId, onDone, userPresent }: { challengeId: string; onDone: () => void; userPresent: boolean }) {
  const join = useServerFn(joinChallenge);
  const [busy, setBusy] = useState(false);
  if (!userPresent) {
    return <Link to="/login" className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Sign in to join</Link>;
  }
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try { await join({ data: { challenge_id: challengeId } }); toast.success("You're in!"); onDone(); }
        catch (e: any) { toast.error(e?.message ?? "Failed"); }
        finally { setBusy(false); }
      }}
      className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
    >
      Join challenge
    </button>
  );
}

function JoinEventButton({ eventId, onDone, userPresent }: { eventId: string; onDone: () => void; userPresent: boolean }) {
  const join = useServerFn(joinEvent);
  const [busy, setBusy] = useState(false);
  if (!userPresent) {
    return <Link to="/login" className="mt-3 inline-block rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Sign in to join</Link>;
  }
  return (
    <button
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try { const r = await join({ data: { event_id: eventId } }); toast.success(r.joined ? "Joined event" : "Left event"); onDone(); }
        catch (e: any) { toast.error(e?.message ?? "Failed"); }
        finally { setBusy(false); }
      }}
      className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-60"
    >
      Join / Leave
    </button>
  );
}

function NewDiscussionForm({ onCreated, userPresent }: { onCreated: () => void; userPresent: boolean }) {
  const create = useServerFn(createDiscussion);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  if (!userPresent) {
    return (
      <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">Sign in</Link> to start a discussion.
      </div>
    );
  }
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try { await create({ data: { title, content } }); toast.success("Discussion posted"); setTitle(""); setContent(""); onCreated(); }
        catch (err: any) { toast.error(err?.message ?? "Failed"); }
        finally { setBusy(false); }
      }}
      className="rounded-xl border bg-card p-4 space-y-3"
    >
      <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="Discussion title"
        required className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
      <textarea value={content} onChange={(e) => setContent(e.target.value)} maxLength={5000} placeholder="Share your thoughts…"
        required rows={3} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
      <button disabled={busy} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
        {busy ? "Posting…" : "Post discussion"}
      </button>
    </form>
  );
}

function DiscussionItem({ discussion, onChange, userPresent }: { discussion: any; onChange: () => void; userPresent: boolean }) {
  const toggleLike = useServerFn(toggleDiscussionLike);
  const comment = useServerFn(addComment);
  const fetchD = useServerFn(getDiscussion);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const detail = useQuery({
    queryKey: ["discussion", discussion.id],
    queryFn: () => fetchD({ data: { id: discussion.id } }),
    enabled: open,
  });

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{discussion.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{discussion.content}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            By {discussion.author?.name ?? "Member"} · {new Date(discussion.created_at).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <button
            disabled={!userPresent}
            onClick={async () => {
              try { await toggleLike({ data: { discussion_id: discussion.id } }); onChange(); }
              catch (e: any) { toast.error(e?.message ?? "Failed"); }
            }}
            className="flex items-center gap-1 hover:text-primary disabled:opacity-50"
          >
            <Heart className="h-4 w-4" /> {discussion.likes}
          </button>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 hover:text-primary">
            <MessageSquare className="h-4 w-4" /> {discussion.comments}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 border-t pt-4 space-y-3">
          {detail.isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
          {detail.data?.comments.map((c: any) => (
            <div key={c.id} className="rounded-md bg-muted/40 p-3 text-sm">
              <div className="text-xs font-medium">{c.author_name ?? "Member"}</div>
              <div className="mt-1 whitespace-pre-wrap">{c.content}</div>
            </div>
          ))}
          {userPresent ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!text.trim()) return;
                setBusy(true);
                try {
                  await comment({ data: { discussion_id: discussion.id, content: text } });
                  setText("");
                  await detail.refetch();
                  onChange();
                } catch (err: any) { toast.error(err?.message ?? "Failed"); }
                finally { setBusy(false); }
              }}
              className="flex gap-2"
            >
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} placeholder="Add a comment…"
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button disabled={busy} className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60">Reply</button>
            </form>
          ) : (
            <div className="text-xs text-muted-foreground"><Link to="/login" className="text-primary hover:underline">Sign in</Link> to comment.</div>
          )}
        </div>
      )}
    </div>
  );
}
