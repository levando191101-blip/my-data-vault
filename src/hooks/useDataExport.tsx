import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Material } from './useMaterials';
import { supabase } from '@/integrations/supabase/client';

export function useDataExport() {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  // Export materials metadata as CSV
  const exportAsCSV = async (materials: Material[]) => {
    setExporting(true);
    try {
      const headers = ['标题', '文件名', '类型', '大小(MB)', '分类ID', '标签', '创建时间'];
      const rows = materials.map(m => [
        m.title,
        m.file_name,
        m.file_type,
        (m.file_size / (1024 * 1024)).toFixed(2),
        m.category_id || '',
        m.tags?.map(t => t.name).join(', ') || '',
        new Date(m.created_at).toLocaleString('zh-CN'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `materials_export_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '导出成功',
        description: `已导出 ${materials.length} 条记录为 CSV 文件`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '导出失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setExporting(false);
    }
  };

  // Export materials metadata as JSON
  const exportAsJSON = async (materials: Material[]) => {
    setExporting(true);
    try {
      const data = materials.map(m => ({
        title: m.title,
        file_name: m.file_name,
        file_type: m.file_type,
        file_size: m.file_size,
        category_id: m.category_id,
        tags: m.tags,
        created_at: m.created_at,
        updated_at: m.updated_at,
      }));

      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `materials_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: '导出成功',
        description: `已导出 ${materials.length} 条记录为 JSON 文件`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '导出失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setExporting(false);
    }
  };

  // Export and download all files as ZIP (using browser downloads)
  // Note: Full ZIP creation would require a library like JSZip, but for now we'll do sequential downloads
  const exportAllFiles = async (materials: Material[]) => {
    setExporting(true);
    try {
      toast({
        title: '开始导出',
        description: `正在下载 ${materials.length} 个文件...`,
      });

      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        
        // Get signed URL
        const { data, error } = await supabase.storage
          .from('materials')
          .createSignedUrl(material.file_path, 3600);

        if (error || !data?.signedUrl) {
          console.error('Failed to get signed URL for:', material.file_name);
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
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      toast({
        title: '导出完成',
        description: `已下载 ${materials.length} 个文件`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: '导出失败',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setExporting(false);
    }
  };

  return {
    exporting,
    exportAsCSV,
    exportAsJSON,
    exportAllFiles,
  };
}

