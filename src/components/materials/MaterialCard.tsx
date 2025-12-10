import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Image, Video, File, MoreVertical, Download, Trash2, ExternalLink, Pencil, Eye } from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaterialCardProps {
  material: Material;
  onDelete: (id: string, filePath: string) => void;
  onEdit?: (material: Material) => void;
  onPreview?: (material: Material) => void;
}

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case "pdf":
    case "document":
      return <FileText className="h-8 w-8" />;
    case "image":
      return <Image className="h-8 w-8" />;
    case "video":
      return <Video className="h-8 w-8" />;
    default:
      return <File className="h-8 w-8" />;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function MaterialCard({ material, onDelete, onEdit, onPreview }: MaterialCardProps) {
  const { toast } = useToast();

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    const { data, error } = await supabase.storage
      .from("materials")
      .createSignedUrl(material.file_path, 3600); // 1 hour expiry

    if (error || !data?.signedUrl) {
      toast({
        title: "获取下载链接失败",
        description: error?.message || "请稍后重试",
        variant: "destructive",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = material.file_name;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpen = async () => {
    const { data, error } = await supabase.storage
      .from("materials")
      .createSignedUrl(material.file_path, 3600);

    if (error || !data?.signedUrl) {
      toast({
        title: "获取链接失败",
        description: error?.message || "请稍后重试",
        variant: "destructive",
      });
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {getFileIcon(material.file_type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-medium truncate">{material.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {material.file_name}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onPreview && (material.file_type === "image" || material.file_type === "pdf" || material.mime_type === "application/pdf") && (
                    <DropdownMenuItem onClick={() => onPreview(material)}>
                      <Eye className="mr-2 h-4 w-4" />
                      预览
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={handleOpen}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    打开
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    下载
                  </DropdownMenuItem>
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(material)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => onDelete(material.id, material.file_path)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    删除
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatFileSize(material.file_size)}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {new Date(material.created_at).toLocaleDateString("zh-CN")}
              </span>
            </div>
            {material.tags && material.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {material.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}