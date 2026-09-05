import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BooksPanel } from "@/components/admin/books-panel";
import { ContentPanel } from "@/components/admin/content-panel";
import { CommunityPanel } from "@/components/admin/community-panel";
import { UsersPanel } from "@/components/admin/users-panel";
import { AdsPanel } from "@/components/admin/ads-panel";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة الإشراف | مكتبة زينة" },
      { name: "description", content: "لوحة تحكم مكتبة زينة: إدارة الكتب والملفات والمحتوى والأعضاء." },
      { property: "og:title", content: "لوحة الإشراف | مكتبة زينة" },
      { property: "og:description", content: "إدارة شاملة لمتجر الكتب والمجلس الثقافي والأعضاء." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-14">
        <Skeleton className="h-40 rounded-xl bg-secondary/50" />
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl text-gold">هذه القاعة مخصّصة للمشرفين</h1>
        <p className="mt-4 text-sm text-muted-foreground">لا تملك صلاحية الدخول إلى لوحة الإشراف.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-14">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 font-display text-4xl text-gold">
          <ShieldCheck className="size-7" /> لوحة الإشراف
        </h1>
        <div className="gold-rule mx-auto mt-5 w-32" />
      </header>

      <Tabs defaultValue="books" dir="rtl">
        <TabsList className="mx-auto mb-8 flex w-full max-w-2xl">
          <TabsTrigger value="books" className="flex-1">
            الكتب والملفات
          </TabsTrigger>
          <TabsTrigger value="content" className="flex-1">
            المحتوى والصور
          </TabsTrigger>
          <TabsTrigger value="community" className="flex-1">
            الإشراف على المجلس
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1">
            الأعضاء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="books">
          <BooksPanel />
        </TabsContent>
        <TabsContent value="content">
          <ContentPanel />
        </TabsContent>
        <TabsContent value="community">
          <CommunityPanel />
        </TabsContent>
        <TabsContent value="users">
          <UsersPanel />
        </TabsContent>
      </Tabs>
    </main>
  );
}
