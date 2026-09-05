import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminListUsers, adminSetRole } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = ["reader", "vip", "author", "admin"] as const;
const LABEL: Record<string, string> = { reader: "قارئ", vip: "عضوية ترشيش", author: "كاتب", admin: "مشرف" };

export function UsersPanel() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const mutate = useMutation({
    mutationFn: (v: { userId: string; role: string; enabled: boolean }) => setRole({ data: v }),
    onSuccess: () => {
      toast.success("تم تحديث الصلاحيات");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="glass rounded-xl p-6">
      <h2 className="font-display text-2xl text-gold">الأعضاء والصلاحيات</h2>
      {error && <p className="mt-4 text-sm text-destructive">تعذّر جلب الأعضاء.</p>}

      <div className="mt-5 space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-secondary/50" />)
          : (data ?? []).map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card/60 p-4"
              >
                <div className="min-w-48 flex-1">
                  <p className="font-display text-lg">{u.full_name ?? "عضو"}</p>
                  <p dir="ltr" className="text-start text-xs text-muted-foreground">
                    {u.email}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    انضم {new Date(u.created_at).toLocaleDateString("ar")} · آخر دخول{" "}
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ar") : "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => {
                    const on = u.roles.includes(r);
                    return (
                      <Button
                        key={r}
                        size="sm"
                        variant={on ? "default" : "outline"}
                        disabled={mutate.isPending}
                        onClick={() => mutate.mutate({ userId: u.id, role: r, enabled: !on })}
                      >
                        {LABEL[r]}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
      </div>
    </section>
  );
}
