import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

export function useFileUpload() {
  const { user } = useAuth();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const updateFileProgress = useCallback((id: string, updates: Partial<UploadingFile>) => {
    setUploadingFiles(prev => 
      prev.map(f => f.id === id ? { ...f, ...updates } : f)
    );
  }, []);

  const getFileType = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    return 'other';
  };

  const uploadFile = useCallback(async (file: File): Promise<boolean> => {
    if (!user) return false;

    const fileId = crypto.randomUUID();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${fileId}.${fileExt}`;

    setUploadingFiles(prev => [...prev, {
      id: fileId,
      file,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      updateFileProgress(fileId, { progress: 80 });

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('materials')
        .insert({
          user_id: user.id,
          title: file.name.replace(/\.[^/.]+$/, ''),
          file_name: file.name,
          file_type: getFileType(file.type),
          file_size: file.size,
          file_path: filePath,
          mime_type: file.type
        });

      if (dbError) throw dbError;

      updateFileProgress(fileId, { progress: 100, status: 'completed' });
      return true;
    } catch (error: any) {
      updateFileProgress(fileId, { 
        status: 'error', 
        error: error.message || '上传失败' 
      });
      return false;
    }
  }, [user, updateFileProgress]);

  const uploadFiles = useCallback(async (files: File[]) => {
    const results = await Promise.all(files.map(uploadFile));
    return results.every(Boolean);
  }, [uploadFile]);

  const clearCompleted = useCallback(() => {
    setUploadingFiles(prev => prev.filter(f => f.status !== 'completed'));
  }, []);

  const clearAll = useCallback(() => {
    setUploadingFiles([]);
  }, []);

  return {
    uploadingFiles,
    uploadFile,
    uploadFiles,
    clearCompleted,
    clearAll
  };
}
