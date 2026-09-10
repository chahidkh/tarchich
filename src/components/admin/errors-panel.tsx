import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, Trash2, Eraser, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminListErrors, adminDeleteError, adminPurgeErrors } from "@/lib/error-log.functions";

export function ErrorsPanel() {
  const qc = useQueryClient();
  const list = useServerFn(adminListErrors);
  const remove = useServerFn(adminDeleteError);
  const purge = useServerFn(adminPurgeErrors);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-error-logs"],
    queryFn: () => list(),
  });

  async function refresh() {
    await qc.invalidateQueries({ queryKey: ["admin-error-logs"] });
  }

  async function del(id: string) {
    try {
      await remove({ data: { id } });
      toast.success("حُذف السجل");
      await refresh();
    } catch {
      toast.error("تعذّر الحذف");
    }
  }

  async function clearAll() {
    try {
      await purge({ data: { all: true } });
      toast.success("أُفرغ السجل");
      await refresh();
    } catch {
      toast.error("تعذّر الإفراغ");
    }
  }

  if (isLoading) return <Skeleton className="h-64 rounded-xl bg-secondary/50" />;

  const rows = data ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">
          آخر 100 خطأ مسجّل. تُحذف السجلات الأقدم من ثلاثين يوماً تلقائياً.
        </p>
        <div className="ms-auto flex gap-2">
          <Button size="sm" variant="outline" disabled={isFetching} onClick={() => void refresh()}>
            <RefreshCw className="size-4" /> تحديث
          </Button>
          <Button size="sm" variant="outline" disabled={rows.length === 0} onClick={() => void clearAll()}>
            <Eraser className="size-4" /> إفراغ السجل
          </Button>
        </div>
      </div>

      {rows.length === 0 && <p className="text-sm text-muted-foreground">لا أخطاء مسجّلة — الحمد لله.</p>}

      {rows.map((e) => (
        <article key={e.id} className="glass rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-gold" />
            <span className="font-medium break-all">{e.message}</span>
            <span className="rounded-full bg-primary/20 px-2 text-[11px] text-gold">{e.source}</span>
            {e.path && <span className="text-xs text-muted-foreground">{e.path}</span>}
            <span className="ms-auto text-xs text-muted-foreground">
              {new Date(e.created_at).toLocaleString("ar")}
            </span>
          </div>
          {e.detail && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-gold-soft">التفاصيل</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-6 text-muted-foreground">
                {e.detail}
              </pre>
            </details>
          )}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => void del(e.id)}>
              <Trash2 className="size-4" /> حذف
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
