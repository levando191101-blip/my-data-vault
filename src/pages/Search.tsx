import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, X, ArrowUpDown, LayoutGrid, List } from 'lucide-react';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useTags } from '@/hooks/useTags';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { MaterialEditDialog } from '@/components/materials/MaterialEditDialog';
import { MaterialPreviewDialog } from '@/components/materials/MaterialPreviewDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<{ id: string; filePath: string } | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const { materials, loading, deleteMaterial, updateMaterial } = useMaterials();
  const { tags } = useTags();

  // Sorting and view mode state with localStorage persistence
  const [sortField, setSortField] = useState<"name" | "size" | "date" | "type">(() => {
    const saved = localStorage.getItem("search-sort-field");
    return (saved as "name" | "size" | "date" | "type") || "date";
  });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(() => {
    const saved = localStorage.getItem("search-sort-order");
    return (saved as "asc" | "desc") || "desc";
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("search-view-mode");
    return (saved as "grid" | "list") || "grid";
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem("search-sort-field", sortField);
    localStorage.setItem("search-sort-order", sortOrder);
    localStorage.setItem("search-view-mode", viewMode);
  }, [sortField, sortOrder, viewMode]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const hasFilters = searchQuery.trim() !== '' || selectedTags.length > 0;

  const searchResults = useMemo(() => {
    if (!hasFilters) return [];
    
    let filtered = materials.filter(material => {
      // Text search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = 
          material.title.toLowerCase().includes(query) ||
          material.file_name.toLowerCase().includes(query) ||
          material.tags?.some(tag => tag.name.toLowerCase().includes(query));
        if (!matchesText) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const materialTagIds = material.tags?.map((t) => t.id) || [];
        if (!selectedTags.every((tagId) => materialTagIds.includes(tagId))) {
          return false;
        }
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "size":
          comparison = a.file_size - b.file_size;
          break;
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "type":
          comparison = a.file_type.localeCompare(b.file_type);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [searchQuery, selectedTags, materials, hasFilters, sortField, sortOrder]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMaterial(deleteId.id, deleteId.filePath);
      setDeleteId(null);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">搜索</h1>
        <p className="text-muted-foreground mt-1">快速找到你需要的学习资料</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="搜索资料标题、文件名、标签..." 
            className="pl-10 h-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">按标签筛选</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : { borderColor: tag.color, color: tag.color }}
                  onClick={() => handleTagToggle(tag.id)}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {hasFilters && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedTags.length > 0 && `已选择 ${selectedTags.length} 个标签`}
              </span>
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="mr-1 h-4 w-4" />
                清除筛选
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Sorting Controls */}
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <Select value={sortField} onValueChange={(value: typeof sortField) => setSortField(value)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">按名称</SelectItem>
                      <SelectItem value="date">按日期</SelectItem>
                      <SelectItem value="size">按大小</SelectItem>
                      <SelectItem value="type">按类型</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      >
                        <ArrowUpDown className={cn(
                          "h-4 w-4 transition-transform",
                          sortOrder === "desc" && "rotate-180"
                        )} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {sortOrder === "asc" ? "升序" : "降序"}
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>

              {/* View Mode Toggle */}
              <TooltipProvider>
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode("grid")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>网格视图</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setViewMode("list")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>列表视图</TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : !hasFilters ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <SearchIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">开始搜索</h3>
            <p className="text-muted-foreground text-center">
              输入关键词或选择标签搜索你的学习资料
            </p>
          </CardContent>
        </Card>
      ) : searchResults.length === 0 ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <SearchIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">未找到结果</h3>
            <p className="text-muted-foreground text-center">
              没有找到匹配的资料
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            找到 {searchResults.length} 个结果
          </p>
          <div className={cn(
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-2"
          )}>
            {searchResults.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={(id, filePath) => setDeleteId({ id, filePath })}
                onEdit={setEditingMaterial}
                onPreview={setPreviewMaterial}
              />
            ))}
          </div>
        </div>
      )}

      <MaterialEditDialog
        material={editingMaterial}
        open={!!editingMaterial}
        onOpenChange={(open) => !open && setEditingMaterial(null)}
        onSave={updateMaterial}
      />

      <MaterialPreviewDialog
        material={previewMaterial}
        open={!!previewMaterial}
        onOpenChange={(open) => !open && setPreviewMaterial(null)}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个资料吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
