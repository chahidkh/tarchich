import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export function useIsAdmin() {
  const { user, loading } = useSession();

  const query = useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_role", { _user_id: user!.id, _role: "admin" });
      if (error) throw error;
      return Boolean(data);
    },
  });

  return {
    isAdmin: query.data ?? false,
    loading: loading || (!!user && query.isLoading),
    user,
  };
}
