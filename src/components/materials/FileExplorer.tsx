import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  List,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
  Columns,
  Square,
  GripVertical,
} from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { Category, useCategories } from "@/hooks/useCategories";
import { DraggableMaterialCard } from "./DraggableMaterialCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileExplorerProps {
  materials: Material[];
  categories: Category[];
  onDelete: (id: string, filePath: string) => void;
  onSave: (id: string, data: { title: string; categoryId: string | null; tagIds: string[] }) => Promise<boolean>;
  onPreview?: (material: Material) => void;
  onReorder: (materials: Material[]) => void;
  onCategoriesRefresh?: () => void;
}

type DragItem = {
  type: "material" | "folder";
  id: string;
  data?: Material | Category;
};

// Build category tree structure
function buildCategoryTree(categories: Category[]) {
  const map = new Map<string, Category & { children: (Category & { children: any[] })[] }>();
  const roots: (Category & { children: (Category & { children: any[] })[] })[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return { roots, map };
}

// Get category path for breadcrumb
function getCategoryPath(categoryId: string | null, categories: Category[]): Category[] {
  if (!categoryId) return [];
  
  const path: Category[] = [];
  let current = categories.find((c) => c.id === categoryId);
  
  while (current) {
    path.unshift(current);
    current = current.parent_id 
      ? categories.find((c) => c.id === current!.parent_id) 
      : undefined;
  }
  
  return path;
}

// Draggable and droppable folder node for sidebar
function DraggableFolderNode({
  node,
  selectedCategory,
  onCategoryChange,
  level = 0,
  expandedFolders,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddSub,
}: {
  node: Category & { children: (Category & { children: any[] })[] };
  selectedCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  level?: number;
  expandedFolders: Set<string>;
  onToggleExpand: (id: string) => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddSub: (cat: Category) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `folder-${node.id}`,
    data: { type: "folder", categoryId: node.id },
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag-folder-${node.id}`,
    data: { type: "folder", id: node.id, data: node },
  });

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolders.has(node.id);

  return (
    <div className={cn("space-y-0.5", isDragging && "opacity-50")}>
      <div
        ref={(el) => {
          setDropRef(el);
          setDragRef(el);
        }}
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors group",
          selectedCategory === node.id ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          isOver && "ring-2 ring-primary bg-primary/10"
        )}
        style={{ paddingLeft: level * 12 + 8 }}
        onClick={() => onCategoryChange(node.id)}
      >
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted-foreground/10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>
        {hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", isExpanded && "rotate-90")} />
          </Button>
        ) : (
          <span className="w-5" />
        )}
        {selectedCategory === node.id ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm truncate flex-1">{node.name}</span>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => onEdit(node)}>
              <Pencil className="mr-2 h-3 w-3" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddSub(node)}>
              <FolderPlus className="mr-2 h-3 w-3" />
              新建子文件夹
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(node)} className="text-destructive">
              <Trash2 className="mr-2 h-3 w-3" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <DraggableFolderNode
              key={child.id}
              node={child}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              level={level + 1}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSub={onAddSub}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Draggable folder card for main area
function DraggableFolderCard({
  category,
  onClick,
  onEdit,
  onDelete,
  onAddSub,
  viewMode = "grid",
  iconScale = 1,
}: {
  category: Category;
  onClick: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddSub: (cat: Category) => void;
  viewMode?: "grid" | "list";
  iconScale?: number;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `card-folder-${category.id}`,
    data: { type: "folder", categoryId: category.id },
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag-card-folder-${category.id}`,
    data: { type: "folder", id: category.id, data: category },
  });

  // List mode: horizontal compact card
  if (viewMode === "list") {
    return (
      <Card
        ref={(el) => {
          setDropRef(el);
          setDragRef(el);
        }}
        className={cn(
          "cursor-pointer transition-all hover:shadow-md group w-fit",
          isOver && "ring-2 ring-primary bg-primary/10 shadow-lg",
          isDragging && "opacity-50"
        )}
        onDoubleClick={onClick}
      >
        <CardContent className="p-2 flex items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
          <div 
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 cursor-pointer"
            onClick={onClick}
          >
            <Folder className="h-4 w-4 text-primary" />
          </div>
          <span 
            className="text-sm font-medium cursor-pointer whitespace-nowrap" 
            onClick={onClick}
          >
            {category.name}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSub(category)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                新建子文件夹
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>
    );
  }

  // Grid mode: vertical card with scalable icon
  const iconSize = Math.round(24 * iconScale);
  const containerSize = Math.round(48 * iconScale);

  return (
    <Card
      ref={(el) => {
        setDropRef(el);
        setDragRef(el);
      }}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md group",
        isOver && "ring-2 ring-primary bg-primary/10 shadow-lg",
        isDragging && "opacity-50"
      )}
      onDoubleClick={onClick}
    >
      <CardContent className="p-3 flex flex-col items-center gap-2">
        <div className="w-full flex items-center justify-between">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              <DropdownMenuItem onClick={() => onEdit(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddSub(category)}>
                <FolderPlus className="mr-2 h-4 w-4" />
                新建子文件夹
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(category)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div 
          className="flex shrink-0 items-center justify-center rounded-lg bg-primary/10 cursor-pointer transition-all"
          style={{ width: containerSize, height: containerSize }}
          onClick={onClick}
        >
          <Folder className="text-primary" style={{ width: iconSize, height: iconSize }} />
        </div>
        <p 
          className="text-sm font-medium text-center w-full px-1 cursor-pointer line-clamp-2" 
          title={category.name}
          onClick={onClick}
        >
          {category.name}
        </p>
      </CardContent>
    </Card>
  );
}

