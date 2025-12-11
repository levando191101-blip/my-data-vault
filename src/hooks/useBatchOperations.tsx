import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Material } from './useMaterials';

export function useBatchOperations() {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  // Batch delete materials
  const batchDelete = async (materials: Material[]) => {
    setProcessing(true);
    try {
      const deletePromises = materials.map(async (material) => {
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('materials')
          .remove([material.file_path]);

        if (storageError) {
          console.error('Storage delete error:', storageError);
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('materials')
          .delete()
          .eq('id', material.id);

        if (dbError) {
          throw new Error(dbError.message);
        }
      });

      await Promise.all(deletePromises);

      toast({
        title: '删除成功',
        description: `已删除 ${materials.length} 个文件`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '批量删除失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Batch move to category
  const batchMove = async (materialIds: string[], categoryId: string | null) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('materials')
        .update({ category_id: categoryId })
        .in('id', materialIds);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: '移动成功',
        description: `已移动 ${materialIds.length} 个文件`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '批量移动失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Batch download materials
  const batchDownload = async (materials: Material[]) => {
    setProcessing(true);
    try {
      toast({
        title: '开始下载',
        description: `正在下载 ${materials.length} 个文件...`,
      });

      for (const material of materials) {
        // Get signed URL for private bucket
        const { data, error } = await supabase.storage
          .from('materials')
          .createSignedUrl(material.file_path, 3600); // 1 hour expiry

        if (error || !data?.signedUrl) {
          console.error('Failed to get signed URL:', error);
          continue;
        }

        // Create download link
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = material.file_name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay to avoid overwhelming the browser
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast({
        title: '下载完成',
        description: `已下载 ${materials.length} 个文件`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '批量下载失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  // Batch update tags
  const batchUpdateTags = async (
    materialIds: string[],
    tagIds: string[],
    mode: 'add' | 'remove' | 'replace'
  ) => {
    setProcessing(true);
    try {
      if (mode === 'replace') {
        // Delete all existing tags for selected materials
        await supabase
          .from('material_tags')
          .delete()
          .in('material_id', materialIds);

        // Insert new tags
        if (tagIds.length > 0) {
          const inserts = materialIds.flatMap((materialId) =>
            tagIds.map((tagId) => ({
              material_id: materialId,
              tag_id: tagId,
            }))
          );

          const { error } = await supabase
            .from('material_tags')
            .insert(inserts);

          if (error) {
            throw new Error(error.message);
          }
        }
      } else if (mode === 'add') {
        // Add new tags (avoid duplicates)
        const inserts = materialIds.flatMap((materialId) =>
          tagIds.map((tagId) => ({
            material_id: materialId,
            tag_id: tagId,
          }))
        );

        const { error } = await supabase
          .from('material_tags')
          .upsert(inserts, { onConflict: 'material_id,tag_id' });

        if (error) {
          throw new Error(error.message);
        }
      } else if (mode === 'remove') {
        // Remove specified tags
        for (const materialId of materialIds) {
          await supabase
            .from('material_tags')
            .delete()
            .eq('material_id', materialId)
            .in('tag_id', tagIds);
        }
      }

      toast({
        title: '标签更新成功',
        description: `已更新 ${materialIds.length} 个文件的标签`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '批量更新标签失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    batchDelete,
    batchMove,
    batchDownload,
    batchUpdateTags,
  };
}

