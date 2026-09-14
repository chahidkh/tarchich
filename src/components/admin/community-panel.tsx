import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, MessageSquare, Pin, PinOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityPanel() {
  const qc = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,title,content,author_id,created_at,is_pinned,majlis_category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: comments } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id,content,post_id,user_id,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const del = useMutation({
    mutationFn: async ({ table, id }: { table: "posts" | "comments"; id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم الحذف");
      void qc.invalidateQueries({ queryKey: ["admin-posts"] });
      void qc.invalidateQueries({ queryKey: ["admin-comments"] });
      void qc.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <section className="glass rounded-xl p-6">
        <h2 className="font-display text-2xl text-gold">إشراف المنشورات</h2>
        <div className="mt-5 space-y-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg bg-secondary/50" />)
            : (posts ?? []).map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-4"
                >
                  <div className="flex-1">
                    <p className="font-display text-lg">{p.title}</p>
                    <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">{p.content}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("ar")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("حذف هذا المنشور وكل تعليقاته؟")) del.mutate({ table: "posts", id: p.id });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
        </div>
      </section>

      <section className="glass rounded-xl p-6">
        <h2 className="font-display text-2xl text-gold">إشراف التعليقات</h2>
        {(comments ?? []).length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">لا توجد تعليقات بعد.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {(comments ?? []).map((c) => (
              <div key={c.id} className="flex items-start gap-3 rounded-lg border border-border bg-card/60 p-4">
                <MessageSquare className="mt-1 size-4 text-gold-soft" />
                <p className="flex-1 text-sm leading-7">{c.content}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => del.mutate({ table: "comments", id: c.id })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
