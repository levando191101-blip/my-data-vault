import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload as UploadIcon, FileText, Video, Image } from 'lucide-react';

export default function Upload() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">上传资料</h1>
        <p className="text-muted-foreground mt-1">上传你的学习资料到云端</p>
      </div>

      <Card className="border-2 border-dashed hover:border-primary/50 transition-colors">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 mb-4">
            <UploadIcon className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">拖拽文件到这里上传</h3>
          <p className="text-muted-foreground text-center mb-4">
            或者点击选择文件
          </p>
          <p className="text-sm text-muted-foreground">
            支持的格式：图片、视频、PDF、Word、PPT 等
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg p-2 bg-secondary/10">
                <FileText className="h-5 w-5 text-secondary" />
              </div>
              <CardTitle className="text-lg">文档</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>PDF, Word, PPT, Excel</CardDescription>
          </CardContent>
        </Card>

        <Card className="border-2">
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

        <Card className="border-2">
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
