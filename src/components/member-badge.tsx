import { BadgeCheck } from "lucide-react";
import type { PublicProfile } from "@/hooks/use-profiles";

/** Avatar + display name shown next to forum posts and comments. */
export function MemberBadge({
  profile,
  fallback = "تحرير مكتبة ترشيش",
  size = "sm",
  verified = false,
}: {
  profile?: PublicProfile | undefined;
  fallback?: string;
  size?: "sm" | "md";
  verified?: boolean;
}) {
  const name = profile?.full_name?.trim() || fallback;
  const dim = size === "md" ? "size-9" : "size-7";

  return (
    <span className="flex items-center gap-2">
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={name}
          loading="lazy"
          className={`${dim} rounded-full border border-gold/40 object-cover`}
        />
      ) : (
        <span className={`${dim} grid place-items-center rounded-full border border-gold/40 bg-secondary/60 text-xs text-gold`}>
          {name.charAt(0)}
        </span>
      )}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {name}
        {verified && <BadgeCheck className="size-3.5 text-gold" />}
      </span>
    </span>
  );
}
