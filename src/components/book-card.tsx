import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useCart } from "@/lib/cart";
import { PriceTag } from "@/components/price-tag";

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

export function BookCard({ book }: { book: Book }) {
  const { add, setOpen } = useCart();
  const [preview, setPreview] = useState(false);

  function addToCart() {
    add({ id: book.id, title: book.title, price: Number(book.price), cover_image_url: book.cover_image_url });
    toast.success("تمت إضافة الكتاب إلى السلة بنجاح");
    setOpen(true);
  }

  return (
    <>
      <article className="glass group flex flex-col overflow-hidden rounded-xl transition duration-300 hover:border-gold/50 hover:shadow-[var(--shadow-glow)]">
        <button
          onClick={() => setPreview(true)}
          className="relative flex aspect-4/5 w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_20%,oklch(0.3_0.05_60),oklch(0.19_0.03_55))]"
        >
          {book.cover_image_url ? (
            <img
              src={book.cover_image_url}
              alt={book.title}
              loading="lazy"
              className="size-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <span className="px-6 text-center font-display text-2xl leading-relaxed text-gold-soft">{book.title}</span>
          )}
          {book.badge && (
            <span className="absolute top-3 end-3 rounded-full border border-gold/50 bg-background/80 px-3 py-1 text-[11px] text-gold">
              {book.badge}
            </span>
          )}
        </button>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-display text-lg leading-snug">{book.title}</h3>
          <p className="text-xs text-muted-foreground">{book.author}</p>
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{book.description}</p>
          <div className="mt-auto flex items-center justify-between pt-3">
            <PriceTag amount={Number(book.price)} />
            <Button size="sm" onClick={addToCart}>
              أضف للسلة
            </Button>
          </div>
        </div>
      </article>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="glass border-gold/20">
          <DialogHeader className="text-right">
            <DialogTitle className="font-display text-2xl text-gold">{book.title}</DialogTitle>
            <DialogDescription>{book.author}</DialogDescription>
          </DialogHeader>
          <p className="text-sm leading-8 text-muted-foreground">{book.description}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{book.category}</span>
            <span className="text-muted-foreground">المتوفر: {book.stock} نسخة</span>
          </div>
          {book.copyright_notice && (
            <p className="rounded-md border border-gold/20 bg-card/60 p-3 text-[11px] leading-6 text-muted-foreground">
              {book.copyright_notice}
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={addToCart}>
              <BookOpen className="size-4" /> اقتنِ الكتاب — {Number(book.price).toFixed(2)} ر.س
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
