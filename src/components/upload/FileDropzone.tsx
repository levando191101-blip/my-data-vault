import { useCallback, useState } from 'react';
import { Upload, FileText, Video, Image, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

export function FileDropzone({ onFilesSelected, disabled }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected, disabled]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      onFilesSelected(files);
    }
    e.target.value = '';
  }, [onFilesSelected]);

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer",
        isDragging 
          ? "border-primary bg-primary/5 scale-[1.02]" 
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept={Object.keys(ACCEPTED_TYPES).join(',')}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl mb-4 transition-colors",
          isDragging ? "bg-primary/20" : "bg-primary/10"
        )}>
          <Upload className={cn(
            "h-8 w-8 transition-colors",
            isDragging ? "text-primary" : "text-primary/80"
          )} />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">
          {isDragging ? "松开鼠标上传文件" : "拖拽文件到这里上传"}
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          或者点击选择文件
        </p>
        
        <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Image className="h-4 w-4" />
            <span>图片</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="h-4 w-4" />
            <span>视频</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </div>
          <div className="flex items-center gap-1.5">
            <File className="h-4 w-4" />
            <span>文档</span>
          </div>
        </div>
      </div>
    </div>
  );
}