// Drag overlay content
function DragOverlayContent({ item, categories }: { item: DragItem | null; categories: Category[] }) {
  if (!item) return null;
  
  if (item.type === "folder") {
    const category = categories.find(c => c.id === item.id);
    if (!category) return null;
    return (
      <Card className="w-48 shadow-xl rotate-2 bg-background">
        <CardContent className="p-3 flex items-center gap-2">
          <Folder className="h-5 w-5 text-primary" />
          <span className="font-medium truncate">{category.name}</span>
        </CardContent>
      </Card>
    );
  }
  
  const material = item.data as Material;
  if (!material) return null;
  
  return (
    <Card className="w-64 shadow-xl rotate-3 bg-background">
      <CardContent className="p-3">
        <p className="font-medium truncate">{material.title}</p>
        <p className="text-xs text-muted-foreground truncate">{material.file_name}</p>
      </CardContent>
    </Card>
  );
}

export function FileExplorer({
  materials,
  categories,
  onDelete,
  onSave,
  onPreview,
  onReorder,
  onCategoriesRefresh,
}: FileExplorerProps) {
  const { toast } = useToast();
  const { createCategory, updateCategory, deleteCategory } = useCategories();
  
  const [layoutMode, setLayoutMode] = useState<"dual" | "single">("dual");
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [iconScale, setIconScale] = useState(1); // 0.5 to 2

  // Handle wheel zoom for grid mode
  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode === "grid" && e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setIconScale((prev) => Math.min(2, Math.max(0.5, prev + delta)));
    }
  };

  // Calculate grid columns based on scale
  const getGridCols = () => {
    if (iconScale <= 0.6) return "grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12";
    if (iconScale <= 0.8) return "grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10";
    if (iconScale <= 1.2) return "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6";
    if (iconScale <= 1.5) return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";
    return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
  };

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

  const { roots, map } = buildCategoryTree(categories);
  const categoryPath = getCategoryPath(currentCategory, categories);
  
  // Get current folder's children
  const currentNode = currentCategory ? map.get(currentCategory) : null;
  const childCategories = currentNode?.children || (currentCategory === null ? roots : []);
  
  // Filter materials by current category
  const currentMaterials = materials.filter(m => m.category_id === currentCategory);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const toggleExpand = (id: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Category operations
  const handleCreateCategory = async () => {
    if (!categoryName.trim()) return;
    await createCategory(categoryName.trim(), parentCategory?.id);
    setCategoryName("");
    setParentCategory(null);
    setDialogOpen(false);
    onCategoriesRefresh?.();
  };

  const handleEditCategory = async () => {
    if (!categoryName.trim() || !editingCategory) return;
    await updateCategory(editingCategory.id, categoryName.trim());
    setCategoryName("");
    setEditingCategory(null);
    setDialogOpen(false);
    onCategoriesRefresh?.();
  };

  const handleDeleteCategory = async (category: Category) => {
    if (confirm(`确定要删除文件夹「${category.name}」吗？`)) {
      await deleteCategory(category.id);
      onCategoriesRefresh?.();
    }
  };

  const openCreateDialog = (parent: Category | null = null) => {
    setDialogType("create");
    setParentCategory(parent);
    setCategoryName("");
    setDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setDialogType("edit");
    setEditingCategory(category);
    setCategoryName(category.name);
    setDialogOpen(true);
  };

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as any;
    if (data?.type === "folder") {
      setActiveItem({ type: "folder", id: data.id, data: data.data });
    } else {
      const materialId = event.active.id as string;
      const material = materials.find(m => m.id === materialId);
      setActiveItem({ type: "material", id: materialId, data: material });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;

    const activeData = active.data.current as any;
    const overData = over.data.current as any;
    
    // Check if dropping onto a folder
    if (overData?.type === "folder") {
      const targetCategoryId = overData.categoryId as string;
      
      // If dragging a folder
      if (activeData?.type === "folder") {
        const folderId = activeData.id as string;
        
        // Don't drop folder into itself or its children
        if (folderId === targetCategoryId) return;
        
        // Check if target is a child of the dragged folder
        const isChild = (parentId: string, childId: string): boolean => {
          const child = categories.find(c => c.id === childId);
          if (!child) return false;
          if (child.parent_id === parentId) return true;
          if (child.parent_id) return isChild(parentId, child.parent_id);
          return false;
        };
        
        if (isChild(folderId, targetCategoryId)) {
          toast({
            title: "无法移动",
            description: "不能将文件夹移动到其子文件夹中",
            variant: "destructive",
          });
          return;
        }
        
        setIsSaving(true);
        try {
          await supabase
            .from("categories")
            .update({ parent_id: targetCategoryId })
            .eq("id", folderId);
          
          toast({ title: "文件夹已移动" });
          onCategoriesRefresh?.();
        } catch (error) {
          toast({
            title: "移动失败",
            variant: "destructive",
          });
        } finally {
          setIsSaving(false);
        }
        return;
      }
      
      // If dragging a material
      const materialId = active.id as string;
      const material = materials.find(m => m.id === materialId);
      
      if (material && material.category_id !== targetCategoryId) {
        setIsSaving(true);
        try {
          await supabase
            .from("materials")
            .update({ category_id: targetCategoryId })
            .eq("id", materialId);
          
          toast({ title: "文件已移动到目标文件夹" });
          await onSave(materialId, {
            title: material.title,
            categoryId: targetCategoryId,
            tagIds: material.tags?.map(t => t.id) || [],
          });
        } catch (error) {
          toast({
            title: "移动失败",
            variant: "destructive",
          });
        } finally {
          setIsSaving(false);
        }
      }
    }
  };

  // Root drop zone
  const { setNodeRef: setRootRef, isOver: isOverRoot } = useDroppable({
    id: "folder-root",
    data: { type: "folder", categoryId: null },
  });

  const effectiveShowSidebar = layoutMode === "dual" && showSidebar;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-16rem)] border rounded-lg overflow-hidden bg-background">
        {/* Sidebar */}
        {effectiveShowSidebar && (
          <div className="w-64 border-r flex flex-col bg-muted/30">
            <div className="p-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium">文件夹</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openCreateDialog(null)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
                {/* Root folder */}
                <div
                  ref={setRootRef}
                  className={cn(
                    "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors",
                    currentCategory === null ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                    isOverRoot && "ring-2 ring-primary bg-primary/10"
                  )}
                  onClick={() => setCurrentCategory(null)}
                >
                  <span className="w-4" />
                  <span className="w-5" />
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">全部文件</span>
                </div>
                
                {roots.map((root) => (
                  <DraggableFolderNode
                    key={root.id}
                    node={root}
                    selectedCategory={currentCategory}
                    onCategoryChange={setCurrentCategory}
                    expandedFolders={expandedFolders}
                    onToggleExpand={toggleExpand}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteCategory}
                    onAddSub={openCreateDialog}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="p-2 border-b flex items-center gap-2">
            {layoutMode === "dual" && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowSidebar(!showSidebar)}
                title={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
              >
                {showSidebar ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            )}
            
            <Breadcrumb className="flex-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className={cn("cursor-pointer", !currentCategory && "font-semibold")}
                    onClick={() => setCurrentCategory(null)}
                  >
                    全部文件
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {categoryPath.map((cat, index) => (
                  <BreadcrumbItem key={cat.id}>
                    <BreadcrumbSeparator />
                    <BreadcrumbLink
                      className={cn(
                        "cursor-pointer",
                        index === categoryPath.length - 1 && "font-semibold"
                      )}
                      onClick={() => setCurrentCategory(cat.id)}
                    >
                      {cat.name}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openCreateDialog(currentCategory ? categories.find(c => c.id === currentCategory) || null : null)}
              title="新建文件夹"
            >
              <FolderPlus className="h-4 w-4" />
            </Button>

            {/* Layout mode toggle */}
            <Tabs value={layoutMode} onValueChange={(v) => setLayoutMode(v as "dual" | "single")}>
              <TabsList className="h-8">
                <TabsTrigger value="dual" className="h-6 px-2" title="双栏布局">
                  <Columns className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="single" className="h-6 px-2" title="单栏布局">
                  <Square className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View mode toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "grid" | "list")}>
              <TabsList className="h-8">
                <TabsTrigger value="grid" className="h-6 px-2">
                  <LayoutGrid className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="list" className="h-6 px-2">
                  <List className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Content area */}
          <ScrollArea className="flex-1" onWheel={handleWheel}>
            <div className="p-4">
              {/* Show child folders */}
              {childCategories.length > 0 && (
                <div className="mb-6">
                  {viewMode === "grid" && (
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">文件夹</h4>
                      <span className="text-xs text-muted-foreground">Ctrl+滚轮缩放</span>
                    </div>
                  )}
                  {viewMode === "list" && (
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">文件夹</h4>
                  )}
                  <div className={cn(
                    viewMode === "grid" 
                      ? `grid gap-3 ${getGridCols()}`
                      : "flex flex-wrap gap-3"
                  )}>
                    {childCategories.map((cat) => (
                      <DraggableFolderCard
                        key={cat.id}
                        category={cat}
                        onClick={() => setCurrentCategory(cat.id)}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteCategory}
                        onAddSub={openCreateDialog}
                        viewMode={viewMode}
                        iconScale={iconScale}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {currentMaterials.length > 0 ? (
                <div>
                  {childCategories.length > 0 && (
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">文件</h4>
                  )}
                  <SortableContext
                    items={currentMaterials.map((m) => m.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className={cn(
                      viewMode === "grid"
                        ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        : "space-y-2"
                    )}>
                      {currentMaterials.map((material) => (
                        <DraggableMaterialCard
                          key={material.id}
                          material={material}
                          categories={categories}
                          onDelete={onDelete}
                          onSave={onSave}
                          onPreview={onPreview}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              ) : childCategories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mx-auto mb-4">
                    <Folder className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">此文件夹为空</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    拖拽文件到这里或上传新文件
                  </p>
                  <Button variant="outline" onClick={() => openCreateDialog(currentCategory ? categories.find(c => c.id === currentCategory) || null : null)}>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    新建子文件夹
                  </Button>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        <DragOverlayContent item={activeItem} categories={categories} />
      </DragOverlay>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg text-sm">
          正在移动...
        </div>
      )}

      {/* Create/Edit Category Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "create" 
                ? parentCategory 
                  ? `在「${parentCategory.name}」下新建文件夹` 
                  : "新建文件夹"
                : "重命名文件夹"
              }
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="文件夹名称"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (dialogType === "create" ? handleCreateCategory() : handleEditCategory())}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={dialogType === "create" ? handleCreateCategory : handleEditCategory}>
              {dialogType === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
