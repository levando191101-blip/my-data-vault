import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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

const fetchMaterialsData = async (userId: string): Promise<Material[]> => {
  // Fetch materials (exclude deleted ones)
  const { data: materialsData, error: materialsError } = await supabase
    .from("materials")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  // Fetch material tags
  const { data: materialTagsData } = await supabase
    .from("material_tags" as any)
    .select("material_id, tag_id");

  // Fetch all tags
  const { data: tagsData } = await supabase
    .from("tags" as any)
    .select("id, name, color");

  const tagsMap = new Map((tagsData as any[] || []).map((tag: any) => [tag.id, tag]));

  // Map tags to materials
  const materialsWithTags = (materialsData || []).map((material) => {
    const materialTags = (materialTagsData as any[] || [])
      .filter((mt: any) => mt.material_id === material.id)
      .map((mt: any) => tagsMap.get(mt.tag_id))
      .filter(Boolean);

    return {
      ...material,
      tags: materialTags,
    };
  });

  return materialsWithTags;
};

export function useMaterials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: materials = [], isLoading: loading, refetch } = useQuery({
    queryKey: ["materials", user?.id],
    queryFn: () => fetchMaterialsData(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
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

  const deleteMaterial = async (id: string, filePath: string) => {
    try {
      await deleteMutation.mutateAsync({ id, filePath });
      return true;
    } catch {
      return false;
    }
  };

  const updateMaterial = async (
    id: string,
    data: { title: string; categoryId: string | null; tagIds: string[] }
  ) => {
    try {
      await updateMutation.mutateAsync({ id, data });
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
    refetch,
  };
}
