import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

const fetchCategoriesData = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from("categories" as any)
    .select("*")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as Category[]) || [];
};

export function useCategories() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["categories", user?.id],
    queryFn: fetchCategoriesData,
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string | null }) => {
      const { data, error } = await supabase
        .from("categories" as any)
        .insert({
          name,
          user_id: user!.id,
          parent_id: parentId || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data as unknown as Category;
    },
    onSuccess: () => {
      toast({ title: "分类创建成功" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "创建分类失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from("categories" as any)
        .update({ name })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({ title: "分类更新成功" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "更新分类失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("categories" as any)
        .delete()
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast({ title: "分类已删除" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast({
        title: "删除分类失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCategory = async (name: string, parentId?: string | null) => {
    if (!user) return null;
    try {
      return await createMutation.mutateAsync({ name, parentId });
    } catch {
      return null;
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      await updateMutation.mutateAsync({ id, name });
      return true;
    } catch {
      return false;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch,
  };
}
