import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, Image, X, FolderOpen, Tags } from 'lucide-react';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { UploadProgress } from '@/components/upload/UploadProgress';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';
import { useToast } from '@/hooks/use-toast';

export default function Upload() {
  const { uploadingFiles, uploadFiles, clearCompleted } = useFileUpload();
  const { categories } = useCategories();
  const { tags } = useTags();
  const { toast } = useToast();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const handleFilesSelected = async (files: File[]) => {
    toast({
      title: "开始上传",
      description: `正在上传 ${files.length} 个文件...`,
    });
    
    const success = await uploadFiles(files, {
      categoryId: selectedCategoryId,
      tagIds: selectedTagIds
    });
    
    if (success) {
      toast({
        title: "上传成功",
        description: "所有文件已上传完成",
      });
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || '';
  };

  // Build flat list with indentation for nested categories
  const flatCategories = categories.filter(c => !c.parent_id).flatMap(parent => {
    const children = categories.filter(c => c.parent_id === parent.id);
    return [parent, ...children.map(child => ({ ...child, isChild: true }))];
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">上传资料</h1>
        <p className="text-muted-foreground mt-1">上传你的学习资料到云端</p>
      </div>

      {/* Category and Tags Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">分类与标签</CardTitle>
          <CardDescription>为上传的文件选择分类和标签（可选）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              分类
            </Label>
            <Select 
              value={selectedCategoryId || "none"} 
              onValueChange={(v) => setSelectedCategoryId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不选择分类</SelectItem>
                {flatCategories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.isChild ? `  └ ${category.name}` : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              标签
            </Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无标签，请先在设置中创建标签</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105"
                      style={{
                        backgroundColor: isSelected ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: isSelected ? 'white' : tag.color
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Summary */}
          {(selectedCategoryId || selectedTagIds.length > 0) && (
            <div className="pt-2 border-t text-sm text-muted-foreground">
              已选择：
              {selectedCategoryId && <span className="ml-1">分类「{getCategoryName(selectedCategoryId)}」</span>}
              {selectedTagIds.length > 0 && <span className="ml-1">、{selectedTagIds.length} 个标签</span>}
            </div>
          )}
        </CardContent>
      </Card>

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
