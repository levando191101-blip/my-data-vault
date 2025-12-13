import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Material } from "@/hooks/useMaterials";

/**
 * 乐观更新 Hook - 让操作立即生效，提升流畅度
 * 
 * 实现原理：
 * 1. 立即更新 UI（修改 React Query 缓存）
 * 2. 发送请求到服务器
 * 3. 如果失败，自动回滚
 * 
 * 用户体验：操作立即反馈，无需等待服务器响应
 */
export function useOptimisticMaterials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * 乐观删除（移至回收站）
   * UI 立即移除文件，然后发送请求
   */
  const optimisticDelete = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // 实际的删除操作（软删除）
      const { error } = await supabase
        .from("materials")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        throw new Error(error.message);
      }

      return { id, filePath };
    },
    // 乐观更新：立即从 UI 中移除
    onMutate: async ({ id }) => {
      // 取消正在进行的查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ["materials", user?.id] });

      // 获取当前数据作为快照（用于回滚）
      const previousMaterials = queryClient.getQueryData<Material[]>(["materials", user?.id]);

      // 乐观更新：立即移除该文件
      queryClient.setQueryData<Material[]>(["materials", user?.id], (old) => {
        if (!old) return [];
        return old.filter((m) => m.id !== id);
      });

      // 返回快照用于可能的回滚
      return { previousMaterials };
    },
    onSuccess: () => {
      toast({ 
        title: "已移至回收站",
        description: "文件可在回收站中恢复"
      });
      // 刷新回收站数据
      queryClient.invalidateQueries({ queryKey: ["trashed-materials"] });
    },
    onError: (error: Error, _variables, context) => {
      // 回滚：恢复之前的数据
      if (context?.previousMaterials) {
        queryClient.setQueryData(["materials", user?.id], context.previousMaterials);
      }
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    },
    // 无论成功还是失败，都重新获取数据确保一致性
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", user?.id] });
    },
  });

  /**
   * 乐观移动
   * UI 立即更新文件所属分类，然后发送请求
   */
  const optimisticMove = useMutation({
    mutationFn: async ({ 
      materialId, 
      categoryId 
    }: { 
      materialId: string; 
      categoryId: string | null;
    }) => {
      const { error } = await supabase
        .from("materials")
        .update({ category_id: categoryId })
        .eq("id", materialId);

      if (error) {
        throw new Error(error.message);
      }

      return { materialId, categoryId };
    },
    onMutate: async ({ materialId, categoryId }) => {
      await queryClient.cancelQueries({ queryKey: ["materials", user?.id] });

      const previousMaterials = queryClient.getQueryData<Material[]>(["materials", user?.id]);

      // 乐观更新：立即更改文件的 category_id
      queryClient.setQueryData<Material[]>(["materials", user?.id], (old) => {
        if (!old) return [];
        return old.map((m) => 
          m.id === materialId ? { ...m, category_id: categoryId } : m
        );
      });

      return { previousMaterials };
    },
    onSuccess: () => {
      toast({ title: "文件已移动" });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousMaterials) {
        queryClient.setQueryData(["materials", user?.id], context.previousMaterials);
      }
      toast({
        title: "移动失败",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", user?.id] });
    },
  });

  /**
   * 乐观更新（编辑）
   * UI 立即显示新的标题和标签，然后发送请求
   */
  const optimisticUpdate = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title: string; categoryId: string | null; tagIds: string[] };
    }) => {
      // 更新 material 基础信息
      const { error: updateError } = await supabase
        .from("materials")
        .update({
          title: data.title,
          category_id: data.categoryId,
        })
        .eq("id", id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // 更新标签
      await supabase.from("material_tags").delete().eq("material_id", id);

      if (data.tagIds.length > 0) {
        const tagInserts = data.tagIds.map((tagId) => ({
          material_id: id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from("material_tags")
          .insert(tagInserts);

        if (tagsError) {
          throw new Error(tagsError.message);
        }
      }

      return { id, data };
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["materials", user?.id] });

      const previousMaterials = queryClient.getQueryData<Material[]>(["materials", user?.id]);

      // 获取完整的 tag 对象（从 tags 缓存中）
      const tagsCache = queryClient.getQueryData<any[]>(["tags", user?.id]) || [];
      const updatedTags = data.tagIds
        .map(tagId => tagsCache.find(t => t.id === tagId))
        .filter(Boolean);

      // 乐观更新：立即更新文件信息
      queryClient.setQueryData<Material[]>(["materials", user?.id], (old) => {
        if (!old) return [];
        return old.map((m) =>
          m.id === id
            ? {
                ...m,
                title: data.title,
                category_id: data.categoryId,
                tags: updatedTags,
              }
            : m
        );
      });

      return { previousMaterials };
    },
    onSuccess: () => {
      toast({ title: "资料已更新" });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousMaterials) {
        queryClient.setQueryData(["materials", user?.id], context.previousMaterials);
      }
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["materials", user?.id] });
    },
  });

  return {
    optimisticDelete,
    optimisticMove,
    optimisticUpdate,
  };
}

