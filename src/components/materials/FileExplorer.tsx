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
  DragOverEvent,
  useDroppable,
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
  Folder,
  FolderOpen,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  LayoutGrid,
  List,
  Plus,
} from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { Category } from "@/hooks/useCategories";
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
  onCategoryCreate?: () => void;
  onCategoriesRefresh?: () => void;
}

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

// Droppable folder component for sidebar tree
function DroppableFolderNode({
  node,
  selectedCategory,
  onCategoryChange,
  level = 0,
  isOver,
  expandedFolders,
  onToggleExpand,
}: {
  node: Category & { children: (Category & { children: any[] })[] };
  selectedCategory: string | null;
  onCategoryChange: (id: string | null) => void;
  level?: number;
  isOver: boolean;
  expandedFolders: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const { setNodeRef, isOver: isOverThis } = useDroppable({
    id: `folder-${node.id}`,
    data: { type: "folder", categoryId: node.id },
  });

  const hasChildren = node.children.length > 0;
  const isExpanded = expandedFolders.has(node.id);

  return (
    <div className="space-y-0.5">
      <div
        ref={setNodeRef}
        className={cn(
          "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer transition-colors",
          selectedCategory === node.id ? "bg-accent text-accent-foreground" : "hover:bg-muted",
          isOverThis && "ring-2 ring-primary bg-primary/10"
        )}
        style={{ paddingLeft: level * 12 + 8 }}
        onClick={() => onCategoryChange(node.id)}
      >
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
      </div>
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <DroppableFolderNode
              key={child.id}
              node={child}
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              level={level + 1}
              isOver={isOver}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Droppable folder card for main area
function DroppableFolderCard({
  category,
  onClick,
}: {
  category: Category;
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `card-folder-${category.id}`,
    data: { type: "folder", categoryId: category.id },
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isOver && "ring-2 ring-primary bg-primary/10 shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Folder className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{category.name}</h3>
          <p className="text-xs text-muted-foreground">文件夹</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Drag overlay content
function DragOverlayContent({ material }: { material: Material | null }) {
  if (!material) return null;
  
  return (
    <Card className="w-64 shadow-xl rotate-3">
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
  onCategoryCreate,
  onCategoriesRefresh,
}: FileExplorerProps) {
  const { toast } = useToast();
  const [showSidebar, setShowSidebar] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { roots, map } = buildCategoryTree(categories);
  const categoryPath = getCategoryPath(currentCategory, categories);
  
  // Get current folder's children (for single pane view)
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

  const handleDragStart = (event: DragStartEvent) => {
    const materialId = event.active.id as string;
    const material = materials.find(m => m.id === materialId);
    setActiveMaterial(material || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveMaterial(null);

    if (!over) return;

    const overData = over.data.current;
    
    // Check if dropping onto a folder
    if (overData?.type === "folder") {
      const targetCategoryId = overData.categoryId as string;
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
          // Trigger a refresh
          const success = await onSave(materialId, {
            title: material.title,
            categoryId: targetCategoryId,
            tagIds: material.tags?.map(t => t.id) || [],
          });
        } catch (error) {
          toast({
            title: "移动失败",
            description: "请重试",
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

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-16rem)] border rounded-lg overflow-hidden bg-background">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-r flex flex-col bg-muted/30">
            <div className="p-2 border-b flex items-center justify-between">
              <span className="text-sm font-medium">文件夹</span>
              {onCategoryCreate && (
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCategoryCreate}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
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
                  <span className="w-5" />
                  <FolderOpen className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">全部文件</span>
                </div>
                
                {roots.map((root) => (
                  <DroppableFolderNode
                    key={root.id}
                    node={root}
                    selectedCategory={currentCategory}
                    onCategoryChange={setCurrentCategory}
                    isOver={!!activeMaterial}
                    expandedFolders={expandedFolders}
                    onToggleExpand={toggleExpand}
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
            
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
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Show child folders in single pane mode (or always when no sidebar) */}
              {(!showSidebar || childCategories.length > 0) && childCategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">文件夹</h4>
                  <div className={cn(
                    viewMode === "grid" 
                      ? "grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                      : "space-y-2"
                  )}>
                    {childCategories.map((cat) => (
                      <DroppableFolderCard
                        key={cat.id}
                        category={cat}
                        onClick={() => setCurrentCategory(cat.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {currentMaterials.length > 0 ? (
                <div>
                  {(childCategories.length > 0 || !showSidebar) && (
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
                  <p className="text-sm text-muted-foreground">
                    拖拽文件到这里或上传新文件
                  </p>
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        <DragOverlayContent material={activeMaterial} />
      </DragOverlay>

      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg text-sm">
          正在移动文件...
        </div>
      )}
    </DndContext>
  );
}
