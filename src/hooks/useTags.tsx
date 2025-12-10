import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

const fetchTagsData = async (): Promise<Tag[]> => {
  const { data, error } = await supabase
    .from("tags" as any)
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as Tag[]) || [];
};

export function useTags() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tags = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["tags", user?.id],
    queryFn: fetchTagsData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      const { data, error } = await supabase
        .from("tags" as any)
        .insert({
          name,
          color,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Tag;
    },
    onSuccess: () => {
      toast({ title: "标签创建成功" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: Error) => {
      toast({
        title: "创建标签失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, color }: { id: string; name: string; color: string }) => {
      const { error } = await supabase
        .from("tags" as any)
        .update({ name, color })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({ title: "标签更新成功" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: Error) => {
      toast({
        title: "更新标签失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tags" as any)
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({ title: "标签已删除" });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error: Error) => {
      toast({
        title: "删除标签失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTag = async (name: string, color: string = "#3b82f6") => {
    if (!user) return null;
    try {
      return await createMutation.mutateAsync({ name, color });
    } catch {
      return null;
    }
  };

  const updateTag = async (id: string, name: string, color: string) => {
    try {
      await updateMutation.mutateAsync({ id, name, color });
      return true;
    } catch {
      return false;
    }
  };

  const deleteTag = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    refetch,
  };
}
