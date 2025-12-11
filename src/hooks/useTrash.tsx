import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Material } from './useMaterials';

const fetchTrashedMaterials = async (): Promise<Material[]> => {
  // Fetch materials with deleted_at not null
  const { data: materialsData, error: materialsError } = await supabase
    .from('materials')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  // Fetch material tags
  const materialIds = (materialsData || []).map((m: any) => m.id);
  let materialTagsData: any[] = [];
  let tagsData: any[] = [];

  if (materialIds.length > 0) {
    const { data: mtData } = await supabase
      .from('material_tags' as any)
      .select('material_id, tag_id')
      .in('material_id', materialIds);

    materialTagsData = mtData || [];

    // Fetch all tags
    if (materialTagsData.length > 0) {
      const tagIds = Array.from(new Set(materialTagsData.map((mt: any) => mt.tag_id)));
      const { data: tData } = await supabase
        .from('tags' as any)
        .select('id, name, color')
        .in('id', tagIds);

      tagsData = tData || [];
    }
  }

  const tagsMap = new Map(tagsData.map((tag: any) => [tag.id, tag]));

  // Map tags to materials
  const materialsWithTags = (materialsData || []).map((material) => {
    const materialTags = materialTagsData
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

export function useTrash() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: trashedMaterials = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ['trashed-materials', user?.id],
    queryFn: fetchTrashedMaterials,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const restoreMaterial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: '恢复成功',
        description: '文件已恢复',
      });

      // Invalidate both trash and materials queries
      queryClient.invalidateQueries({ queryKey: ['trashed-materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });

      return true;
    } catch (error: any) {
      toast({
        title: '恢复失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const permanentDelete = async (id: string, filePath: string) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('materials')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);

      if (dbError) {
        throw new Error(dbError.message);
      }

      toast({
        title: '永久删除成功',
        description: '文件已永久删除',
      });

      refetch();
      return true;
    } catch (error: any) {
      toast({
        title: '删除失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  const emptyTrash = async () => {
    try {
      const filePaths = trashedMaterials.map((m) => m.file_path);

      // Delete from storage
      if (filePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('materials')
          .remove(filePaths);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('materials')
        .delete()
        .not('deleted_at', 'is', null);

      if (dbError) {
        throw new Error(dbError.message);
      }

      toast({
        title: '回收站已清空',
        description: `已永久删除 ${trashedMaterials.length} 个文件`,
      });

      refetch();
      return true;
    } catch (error: any) {
      toast({
        title: '清空失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    trashedMaterials,
    loading,
    restoreMaterial,
    permanentDelete,
    emptyTrash,
    refetch,
  };
}

