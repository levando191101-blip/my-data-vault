import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Video, Image } from 'lucide-react';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/use-toast';

export default function Upload() {
  const { uploadingFiles, uploadFiles, clearCompleted } = useFileUpload();
  const { toast } = useToast();

  const handleFilesSelected = async (files: File[]) => {
    toast({
      title: "开始上传",
      description: `正在上传 ${files.length} 个文件...`,
    });
    
    const success = await uploadFiles(files);
    
    if (success) {
      toast({
        title: "上传成功",
        description: "所有文件已上传完成",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">上传资料</h1>
        <p className="text-muted-foreground mt-1">上传你的学习资料到云端</p>
      </div>

      <FileDropzone 
        onFilesSelected={handleFilesSelected}
        disabled={uploadingFiles.some(f => f.status === 'uploading')}
      />

      <UploadProgress 
        files={uploadingFiles} 
        onClearCompleted={clearCompleted}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">文档</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>PDF, Word, PPT, Excel</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-emerald-500/10">
                <Video className="h-5 w-5 text-emerald-500" />
              </div>
              <CardTitle className="text-lg">视频</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>MP4, MOV, AVI, WebM</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-accent/10">
                <Image className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-lg">图片</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>JPG, PNG, GIF, SVG</CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
