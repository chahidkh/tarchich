import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicProfile = { id: string; full_name: string | null; avatar_url: string | null };

/** All member profiles, used to show avatars and display names in the forum. */
export function useProfiles() {
  const query = useQuery({
    queryKey: ["public-profiles"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,full_name,avatar_url");
      if (error) throw error;
      return data as PublicProfile[];
    },
  });

  return {
    ...query,
    byId: (id: string | null) => (id ? query.data?.find((p) => p.id === id) : undefined),
  };
}

export function AvatarInitial(name: string | null | undefined) {
  return (name ?? "ض").trim().charAt(0) || "ض";
}
