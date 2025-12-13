import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search as SearchIcon, X, ArrowUpDown, LayoutGrid, List, Filter, Clock, Trash2 } from 'lucide-react';
import { useMaterials, Material } from '@/hooks/useMaterials';
import { useTags } from '@/hooks/useTags';
import { useBatchOperations } from '@/hooks/useBatchOperations';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { MaterialEditDialog } from '@/components/materials/MaterialEditDialog';
import { MaterialPreviewDialog } from '@/components/materials/MaterialPreviewDialog';
import { BatchOperationToolbar } from '@/components/materials/BatchOperationToolbar';
import { BatchMoveDialog } from '@/components/materials/BatchMoveDialog';
import { BatchTagsDialog } from '@/components/materials/BatchTagsDialog';
import { AdvancedSearchDialog, AdvancedSearchFilters } from '@/components/search/AdvancedSearchDialog';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  const { materials, loading, deleteMaterial, updateMaterial, refetch } = useMaterials();
  const { tags } = useTags();
  const { batchDelete, batchMove, batchDownload, batchUpdateTags } = useBatchOperations();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  // Batch operations state
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [batchMoveDialogOpen, setBatchMoveDialogOpen] = useState(false);
  const [batchTagsDialogOpen, setBatchTagsDialogOpen] = useState(false);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);

  // Advanced search state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedSearchFilters>({});
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);

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
    if (!hasFilters && Object.keys(advancedFilters).length === 0) return [];
    
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

      // Advanced filters
      if (advancedFilters.minSize && material.file_size < advancedFilters.minSize) {
        return false;
      }
      if (advancedFilters.maxSize && material.file_size > advancedFilters.maxSize) {
        return false;
      }
      if (advancedFilters.dateFrom) {
        const materialDate = new Date(material.created_at);
        if (materialDate < advancedFilters.dateFrom) {
          return false;
        }
      }
      if (advancedFilters.dateTo) {
        const materialDate = new Date(material.created_at);
        const endDate = new Date(advancedFilters.dateTo);
        endDate.setHours(23, 59, 59, 999); // End of day
        if (materialDate > endDate) {
          return false;
        }
      }
      if (advancedFilters.fileTypes && advancedFilters.fileTypes.length > 0) {
        if (!advancedFilters.fileTypes.includes(material.file_type)) {
          return false;
        }
      }
      if (advancedFilters.categoryId) {
        if (material.category_id !== advancedFilters.categoryId) {
          return false;
        }
      }
      if (advancedFilters.tagIds && advancedFilters.tagIds.length > 0) {
        const materialTagIds = material.tags?.map((t) => t.id) || [];
        if (!advancedFilters.tagIds.every((tagId) => materialTagIds.includes(tagId))) {
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
  }, [searchQuery, selectedTags, materials, hasFilters, sortField, sortOrder, advancedFilters]);

  // Check if there are any active filters
  const hasActiveFilters = hasFilters || Object.keys(advancedFilters).length > 0;

  // Add search to history when user starts searching
  useEffect(() => {
    if (searchQuery.trim() && hasFilters) {
      addToHistory(searchQuery);
    }
  }, [searchQuery, hasFilters, addToHistory]);

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

  // Batch operations handlers
  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterialIds(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const selectAll = () => {
    setSelectedMaterialIds(searchResults.map(m => m.id));
  };

  const deselectAll = () => {
    setSelectedMaterialIds([]);
  };

  const handleBatchDelete = async () => {
    const materialsToDelete = searchResults.filter(m =>
      selectedMaterialIds.includes(m.id)
    );
    const success = await batchDelete(materialsToDelete);
    if (success) {
      setSelectedMaterialIds([]);
      setBatchDeleteDialogOpen(false);
      refetch();
    }
  };

  const handleBatchMove = async (categoryId: string | null) => {
    const success = await batchMove(selectedMaterialIds, categoryId);
    if (success) {
      setSelectedMaterialIds([]);
      refetch();
    }
  };

  const handleBatchDownload = async () => {
    const materialsToDownload = searchResults.filter(m =>
      selectedMaterialIds.includes(m.id)
    );
    await batchDownload(materialsToDownload);
  };

  const handleBatchUpdateTags = async (
    materialIds: string[],
    tagIds: string[],
    mode: 'add' | 'remove' | 'replace'
  ) => {
    const success = await batchUpdateTags(materialIds, tagIds, mode);
    if (success) {
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <BatchOperationToolbar
        selectedCount={selectedMaterialIds.length}
        totalCount={searchResults.length}
        onSelectAll={selectAll}
        onDeselectAll={deselectAll}
        onBatchDelete={() => setBatchDeleteDialogOpen(true)}
        onBatchMove={() => setBatchMoveDialogOpen(true)}
        onBatchDownload={handleBatchDownload}
        onBatchTags={() => setBatchTagsDialogOpen(true)}
        isAllSelected={selectedMaterialIds.length === searchResults.length && searchResults.length > 0}
      />

      <div>
        <h1 className="text-3xl font-bold">搜索</h1>
        <p className="text-muted-foreground mt-1">快速找到你需要的学习资料</p>
      </div>

      <div className="space-y-4">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="搜索资料标题、文件名、标签..." 
              className="pl-10 pr-10 h-12 text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {/* Search History Popover */}
            {history.length > 0 && !searchQuery && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">搜索历史</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="h-auto p-1 text-xs"
                      >
                        清空
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between group hover:bg-muted/50 rounded px-2 py-1.5"
                        >
                          <button
                            className="flex-1 text-left text-sm truncate"
                            onClick={() => setSearchQuery(item.query)}
                          >
                            {item.query}
                          </button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 h-auto w-auto p-1"
                            onClick={() => removeFromHistory(item.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 shrink-0"
                  onClick={() => setAdvancedSearchOpen(true)}
                >
                  <Filter className={cn(
                    "h-5 w-5",
                    Object.keys(advancedFilters).length > 0 && "text-primary"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                高级搜索
                {Object.keys(advancedFilters).length > 0 && (
                  <span className="ml-1">({Object.keys(advancedFilters).length})</span>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                    <SelectTrigger className="w-[140px] h-10 rounded-xl border-border/50 shadow-sm hover:shadow-md transition-all">
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
                        className="h-10 w-10 rounded-xl border-border/50 shadow-sm hover:shadow-md hover:scale-105 transition-all"
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
                <div className="flex items-center gap-1 border border-border/50 rounded-xl p-1 shadow-sm">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={viewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          viewMode === "grid" && "bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm"
                        )}
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
                        className={cn(
                          "h-8 w-8 rounded-lg transition-all",
                          viewMode === "list" && "bg-gradient-to-br from-primary/10 to-secondary/10 text-primary shadow-sm"
                        )}
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
      ) : !hasActiveFilters ? (
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

      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedMaterialIds.length} 个资料吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive">
              删除全部
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BatchMoveDialog
        open={batchMoveDialogOpen}
        onOpenChange={setBatchMoveDialogOpen}
        selectedCount={selectedMaterialIds.length}
        onSave={handleBatchMove}
      />

      <BatchTagsDialog
        open={batchTagsDialogOpen}
        onOpenChange={setBatchTagsDialogOpen}
        selectedMaterialIds={selectedMaterialIds}
        onSave={handleBatchUpdateTags}
      />

      <AdvancedSearchDialog
        open={advancedSearchOpen}
        onOpenChange={setAdvancedSearchOpen}
        filters={advancedFilters}
        onApply={setAdvancedFilters}
      />
    </div>
  );
}
