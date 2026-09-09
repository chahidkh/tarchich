import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { useProfiles, AvatarInitial } from "@/hooks/use-profiles";

type Review = {
  id: string;
  book_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function Stars({ value, onSelect }: { value: number; onSelect?: (n: number) => void }) {
  return (
    <div className="flex flex-row-reverse items-center justify-end gap-1">
      {[5, 4, 3, 2, 1].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onSelect}
          aria-label={`${n} نجوم`}
          onClick={() => onSelect?.(n)}
          className={onSelect ? "transition hover:scale-110" : "cursor-default"}
        >
          <Star className={`size-4 ${n <= value ? "fill-gold text-gold" : "text-muted-foreground"}`} />
        </button>
      ))}
    </div>
  );
}

export function BookReviews({ bookId }: { bookId: string }) {
  const { user } = useSession();
  const qc = useQueryClient();
  const { byId } = useProfiles();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id,book_id,user_id,rating,comment,created_at")
        .eq("book_id", bookId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Review[];
    },
  });

  const mine = reviews?.find((r) => r.user_id === user?.id);

  useEffect(() => {
    if (mine) {
      setRating(mine.rating);
      setComment(mine.comment ?? "");
    }
  }, [mine?.id]);

  const count = reviews?.length ?? 0;
  const average = count ? (reviews!.reduce((s, r) => s + r.rating, 0) / count) : 0;

  async function submit() {
    if (!user) return;
    if (rating < 1) {
      toast.error("اختر تقييماً من 1 إلى 5 نجوم");
      return;
    }
    setSaving(true);
    const payload = { book_id: bookId, user_id: user.id, rating, comment: comment.trim() || null };
    const { error } = mine
      ? await supabase.from("reviews").update(payload).eq("id", mine.id)
      : await supabase.from("reviews").insert(payload);
    setSaving(false);
    if (error) {
      toast.error("تعذّر حفظ التقييم");
      return;
    }
    toast.success(mine ? "تم تحديث تقييمك" : "شكراً لتقييمك");
    void qc.invalidateQueries({ queryKey: ["reviews", bookId] });
  }

  return (
    <section className="mt-2 border-t border-gold/20 pt-4 text-right">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-lg text-gold">التقييمات والمراجعات</h4>
        {count > 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Stars value={Math.round(average)} />
            <span>
              {average.toFixed(1)} / 5 · {count} تقييم
            </span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">لا تقييمات بعد</span>
        )}
      </div>

      <div className="mt-3 max-h-48 overflow-y-auto pe-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">جارٍ تحميل التقييمات…</p>
        ) : (
          reviews?.map((r) => {
            const p = byId(r.user_id);
            return (
              <div key={r.id} className="border-b border-border/50 py-3 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full border border-gold/30 bg-card text-xs text-gold">
                    {AvatarInitial(p?.full_name)}
                  </span>
                  <span className="text-sm">{p?.full_name ?? "عضو"}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="mt-1 text-sm leading-7 text-muted-foreground">{r.comment}</p>}
              </div>
            );
          })
        )}
      </div>

      {user ? (
        <div className="mt-4 grid gap-2 rounded-lg border border-gold/20 bg-card/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{mine ? "عدّل تقييمك" : "أضف تقييمك"}</span>
            <Stars value={rating} onSelect={setRating} />
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="اكتب رأيك في الكتاب…"
            className="bg-background"
            rows={3}
          />
          <Button size="sm" disabled={saving} onClick={() => void submit()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {mine ? "تحديث التقييم" : "إرسال التقييم"}
          </Button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">سجّل الدخول لإضافة تقييمك للكتاب.</p>
      )}
    </section>
  );
}
