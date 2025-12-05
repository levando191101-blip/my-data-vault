import { CheckCircle, XCircle, Loader2, FileText, Video, Image, File } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { UploadingFile } from '@/hooks/useFileUpload';

interface UploadProgressProps {
  files: UploadingFile[];
  onClearCompleted: () => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.startsWith('video/')) return Video;
  if (mimeType === 'application/pdf') return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function UploadProgress({ files, onClearCompleted }: UploadProgressProps) {
  if (files.length === 0) return null;

  const completedCount = files.filter(f => f.status === 'completed').length;
  const hasCompleted = completedCount > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          上传进度 ({completedCount}/{files.length})
        </h3>
        {hasCompleted && (
          <Button variant="ghost" size="sm" onClick={onClearCompleted}>
            清除已完成
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {files.map((file) => {
          const Icon = getFileIcon(file.file.type);
          
          return (
            <div 
              key={file.id} 
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                file.status === 'completed' && "bg-emerald-500/10",
                file.status === 'error' && "bg-destructive/10",
                file.status === 'uploading' && "bg-primary/10",
                file.status === 'pending' && "bg-muted"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  file.status === 'completed' && "text-emerald-500",
                  file.status === 'error' && "text-destructive",
                  file.status === 'uploading' && "text-primary",
                  file.status === 'pending' && "text-muted-foreground"
                )} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate pr-2">
                    {file.file.name}
                  </p>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatFileSize(file.file.size)}
                  </span>
                </div>
                
                {file.status === 'uploading' && (
                  <Progress value={file.progress} className="h-1.5" />
                )}
                
                {file.status === 'error' && (
                  <p className="text-xs text-destructive">{file.error}</p>
                )}
              </div>
              
              <div className="shrink-0">
                {file.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {file.status === 'completed' && (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                )}
                {file.status === 'error' && (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
