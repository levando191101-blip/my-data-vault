import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useOptimisticMaterials } from "./useOptimisticMaterials";

export interface Material {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  tags?: { id: string; name: string; color: string }[];
}

/**
 * 高性能数据获取函数
 * 
 * 使用 Supabase RPC 函数一次性获取所有数据，避免 N+1 查询问题
 * 
 * 性能提升：
 * - 原方案：3次查询 + O(N*M) 前端计算
 * - 新方案：1次 RPC 调用，数据库端聚合
 * - 预期提速：2-4秒 → < 500ms
 */
const fetchMaterialsData = async (userId: string): Promise<Material[]> => {
  // 调用 Supabase RPC 函数，一次性获取 materials 及其 tags
  // 使用类型断言绕过自动生成类型的限制（函数已在数据库中创建）
  const { data, error } = await (supabase.rpc as any)('get_materials_with_tags', { user_id_param: userId });

  if (error) {
    console.error('Failed to fetch materials:', error);
    throw new Error(error.message);
  }

  // 数据已在数据库层完成聚合，直接返回
  return (data || []).map((material: any) => ({
    ...material,
    tags: material.tags || [],
  }));
};

export function useMaterials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 乐观更新 Hook
  const { optimisticDelete, optimisticMove, optimisticUpdate } = useOptimisticMaterials();

  const { data: materials = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["materials", user?.id],
    queryFn: () => fetchMaterialsData(user!.id),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes - 保持数据较新
    gcTime: 10 * 60 * 1000, // 10 minutes - 减少内存占用
    refetchOnWindowFocus: false, // 避免窗口切换时重新获取
    refetchOnMount: false, // 利用缓存，仅在数据过期时重新获取
    placeholderData: (previousData) => previousData, // 显示旧数据避免闪烁
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Soft delete: set deleted_at timestamp
      const { error: dbError } = await supabase
        .from("materials")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (dbError) {
        throw new Error(dbError.message);
      }
    },
    onSuccess: () => {
      toast({ 
        title: "已移至回收站",
        description: "文件可在回收站中恢复"
      });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
      queryClient.invalidateQueries({ queryKey: ["trashed-materials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { title: string; categoryId: string | null; tagIds: string[] };
    }) => {
      // Update material info
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

      // Delete existing tags
      await supabase.from("material_tags").delete().eq("material_id", id);

      // Insert new tags
      if (data.tagIds.length > 0) {
        const tagInserts = data.tagIds.map((tagId) => ({
          material_id: id,
          tag_id: tagId,
        }));

        const { error: tagsError } = await supabase
          .from("material_tags")
          .insert(tagInserts);

        if (tagsError) {
          console.error("Failed to update tags:", tagsError);
        }
      }
    },
    onSuccess: () => {
      toast({ title: "资料已更新" });
      queryClient.invalidateQueries({ queryKey: ["materials"] });
    },
    onError: (error: Error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * 乐观删除：立即从 UI 移除，后台发送请求
   */
  const deleteMaterial = async (id: string, filePath: string) => {
    try {
      await optimisticDelete.mutateAsync({ id, filePath });
      return true;
    } catch {
      return false;
    }
  };

  /**
   * 乐观更新：立即更新 UI，后台发送请求
   */
  const updateMaterial = async (
    id: string,
    data: { title: string; categoryId: string | null; tagIds: string[] }
  ) => {
    try {
      await optimisticUpdate.mutateAsync({ id, data });
      return true;
    } catch {
      return false;
    }
  };

  /**
   * 乐观移动：立即更新文件所属分类
   */
  const moveMaterial = async (materialId: string, categoryId: string | null) => {
    try {
      await optimisticMove.mutateAsync({ materialId, categoryId });
      return true;
    } catch {
      return false;
    }
  };

  return {
    materials,
    loading,
    deleteMaterial,
    updateMaterial,
    moveMaterial,
    refetch,
  };
}
