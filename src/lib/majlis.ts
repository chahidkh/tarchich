/** تصنيفات منشورات المجلس الثقافي (ثابتة ومشتركة بين المجلس ولوحة الإشراف). */
export const MAJLIS_CATEGORIES = ["نقاش كتاب", "رأي حر", "سؤال أدبي", "ترحيب"] as const;

export type MajlisCategory = (typeof MAJLIS_CATEGORIES)[number];

export const MAJLIS_SORTS = [
  { id: "new", label: "الأحدث" },
  { id: "liked", label: "الأكثر إعجاباً" },
  { id: "discussed", label: "الأكثر نقاشاً" },
] as const;

export type MajlisSort = (typeof MAJLIS_SORTS)[number]["id"];
