import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileText, Image, Video, File, MoreVertical, Download, Trash2, ExternalLink, Pencil, Eye, Clock } from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
      return <FileText className="h-6 w-6" />;
    case "image":
      return <Image className="h-6 w-6" />;
    case "video":
      return <Video className="h-6 w-6" />;
    default:
      return <File className="h-6 w-6" />;
  }
};

const getFileTypeColor = (fileType: string) => {
  switch (fileType) {
    case "pdf":
    case "document":
      return {
        bg: "bg-gradient-to-br from-cyan-500/20 to-blue-600/20",
        text: "text-cyan-600 dark:text-cyan-400",
        badge: "bg-cyan-500/90"
      };
    case "image":
      return {
        bg: "bg-gradient-to-br from-emerald-500/20 to-teal-600/20",
        text: "text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-500/90"
      };
    case "video":
      return {
        bg: "bg-gradient-to-br from-violet-500/20 to-purple-600/20",
        text: "text-violet-600 dark:text-violet-400",
        badge: "bg-violet-500/90"
      };
    default:
      return {
        bg: "bg-gradient-to-br from-amber-500/20 to-orange-600/20",
        text: "text-amber-600 dark:text-amber-400",
        badge: "bg-amber-500/90"
      };
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
  const colors = getFileTypeColor(material.file_type);

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

  const canPreview = onPreview && (
    material.file_type === "image" ||
    material.file_type === "pdf" ||
    material.mime_type === "application/pdf"
  );

  // Context menu content
  const contextMenuContent = (
    <ContextMenuContent className="bg-popover w-52">
      {canPreview && (
        <>
          <ContextMenuItem onClick={() => onPreview(material)}>
            <Eye className="mr-2 h-4 w-4" />
            预览
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      <ContextMenuItem onClick={handleOpen}>
        <ExternalLink className="mr-2 h-4 w-4" />
        打开
      </ContextMenuItem>
      <ContextMenuItem onClick={handleDownload}>
        <Download className="mr-2 h-4 w-4" />
        下载
      </ContextMenuItem>
      <ContextMenuSeparator />
      {onEdit && (
        <ContextMenuItem onClick={() => onEdit(material)}>
          <Pencil className="mr-2 h-4 w-4" />
          编辑
        </ContextMenuItem>
      )}
      <ContextMenuItem
        className="text-destructive"
        onClick={() => onDelete(material.id, material.file_path)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        删除
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card className="group relative rounded-2xl bg-card border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      {/* Hover Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="p-5 relative">
        <div className="flex items-start gap-4">
          {/* File Icon - Gradient Background + Glow */}
          <div className="relative">
            <div className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300",
              colors.bg
            )}>
              <div className={colors.text}>
                {getFileIcon(material.file_type)}
              </div>
            </div>
            {/* File Type Badge */}
            <div className={cn(
              "absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-card flex items-center justify-center",
              colors.badge
            )}>
              <span className="text-[10px] font-bold text-white">
                {material.file_type.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {material.title}
                </h3>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {material.file_name}
                </p>
              </div>
              
              {/* Action Button - Gradient Background */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
            
            {/* Meta Information - Modern Style */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs font-medium text-muted-foreground">
                <FileText className="h-3 w-3" />
                {formatFileSize(material.file_size)}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(material.created_at).toLocaleDateString("zh-CN")}
              </span>
            </div>
            
            {/* Tags - Gradient Background */}
            {material.tags && material.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {material.tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium shadow-sm hover:shadow-md transition-shadow border"
                    style={{ 
                      backgroundColor: tag.color + "15", 
                      color: tag.color,
                      borderColor: tag.color + "30"
                    }}
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
      </ContextMenuTrigger>
      {contextMenuContent}
    </ContextMenu>
  );
}
