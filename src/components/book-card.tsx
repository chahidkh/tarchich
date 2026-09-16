import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { BookOpen, CreditCard, ExternalLink, FileText, Loader2, MessagesSquare, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { PriceTag } from "@/components/price-tag";
import { createBookCheckout } from "@/lib/checkout.functions";
import { useSession } from "@/hooks/use-session";
import { BookCover } from "@/components/book-cover";
import { BookReviews } from "@/components/book-reviews";
import { cn } from "@/lib/utils";

export type Book = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  price: number;
  cover_image_url: string | null;
  category: string | null;
  badge: string | null;
  stock: number;
  external_url?: string | null;
  copyright_notice?: string | null;
  sample_pdf_url?: string | null;
};

export function BookCard({ book, compact = false }: { book: Book; compact?: boolean }) {
  const { add, setOpen } = useCart();
  const { user } = useSession();
  const [preview, setPreview] = useState(false);
  const [paying, setPaying] = useState(false);
  const checkout = useServerFn(createBookCheckout);

  function addToCart() {
    add({ id: book.id, title: book.title, price: Number(book.price), cover_image_url: book.cover_image_url });
    toast.success("تمت إضافة الكتاب إلى السلة بنجاح");
    setOpen(true);
  }

  async function buyNow() {
    setPaying(true);
    try {
      const { url } = await checkout({
        data: {
          bookId: book.id,
          origin: window.location.origin,
          userId: user?.id ?? null,
          referrer: localStorage.getItem("zaina-ref"),
        },
      });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message || "تعذّر فتح صفحة الدفع");
      setPaying(false);
    }
  }

  return (
    <>
      <article
        className={cn(
          "glass group flex flex-col overflow-hidden rounded-xl transition duration-300 ease-out hover:-rotate-1 hover:scale-[1.03] hover:border-gold/50 hover:shadow-[var(--shadow-glow),var(--shadow-deep)]",
          compact && "w-28 shrink-0 snap-start rounded-md sm:w-32",
        )}
      >
        <button
          onClick={() => setPreview(true)}
          className="relative flex aspect-3/4 w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,oklch(0.3_0.05_60),oklch(0.19_0.03_55))]"
        >
          <BookCover src={book.cover_image_url} title={book.title} />
          {book.badge && (
            <span className={cn("absolute end-1.5 top-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-full border border-gold/50 bg-background/80 px-1.5 py-0.5 text-[8px] text-gold sm:end-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]", compact && "sm:end-1.5 sm:top-1.5 sm:px-1.5 sm:py-0.5 sm:text-[8px]")}>
              {book.badge}
            </span>
          )}
        </button>

        <div className={cn("flex flex-1 flex-col gap-1 p-2 sm:gap-1.5 sm:p-3", compact && "gap-1 p-2")}>
          <h3 className={cn("line-clamp-2 min-h-9 font-display text-[13px] leading-[1.45] sm:min-h-0 sm:text-base sm:leading-snug", compact && "min-h-9 text-xs leading-[1.45] sm:min-h-9 sm:text-xs sm:leading-[1.45]")}>{book.title}</h3>
          <p className={cn("truncate text-[10px] text-muted-foreground sm:text-[11px]", compact && "text-[9px] sm:text-[9px]")}>{book.author}</p>
          {!compact && <p className="hidden line-clamp-2 text-xs leading-5 text-muted-foreground sm:block">{book.description}</p>}
          <div className={cn("mt-auto flex items-center justify-between pt-2", compact && "gap-1 pt-1")}>
            <PriceTag amount={Number(book.price)} className={compact ? "text-[11px]" : "text-[11px] sm:text-sm"} />
            <Button size="sm" onClick={addToCart} className={compact ? "size-7 p-0" : "size-8 p-0 sm:h-8 sm:w-auto sm:px-3"} aria-label={`أضف ${book.title} إلى السلة`}>
              <ShoppingBag className={compact ? "size-3" : "size-3.5 sm:hidden"} />
              {!compact && <span className="hidden sm:inline">أضف للسلة</span>}
            </Button>
          </div>
        </div>
      </article>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="glass max-h-[calc(100dvh-5.5rem)] w-[calc(100%-1.5rem)] overflow-y-auto border-gold/20 p-4 sm:max-h-[90vh] sm:w-full sm:p-6">
          <DialogHeader className="text-right">
            <DialogTitle className="font-display text-xl leading-relaxed text-gold sm:text-2xl">{book.title}</DialogTitle>
            <DialogDescription>{book.author}</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-8 text-muted-foreground">{book.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs sm:flex sm:items-center sm:justify-between sm:text-sm">
            <span className="text-muted-foreground">{book.category}</span>
            <span className="text-muted-foreground">المتوفر: {book.stock} نسخة</span>
          </div>
          {book.copyright_notice && (
            <p className="rounded-md border border-gold/20 bg-card/60 p-3 text-[11px] leading-6 text-muted-foreground">
              {book.copyright_notice}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <Button className="flex-1" onClick={addToCart}>
                <BookOpen className="size-4" /> اقتنِ الكتاب
              </Button>
              <PriceTag amount={Number(book.price)} />
            </div>
            <Button variant="outline" disabled={paying || Number(book.price) <= 0} onClick={() => void buyNow()}>
              {paying ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
              {paying ? "جارٍ فتح صفحة الدفع…" : "شراء الكتاب الآن"}
            </Button>
            {book.sample_pdf_url && (
              <Button asChild variant="outline">
                <a href={book.sample_pdf_url} target="_blank" rel="noreferrer">
                  <FileText className="size-4" /> اقرأ نموذجاً من الكتاب
                </a>
              </Button>
            )}
            {book.external_url && (
              <Button asChild variant="outline">
                <a href={book.external_url} target="_blank" rel="noreferrer noopener sponsored">
                  <ExternalLink className="size-4" /> الشراء من المتجر الخارجي
                </a>
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/majlis" search={{ book: book.id, bookTitle: book.title }}>
                <MessagesSquare className="size-4" /> ناقش هذا الكتاب في المجلس
              </Link>
            </Button>
          </div>
          {preview && <BookReviews bookId={book.id} />}

        </DialogContent>
      </Dialog>
    </>
  );
}
