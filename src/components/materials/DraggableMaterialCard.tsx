import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from "@/components/ui/context-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText,
  Image,
  Video,
  File,
  MoreVertical,
  Download,
  Trash2,
  ExternalLink,
  Eye,
  GripVertical,
  Check,
  X,
  Pencil,
  Folder,
  FolderOpen,
  FolderSymlink,
  Copy,
} from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface DraggableMaterialCardProps {
  material: Material;
  categories: Category[];
  onDelete: (id: string, filePath: string) => void;
  onSave: (id: string, data: { title: string; categoryId: string | null; tagIds: string[] }) => Promise<boolean>;
  onPreview?: (material: Material) => void;
  onMoveTo?: (materialId: string, categoryId: string | null) => void;
  onCopyTo?: (materialId: string, categoryId: string | null) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectionMode?: boolean;
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

// Build tree and flatten categories for select
const buildCategoryTree = (categories: Category[]): { id: string; name: string; level: number }[] => {
  const result: { id: string; name: string; level: number }[] = [];
  const categoryMap = new Map(categories.map(c => [c.id, c]));
  
  const addWithChildren = (cat: Category, level: number) => {
    result.push({ id: cat.id, name: cat.name, level });
    const children = categories.filter(c => c.parent_id === cat.id);
    children.forEach(child => addWithChildren(child, level + 1));
  };
  
  // Start with root categories (no parent)
  categories
    .filter(c => !c.parent_id)
    .forEach(cat => addWithChildren(cat, 0));
    
  return result;
};

export function DraggableMaterialCard({
  material,
  categories,
  onDelete,
  onSave,
  onPreview,
  onMoveTo,
  onCopyTo,
  isSelected = false,
  isPendingSelection = false,
  onSelect,
  selectionMode = false,
}: DraggableMaterialCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(material.title);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(material.category_id);
  const [saving, setSaving] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: material.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDownload = () => {
    const { data } = supabase.storage
      .from("materials")
      .getPublicUrl(material.file_path);

    if (data?.publicUrl) {
      // Create a temporary link for download
      const link = document.createElement("a");
      link.href = data.publicUrl;
      link.download = material.file_name;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      // Clean up after a short delay
      setTimeout(() => document.body.removeChild(link), 100);
    }
  };

  const handleOpen = () => {
    const { data } = supabase.storage
      .from("materials")
      .getPublicUrl(material.file_path);

    if (data?.publicUrl) {
      const url = data.publicUrl;
      // Use requestAnimationFrame to completely escape React's event system
      requestAnimationFrame(() => {
        const newWindow = window.open(url, "_blank", "noopener,noreferrer");
        // If popup was blocked, the return value will be null
        if (!newWindow) {
          // Fallback: navigate using location
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.click();
        }
      });
    }
  };

  const handleStartEdit = () => {
    setEditTitle(material.title);
    setEditCategoryId(material.category_id);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(material.title);
    setEditCategoryId(material.category_id);
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSaving(true);
    const success = await onSave(material.id, {
      title: editTitle.trim(),
      categoryId: editCategoryId,
      tagIds: material.tags?.map(t => t.id) || [],
    });
    setSaving(false);
    if (success) {
      setIsEditing(false);
    }
  };

  const flatCats = buildCategoryTree(categories);
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
          <ContextMenuItem onSelect={(e) => { e.preventDefault(); onPreview(material); }}>
            <Eye className="mr-2 h-4 w-4" />
            预览
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      <ContextMenuItem onSelect={(e) => { e.preventDefault(); handleOpen(); }}>
        <ExternalLink className="mr-2 h-4 w-4" />
        打开
      </ContextMenuItem>
      <ContextMenuItem onSelect={(e) => { e.preventDefault(); handleDownload(); }}>
        <Download className="mr-2 h-4 w-4" />
        下载
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={(e) => { e.preventDefault(); handleStartEdit(); }}>
        <Pencil className="mr-2 h-4 w-4" />
        编辑
      </ContextMenuItem>
      {onMoveTo && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <FolderSymlink className="mr-2 h-4 w-4" />
            移动到...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-popover w-48 max-h-64 overflow-y-auto">
            <ContextMenuItem 
              onSelect={(e) => { e.preventDefault(); onMoveTo(material.id, null); }}
              disabled={material.category_id === null}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              根目录
            </ContextMenuItem>
            <ContextMenuSeparator />
            {flatCats.map(cat => (
              <ContextMenuItem 
                key={cat.id}
                onSelect={(e) => { e.preventDefault(); onMoveTo(material.id, cat.id); }}
                disabled={material.category_id === cat.id}
              >
                <Folder className="mr-2 h-4 w-4" />
                <span className="truncate">{"　".repeat(cat.level)}{cat.name}</span>
              </ContextMenuItem>
            ))}
            {flatCats.length === 0 && (
              <ContextMenuItem disabled>
                <span className="text-muted-foreground text-xs">没有可用的目标文件夹</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}
      {onCopyTo && (
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Copy className="mr-2 h-4 w-4" />
            复制到...
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-popover w-48 max-h-64 overflow-y-auto">
            <ContextMenuItem onSelect={(e) => { e.preventDefault(); onCopyTo(material.id, null); }}>
              <FolderOpen className="mr-2 h-4 w-4" />
              根目录
            </ContextMenuItem>
            <ContextMenuSeparator />
            {flatCats.map(cat => (
              <ContextMenuItem 
                key={cat.id}
                onSelect={(e) => { e.preventDefault(); onCopyTo(material.id, cat.id); }}
              >
                <Folder className="mr-2 h-4 w-4" />
                <span className="truncate">{"　".repeat(cat.level)}{cat.name}</span>
              </ContextMenuItem>
            ))}
            {flatCats.length === 0 && (
              <ContextMenuItem disabled>
                <span className="text-muted-foreground text-xs">没有可用的目标文件夹</span>
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem 
        onSelect={(e) => { e.preventDefault(); onDelete(material.id, material.file_path); }}
        className="text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        删除
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <div ref={setNodeRef} style={style}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card 
            className={cn(
              "group hover:shadow-md transition-shadow",
              isDragging && "shadow-lg ring-2 ring-primary",
              isSelected && "ring-2 ring-primary bg-primary/5",
              isPendingSelection && !isSelected && "ring-2 ring-primary/50 bg-primary/10"
            )}
            data-selectable-item
            data-item-id={`material-${material.id}`}
            onClick={() => {
              if (selectionMode && onSelect) {
                onSelect(material.id, !isSelected);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Selection checkbox or Drag handle */}
                {selectionMode ? (
                  <div className="mt-2 flex items-center gap-1">
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={(checked) => onSelect?.(material.id, !!checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {isSelected && (
                      <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
                        title="拖拽移动选中项"
                      >
                        <GripVertical className="h-5 w-5 text-primary" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    {...attributes}
                    {...listeners}
                    className="mt-2 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
                    title="拖拽排序"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                  </button>
                )}

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  {getFileIcon(material.file_type)}
                </div>

                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="资料标题"
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                      />
                      <Select
                        value={editCategoryId || "none"}
                        onValueChange={(v) => setEditCategoryId(v === "none" ? null : v)}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="选择分类" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">无分类</SelectItem>
                          {flatCats.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {"　".repeat(cat.level)}{cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          disabled={saving}
                        >
                          <X className="h-4 w-4 mr-1" />
                          取消
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={saving || !editTitle.trim()}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          保存
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3
                            className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                            onClick={handleStartEdit}
                            title="点击编辑"
                          >
                            {material.title}
                          </h3>
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
                            {canPreview && (
                              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onPreview(material); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                预览
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleOpen(); }}>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              打开
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleDownload(); }}>
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleStartEdit(); }}>
                              <Pencil className="mr-2 h-4 w-4" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => { e.preventDefault(); onDelete(material.id, material.file_path); }}
                              className="text-destructive"
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
                              style={{
                                backgroundColor: tag.color + "20",
                                color: tag.color,
                              }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    </div>
  );
}
