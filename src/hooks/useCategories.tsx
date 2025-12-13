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

/**
 * 高性能 categories 查询
 * 使用 RPC 函数和索引优化
 */
const fetchCategoriesData = async (userId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .rpc('get_user_categories', { user_id_param: userId });

  if (error) {
    console.error('Failed to fetch categories:', error);
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
    queryFn: () => fetchCategoriesData(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData, // 显示旧数据避免闪烁
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
