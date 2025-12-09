import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
  useDraggable,
  CollisionDetection,
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
  CheckSquare,
  X,
  Download,
  FolderInput,
  Copy,
  FolderSymlink,
  Lasso,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Material } from "@/hooks/useMaterials";
import { Category, useCategories } from "@/hooks/useCategories";
import { DraggableMaterialCard } from "./DraggableMaterialCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useLassoSelection } from "@/hooks/useLassoSelection";

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

// Root drop zone component - separate component to ensure proper registration
function RootDropZone({ 
  isSelected, 
  onClick 
}: { 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "folder-root-sidebar",
    data: { type: "folder", categoryId: null },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 py-3 px-3 mx-2 mt-2 rounded-md cursor-pointer transition-all min-h-[48px] border-2 border-dashed",
        isSelected ? "bg-accent text-accent-foreground border-accent" : "hover:bg-muted border-muted-foreground/30",
        isOver && "ring-2 ring-primary bg-primary/20 border-primary scale-[1.02] shadow-lg"
      )}
      onClick={onClick}
    >
      <FolderOpen className="h-5 w-5 text-primary shrink-0" />
      <span className="text-sm font-medium">全部文件（根目录）</span>
      {isOver && (
        <span className="ml-auto text-xs text-primary font-medium animate-pulse">释放到此处</span>
      )}
    </div>
  );
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
  onMoveTo,
  onCopyTo,
  allCategories,
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
  onMoveTo: (folderId: string, targetParentId: string | null) => void;
  onCopyTo: (folderId: string, targetParentId: string | null) => void;
  allCategories: Category[];
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

  // Filter out the current folder and its children for move targets
  const isChildOf = (parentId: string, childId: string): boolean => {
    const child = allCategories.find(c => c.id === childId);
    if (!child) return false;
    if (child.parent_id === parentId) return true;
    if (child.parent_id) return isChildOf(parentId, child.parent_id);
    return false;
  };

  const moveTargets = allCategories.filter(c => 
    c.id !== node.id && !isChildOf(node.id, c.id)
  );

  return (
    <div className={cn("space-y-0.5", isDragging && "opacity-50")}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
        </ContextMenuTrigger>
        <ContextMenuContent className="bg-popover w-52">
          <ContextMenuItem onClick={() => onCategoryChange(node.id)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            打开文件夹
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onEdit(node)}>
            <Pencil className="mr-2 h-4 w-4" />
            重命名
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onAddSub(node)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            新建子文件夹
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderSymlink className="mr-2 h-4 w-4" />
              移动到...
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="bg-popover w-48 max-h-64 overflow-y-auto">
              <ContextMenuItem 
                onClick={() => onMoveTo(node.id, null)}
                disabled={node.parent_id === null}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                根目录
              </ContextMenuItem>
              <ContextMenuSeparator />
              {moveTargets.map(target => (
                <ContextMenuItem 
                  key={target.id}
                  onClick={() => onMoveTo(node.id, target.id)}
                  disabled={node.parent_id === target.id}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <span className="truncate">{target.name}</span>
                </ContextMenuItem>
              ))}
              {moveTargets.length === 0 && (
                <ContextMenuItem disabled>
                  <span className="text-muted-foreground text-xs">没有可用的目标文件夹</span>
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Copy className="mr-2 h-4 w-4" />
              复制到...
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="bg-popover w-48 max-h-64 overflow-y-auto">
              <ContextMenuItem onClick={() => onCopyTo(node.id, null)}>
                <FolderOpen className="mr-2 h-4 w-4" />
                根目录
              </ContextMenuItem>
              <ContextMenuSeparator />
              {moveTargets.map(target => (
                <ContextMenuItem 
                  key={target.id}
                  onClick={() => onCopyTo(node.id, target.id)}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  <span className="truncate">{target.name}</span>
                </ContextMenuItem>
              ))}
              {moveTargets.length === 0 && (
                <ContextMenuItem disabled>
                  <span className="text-muted-foreground text-xs">没有可用的目标文件夹</span>
                </ContextMenuItem>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => onDelete(node)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            删除文件夹
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
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
              onMoveTo={onMoveTo}
              onCopyTo={onCopyTo}
              allCategories={allCategories}
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
  onMoveTo,
  onCopyTo,
  allCategories,
  viewMode = "grid",
  selectionMode = false,
  isSelected = false,
  isPendingSelection = false,
  onSelect,
}: {
  category: Category;
  onClick: () => void;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
  onAddSub: (cat: Category) => void;
  onMoveTo: (folderId: string, targetParentId: string | null) => void;
  onCopyTo: (folderId: string, targetParentId: string | null) => void;
  allCategories: Category[];
  viewMode?: "grid" | "list";
  selectionMode?: boolean;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}) {
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `card-folder-${category.id}`,
    data: { type: "folder", categoryId: category.id },
  });

  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id: `drag-card-folder-${category.id}`,
    data: { type: "folder", id: category.id, data: category },
  });

  // Filter out the current folder and its children for move targets
  const isChildOf = (parentId: string, childId: string): boolean => {
    const child = allCategories.find(c => c.id === childId);
    if (!child) return false;
    if (child.parent_id === parentId) return true;
    if (child.parent_id) return isChildOf(parentId, child.parent_id);
    return false;
  };

  const moveTargets = allCategories.filter(c => 
    c.id !== category.id && !isChildOf(category.id, c.id)
  );

  // Context menu content (shared between list and grid modes)
  const contextMenuContent = (
    <ContextMenuContent className="bg-popover w-52">
      <ContextMenuItem onClick={onClick}>
        <FolderOpen className="mr-2 h-4 w-4" />
        打开文件夹
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onEdit(category)}>
        <Pencil className="mr-2 h-4 w-4" />
        重命名
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onAddSub(category)}>
        <FolderPlus className="mr-2 h-4 w-4" />
        新建子文件夹
      </ContextMenuItem>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <FolderSymlink className="mr-2 h-4 w-4" />
          移动到...
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="bg-popover w-48 max-h-64 overflow-y-auto">
          <ContextMenuItem 
            onClick={() => onMoveTo(category.id, null)}
            disabled={category.parent_id === null}
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            根目录
          </ContextMenuItem>
          <ContextMenuSeparator />
          {moveTargets.map(target => (
            <ContextMenuItem 
              key={target.id}
              onClick={() => onMoveTo(category.id, target.id)}
              disabled={category.parent_id === target.id}
            >
              <Folder className="mr-2 h-4 w-4" />
              <span className="truncate">{target.name}</span>
            </ContextMenuItem>
          ))}
          {moveTargets.length === 0 && (
            <ContextMenuItem disabled>
              <span className="text-muted-foreground text-xs">没有可用的目标文件夹</span>
            </ContextMenuItem>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSub>
        <ContextMenuSubTrigger>
          <Copy className="mr-2 h-4 w-4" />
          复制到...
        </ContextMenuSubTrigger>
        <ContextMenuSubContent className="bg-popover w-48 max-h-64 overflow-y-auto">
          <ContextMenuItem onClick={() => onCopyTo(category.id, null)}>
            <FolderOpen className="mr-2 h-4 w-4" />
            根目录
          </ContextMenuItem>
          <ContextMenuSeparator />
          {moveTargets.map(target => (
            <ContextMenuItem 
              key={target.id}
              onClick={() => onCopyTo(category.id, target.id)}
            >
              <Folder className="mr-2 h-4 w-4" />
              <span className="truncate">{target.name}</span>
            </ContextMenuItem>
          ))}
          {moveTargets.length === 0 && (
            <ContextMenuItem disabled>
              <span className="text-muted-foreground text-xs">没有可用的目标文件夹</span>
            </ContextMenuItem>
          )}
        </ContextMenuSubContent>
      </ContextMenuSub>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onDelete(category)} className="text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        删除文件夹
      </ContextMenuItem>
    </ContextMenuContent>
  );

  // List mode: full-width horizontal card
  if (viewMode === "list") {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card
            ref={(el) => {
              setDropRef(el);
              setDragRef(el);
            }}
            data-selectable-item
            data-item-id={`folder-${category.id}`}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md group",
              isOver && "ring-2 ring-primary bg-primary/10 shadow-lg",
              isDragging && "opacity-50",
              isSelected && "ring-2 ring-primary bg-primary/5",
              isPendingSelection && !isSelected && "ring-2 ring-primary/50 bg-primary/10"
            )}
            onDoubleClick={onClick}
            onClick={() => {
              if (selectionMode && onSelect) {
                onSelect(category.id, !isSelected);
              }
            }}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {selectionMode ? (
                <div className="p-1">
                  <Checkbox 
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelect?.(category.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ) : (
                <button
                  {...attributes}
                  {...listeners}
                  className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              <div 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 cursor-pointer"
                onClick={onClick}
              >
                <Folder className="h-5 w-5 text-primary" />
              </div>
              <span 
                className="text-sm font-medium cursor-pointer flex-1" 
                onClick={onClick}
              >
                {category.name}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>
    );
  }

  // Grid mode: horizontal compact card
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          ref={(el) => {
            setDropRef(el);
            setDragRef(el);
          }}
          data-selectable-item
          data-item-id={`folder-${category.id}`}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md group",
            isOver && "ring-2 ring-primary bg-primary/10 shadow-lg",
            isDragging && "opacity-50",
            isSelected && "ring-2 ring-primary bg-primary/5",
            isPendingSelection && !isSelected && "ring-2 ring-primary/50 bg-primary/10"
          )}
          onDoubleClick={onClick}
          onClick={() => {
            if (selectionMode && onSelect) {
              onSelect(category.id, !isSelected);
            }
          }}
        >
          <CardContent className="p-3 flex items-center gap-3">
            {selectionMode ? (
              <div className="p-1">
                <Checkbox 
                  checked={isSelected}
                  onCheckedChange={(checked) => onSelect?.(category.id, !!checked)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
            <div 
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 cursor-pointer"
              onClick={onClick}
            >
              <Folder className="h-5 w-5 text-primary" />
            </div>
            <span 
              className="text-sm font-medium cursor-pointer truncate flex-1 min-w-0" 
              title={category.name}
              onClick={onClick}
            >
              {category.name}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      {contextMenuContent}
    </ContextMenu>
  );
}

// Drag overlay content
function DragOverlayContent({ 
  item, 
  categories,
  batchCount = 0,
}: { 
  item: DragItem | null; 
  categories: Category[];
  batchCount?: number;
}) {
  if (!item) return null;
  
  const showBatchBadge = batchCount > 1;
  
  if (item.type === "folder") {
    const category = categories.find(c => c.id === item.id);
    if (!category) return null;
    return (
      <div className="relative">
        <Card className="w-48 shadow-xl rotate-2 bg-background">
          <CardContent className="p-3 flex items-center gap-2">
            <Folder className="h-5 w-5 text-primary" />
            <span className="font-medium truncate">{category.name}</span>
          </CardContent>
        </Card>
        {showBatchBadge && (
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
            {batchCount}
          </div>
        )}
      </div>
    );
  }
  
  const material = item.data as Material;
  if (!material) return null;
  
  return (
    <div className="relative">
      <Card className="w-64 shadow-xl rotate-3 bg-background">
        <CardContent className="p-3">
          <p className="font-medium truncate">{material.title}</p>
          <p className="text-xs text-muted-foreground truncate">{material.file_name}</p>
        </CardContent>
      </Card>
      {showBatchBadge && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
          {batchCount}
        </div>
      )}
    </div>
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
  const { user } = useAuth();
  const { createCategory, updateCategory, deleteCategory } = useCategories();
  
  const [layoutMode, setLayoutMode] = useState<"dual" | "single">("dual");
  const [showSidebar, setShowSidebar] = useState(true);
  const [folderViewMode, setFolderViewMode] = useState<"grid" | "list">("grid");
  const [fileViewMode, setFileViewMode] = useState<"grid" | "list">("grid");
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [batchDragCount, setBatchDragCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Batch selection states
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<string>>(new Set());
  const [selectedFolders, setSelectedFolders] = useState<Set<string>>(new Set());
  const [batchMoveCategoryId, setBatchMoveCategoryId] = useState<string>("none");
  const [batchMoveType, setBatchMoveType] = useState<"files" | "folders">("files");

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "edit" | "batch-move">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");

  // Lasso selection
  const contentAreaRef = useRef<HTMLDivElement>(null);
  
  const handleLassoSelectionComplete = useCallback((selectedIds: Set<string>) => {
    // Separate folder and material selections
    const folderIds = new Set<string>();
    const materialIds = new Set<string>();
    
    selectedIds.forEach(id => {
      if (id.startsWith('folder-')) {
        folderIds.add(id.replace('folder-', ''));
      } else if (id.startsWith('material-')) {
        materialIds.add(id.replace('material-', ''));
      }
    });
    
    if (folderIds.size > 0 || materialIds.size > 0) {
      setSelectionMode(true);
    }
    setSelectedFolders(folderIds);
    setSelectedMaterials(materialIds);
  }, []);

  const {
    isLassoActive,
    lassoRect,
    pendingSelectedIds,
  } = useLassoSelection({
    containerRef: contentAreaRef,
    onSelectionComplete: handleLassoSelectionComplete,
    itemSelector: '[data-selectable-item]',
    getItemId: (element) => element.getAttribute('data-item-id'),
    enabled: true,
  });
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

  const handleMoveFolder = async (folderId: string, targetParentId: string | null) => {
    const folder = categories.find(c => c.id === folderId);
    if (!folder || folder.parent_id === targetParentId) return;
    
    setIsSaving(true);
    try {
      await supabase
        .from("categories")
        .update({ parent_id: targetParentId })
        .eq("id", folderId);
      
      const targetName = targetParentId 
        ? categories.find(c => c.id === targetParentId)?.name || "目标文件夹"
        : "根目录";
      toast({ title: `已移动到「${targetName}」` });
      onCategoriesRefresh?.();
    } catch (error) {
      toast({ title: "移动失败", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveMaterial = async (materialId: string, targetCategoryId: string | null) => {
    const material = materials.find(m => m.id === materialId);
    if (!material || material.category_id === targetCategoryId) return;
    
    setIsSaving(true);
    try {
      await supabase
        .from("materials")
        .update({ category_id: targetCategoryId })
        .eq("id", materialId);
      
      const targetName = targetCategoryId 
        ? categories.find(c => c.id === targetCategoryId)?.name || "目标文件夹"
        : "根目录";
      toast({ title: `已移动到「${targetName}」` });
      onReorder(materials.map(m => 
        m.id === materialId ? { ...m, category_id: targetCategoryId } : m
      ));
    } catch (error) {
      toast({ title: "移动失败", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyMaterial = async (materialId: string, targetCategoryId: string | null) => {
    const material = materials.find(m => m.id === materialId);
    if (!material || !user) return;
    
    setIsSaving(true);
    try {
      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("materials")
        .download(material.file_path);
      
      if (downloadError || !fileData) {
        throw new Error("下载文件失败");
      }

      // Generate new file path
      const timestamp = Date.now();
      const newFileName = `${timestamp}_${material.file_name}`;
      const newFilePath = `${user.id}/${newFileName}`;

      // Upload the copy
      const { error: uploadError } = await supabase.storage
        .from("materials")
        .upload(newFilePath, fileData);

      if (uploadError) {
        throw new Error("上传文件失败");
      }

      // Create new material record
      const { error: insertError } = await supabase
        .from("materials")
        .insert({
          user_id: user.id,
          title: `${material.title} (副本)`,
          file_name: material.file_name,
          file_path: newFilePath,
          file_type: material.file_type,
          file_size: material.file_size,
          mime_type: material.mime_type,
          category_id: targetCategoryId,
        });

      if (insertError) {
        throw new Error("创建记录失败");
      }

      const targetName = targetCategoryId 
        ? categories.find(c => c.id === targetCategoryId)?.name || "目标文件夹"
        : "根目录";
      toast({ title: `已复制到「${targetName}」` });
      onReorder([...materials]); // Trigger refresh
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "复制失败", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFolder = async (folderId: string, targetParentId: string | null) => {
    const folder = categories.find(c => c.id === folderId);
    if (!folder || !user) return;
    
    // Prevent copying folder to itself or its children
    const isDescendant = (parentId: string, childId: string): boolean => {
      const child = categories.find(c => c.id === childId);
      if (!child) return false;
      if (child.id === parentId) return true;
      if (child.parent_id) return isDescendant(parentId, child.parent_id);
      return false;
    };
    
    if (targetParentId && isDescendant(folderId, targetParentId)) {
      toast({ title: "不能复制到自身的子文件夹中", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("categories")
        .insert({
          user_id: user.id,
          name: `${folder.name} (副本)`,
          parent_id: targetParentId,
        });

      if (error) throw error;

      const targetName = targetParentId 
        ? categories.find(c => c.id === targetParentId)?.name || "目标文件夹"
        : "根目录";
      toast({ title: `已复制到「${targetName}」` });
      onCategoriesRefresh?.();
    } catch (error) {
      toast({ title: "复制失败", variant: "destructive" });
    } finally {
      setIsSaving(false);
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

  // Batch selection handlers
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedMaterials(new Set());
      setSelectedFolders(new Set());
    }
    setSelectionMode(!selectionMode);
  };

  const handleSelectMaterial = (id: string, selected: boolean) => {
    setSelectedMaterials(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectFolder = (id: string, selected: boolean) => {
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAllMaterials = () => {
    if (selectedMaterials.size === currentMaterials.length) {
      setSelectedMaterials(new Set());
    } else {
      setSelectedMaterials(new Set(currentMaterials.map(m => m.id)));
    }
  };

  const handleSelectAllFolders = () => {
    if (selectedFolders.size === childCategories.length) {
      setSelectedFolders(new Set());
    } else {
      setSelectedFolders(new Set(childCategories.map(c => c.id)));
    }
  };

  const handleBatchDeleteMaterials = async () => {
    if (selectedMaterials.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedMaterials.size} 个文件吗？`)) return;
    
    const materialsToDelete = materials.filter(m => selectedMaterials.has(m.id));
    for (const material of materialsToDelete) {
      await onDelete(material.id, material.file_path);
    }
    setSelectedMaterials(new Set());
    setSelectionMode(false);
    toast({ title: `已删除 ${materialsToDelete.length} 个文件` });
  };

  const handleBatchDeleteFolders = async () => {
    if (selectedFolders.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedFolders.size} 个文件夹吗？`)) return;
    
    for (const folderId of selectedFolders) {
      await deleteCategory(folderId);
    }
    setSelectedFolders(new Set());
    setSelectionMode(false);
    onCategoriesRefresh?.();
    toast({ title: `已删除 ${selectedFolders.size} 个文件夹` });
  };

  const handleBatchMove = async () => {
    setIsSaving(true);
    const targetCategoryId = batchMoveCategoryId === "none" ? null : batchMoveCategoryId;
    
    if (batchMoveType === "files") {
      for (const materialId of selectedMaterials) {
        const material = materials.find(m => m.id === materialId);
        if (material) {
          await onSave(materialId, {
            title: material.title,
            categoryId: targetCategoryId,
            tagIds: material.tags?.map(t => t.id) || [],
          });
        }
      }
      toast({ title: `已移动 ${selectedMaterials.size} 个文件` });
      setSelectedMaterials(new Set());
    } else {
      // Move folders - update parent_id
      for (const folderId of selectedFolders) {
        const folder = categories.find(c => c.id === folderId);
        if (folder && folderId !== targetCategoryId) {
          // Don't allow moving folder into itself or its children
          const isChild = (parentId: string, childId: string): boolean => {
            const child = categories.find(c => c.id === childId);
            if (!child) return false;
            if (child.parent_id === parentId) return true;
            if (child.parent_id) return isChild(parentId, child.parent_id);
            return false;
          };
          
          if (targetCategoryId && isChild(folderId, targetCategoryId)) {
            continue; // Skip this folder
          }
          
          await supabase
            .from("categories")
            .update({ parent_id: targetCategoryId })
            .eq("id", folderId);
        }
      }
      toast({ title: `已移动 ${selectedFolders.size} 个文件夹` });
      setSelectedFolders(new Set());
      onCategoriesRefresh?.();
    }
    
    setIsSaving(false);
    setSelectionMode(false);
    setDialogOpen(false);
  };

  const handleBatchDownload = async () => {
    if (selectedMaterials.size === 0) return;
    
    const materialsToDownload = materials.filter(m => selectedMaterials.has(m.id));
    for (const material of materialsToDownload) {
      const { data } = supabase.storage.from("materials").getPublicUrl(material.file_path);
      if (data?.publicUrl) {
        window.open(data.publicUrl, "_blank");
      }
    }
  };

  // Build flat category list for select
  const buildFlatCategories = (): { id: string; name: string; level: number }[] => {
    const result: { id: string; name: string; level: number }[] = [];
    const addWithChildren = (cat: Category & { children: any[] }, level: number) => {
      result.push({ id: cat.id, name: cat.name, level });
      cat.children.forEach((child: any) => addWithChildren(child, level + 1));
    };
    roots.forEach(root => addWithChildren(root, 0));
    return result;
  };
  const flatCategories = buildFlatCategories();

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as any;
    
    if (data?.type === "folder") {
      const folderId = data.id as string;
      // Check if this folder is part of a batch selection
      if (selectionMode && selectedFolders.has(folderId) && selectedFolders.size > 0) {
        setBatchDragCount(selectedFolders.size + selectedMaterials.size);
      } else {
        setBatchDragCount(0);
      }
      setActiveItem({ type: "folder", id: folderId, data: data.data });
    } else {
      const materialId = event.active.id as string;
      const material = materials.find(m => m.id === materialId);
      // Check if this material is part of a batch selection
      if (selectionMode && selectedMaterials.has(materialId) && selectedMaterials.size > 0) {
        setBatchDragCount(selectedFolders.size + selectedMaterials.size);
      } else {
        setBatchDragCount(0);
      }
      setActiveItem({ type: "material", id: materialId, data: material });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const currentBatchCount = batchDragCount;
    setActiveItem(null);
    setBatchDragCount(0);

    if (!over) {
      console.log("No drop target detected");
      return;
    }

    console.log("Drop detected:", { 
      activeId: active.id, 
      overId: over.id,
      activeData: active.data.current,
      overData: over.data.current,
      batchMode: currentBatchCount > 1 
    });

    const activeData = active.data.current as any;
    const overData = over.data.current as any;
    
    // Check if dropping onto a folder (including root where categoryId is null)
    if (overData?.type === "folder") {
      const targetCategoryId = overData.categoryId as string | null;
      
      console.log("Dropping to folder target:", targetCategoryId);
      
      // Helper to check if target is a child of a folder
      const isChild = (parentId: string, childId: string): boolean => {
        const child = categories.find(c => c.id === childId);
        if (!child) return false;
        if (child.parent_id === parentId) return true;
        if (child.parent_id) return isChild(parentId, child.parent_id);
        return false;
      };
      
      // BATCH MODE: If dragging with selection active
      if (currentBatchCount > 1 && selectionMode) {
        setIsSaving(true);
        let movedFolders = 0;
        let movedFiles = 0;
        
        try {
          // Move selected folders
          for (const folderId of selectedFolders) {
            const folder = categories.find(c => c.id === folderId);
            if (!folder) continue;
            
            // Don't drop folder into itself or its children
            if (folderId === targetCategoryId) continue;
            if (targetCategoryId && isChild(folderId, targetCategoryId)) continue;
            if (folder.parent_id === targetCategoryId) continue;
            
            await supabase
              .from("categories")
              .update({ parent_id: targetCategoryId })
              .eq("id", folderId);
            movedFolders++;
          }
          
          // Move selected materials
          for (const materialId of selectedMaterials) {
            const material = materials.find(m => m.id === materialId);
            if (!material || material.category_id === targetCategoryId) continue;
            
            await supabase
              .from("materials")
              .update({ category_id: targetCategoryId })
              .eq("id", materialId);
            movedFiles++;
          }
          
          const targetName = targetCategoryId 
            ? categories.find(c => c.id === targetCategoryId)?.name || "目标文件夹"
            : "根目录";
          
          const messages: string[] = [];
          if (movedFolders > 0) messages.push(`${movedFolders} 个文件夹`);
          if (movedFiles > 0) messages.push(`${movedFiles} 个文件`);
          
          if (messages.length > 0) {
            toast({ title: `已移动 ${messages.join(" 和 ")} 到「${targetName}」` });
          }
          
          // Clear selection
          setSelectedFolders(new Set());
          setSelectedMaterials(new Set());
          setSelectionMode(false);
          onCategoriesRefresh?.();
        } catch (error) {
          toast({ title: "批量移动失败", variant: "destructive" });
        } finally {
          setIsSaving(false);
        }
        return;
      }
      
      // SINGLE ITEM MODE
      // If dragging a folder
      if (activeData?.type === "folder") {
        const folderId = activeData.id as string;
        const folder = categories.find(c => c.id === folderId);
        
        console.log("Moving folder:", { folderId, currentParent: folder?.parent_id, targetCategoryId });
        
        // Don't drop folder into itself
        if (folderId === targetCategoryId) return;
        
        // Skip if already in target location
        if (folder?.parent_id === targetCategoryId) {
          console.log("Folder already in target location");
          return;
        }
        
        if (targetCategoryId && isChild(folderId, targetCategoryId)) {
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

  // Note: Sidebar root drop zone is now a separate component (RootDropZone)

  // Content area drop zone - for dropping items to CURRENT directory (not root)
  const { setNodeRef: setContentRootRef, isOver: isOverContentArea } = useDroppable({
    id: "content-area-current",
    data: { type: "folder", categoryId: currentCategory, isContentArea: true },
  });

  const effectiveShowSidebar = layoutMode === "dual" && showSidebar;

  // Custom collision detection: prioritize specific folder targets over area zones
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // Use pointerWithin for precise detection
    const pointerCollisions = pointerWithin(args);
    
    // If pointer is directly over something, use that
    if (pointerCollisions.length > 0) {
      // Priority 1: Sidebar folder nodes (folder-{id})
      const sidebarFolderCollision = pointerCollisions.find(c => {
        const id = String(c.id);
        return id.startsWith("folder-") && 
               id !== "folder-root-sidebar" &&
               !id.startsWith("card-folder-");
      });
      if (sidebarFolderCollision) return [sidebarFolderCollision];
      
      // Priority 2: Main area folder cards (card-folder-{id})
      const cardFolderCollision = pointerCollisions.find(c => 
        String(c.id).startsWith("card-folder-")
      );
      if (cardFolderCollision) return [cardFolderCollision];
      
      // Priority 3: Sidebar root (for moving to root)
      const sidebarRootCollision = pointerCollisions.find(c => 
        c.id === "folder-root-sidebar"
      );
      if (sidebarRootCollision) return [sidebarRootCollision];
      
      // Priority 4: Content area (current directory)
      const contentAreaCollision = pointerCollisions.find(c => 
        c.id === "content-area-current"
      );
      if (contentAreaCollision) return [contentAreaCollision];
      
      return [pointerCollisions[0]];
    }
    
    // Fallback to rectIntersection if pointer not over anything
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return [rectCollisions[0]];
    }
    
    // Last resort: closestCenter
    return closestCenter(args);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
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
            
            {/* Root folder drop zone - using dedicated component */}
            <RootDropZone 
              isSelected={currentCategory === null}
              onClick={() => setCurrentCategory(null)}
            />
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-0.5">
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
                    onMoveTo={handleMoveFolder}
                    onCopyTo={handleCopyFolder}
                    allCategories={categories}
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

          </div>

          {/* Content area with root drop zone */}
          <ScrollArea className="flex-1">
            <div 
              ref={(el) => {
                setContentRootRef(el);
                if (contentAreaRef) {
                  (contentAreaRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                }
              }}
              className={cn(
                "p-4 min-h-full transition-colors relative select-none",
                isOverContentArea && "bg-primary/5 ring-2 ring-inset ring-primary/30"
              )}
            >
              {/* Lasso selection box */}
              {isLassoActive && lassoRect && (
                <div
                  className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none z-50"
                  style={{
                    left: lassoRect.x,
                    top: lassoRect.y,
                    width: lassoRect.width,
                    height: lassoRect.height,
                  }}
                />
              )}
              {/* Show child folders */}
              {childCategories.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <Checkbox
                          checked={selectedFolders.size === childCategories.length && childCategories.length > 0}
                          onCheckedChange={handleSelectAllFolders}
                        />
                      )}
                      <h4 className="text-sm font-medium text-muted-foreground">
                        文件夹 {selectionMode && selectedFolders.size > 0 && `(已选 ${selectedFolders.size})`}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectionMode ? "secondary" : "ghost"}
                              size="sm"
                              className="h-7"
                              onClick={toggleSelectionMode}
                            >
                              <CheckSquare className="h-3.5 w-3.5 mr-1" />
                              {selectionMode ? "取消" : "选择"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>按住 Shift 拖拽可框选多个项目</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Tabs value={folderViewMode} onValueChange={(v) => setFolderViewMode(v as "grid" | "list")}>
                        <TabsList className="h-7">
                          <TabsTrigger value="grid" className="h-5 px-1.5">
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </TabsTrigger>
                          <TabsTrigger value="list" className="h-5 px-1.5">
                            <List className="h-3.5 w-3.5" />
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {/* Folder batch action bar */}
                  {selectionMode && selectedFolders.size > 0 && (
                    <div className="mb-3 p-2 bg-muted rounded-lg flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        已选择 {selectedFolders.size} 个文件夹
                      </span>
                      <div className="flex-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDialogType("batch-move");
                          setBatchMoveType("folders");
                          setBatchMoveCategoryId("none");
                          setDialogOpen(true);
                        }}
                      >
                        <FolderInput className="h-4 w-4 mr-1" />
                        移动
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBatchDeleteFolders}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  )}

                  <div className={cn(
                    folderViewMode === "grid" 
                      ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                      : "space-y-2"
                  )}>
                    {childCategories.map((cat) => (
                      <DraggableFolderCard
                        key={cat.id}
                        category={cat}
                        onClick={() => setCurrentCategory(cat.id)}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteCategory}
                        onAddSub={openCreateDialog}
                        onMoveTo={handleMoveFolder}
                        onCopyTo={handleCopyFolder}
                        allCategories={categories}
                        viewMode={folderViewMode}
                        selectionMode={selectionMode}
                        isSelected={selectedFolders.has(cat.id)}
                        isPendingSelection={pendingSelectedIds.has(`folder-${cat.id}`)}
                        onSelect={handleSelectFolder}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {currentMaterials.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <Checkbox
                          checked={selectedMaterials.size === currentMaterials.length && currentMaterials.length > 0}
                          onCheckedChange={handleSelectAllMaterials}
                        />
                      )}
                      <h4 className="text-sm font-medium text-muted-foreground">
                        文件 {selectionMode && selectedMaterials.size > 0 && `(已选 ${selectedMaterials.size})`}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={selectionMode ? "secondary" : "ghost"}
                              size="sm"
                              className="h-7"
                              onClick={toggleSelectionMode}
                            >
                              <CheckSquare className="h-3.5 w-3.5 mr-1" />
                              {selectionMode ? "取消" : "选择"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>按住 Shift 拖拽可框选多个项目</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Tabs value={fileViewMode} onValueChange={(v) => setFileViewMode(v as "grid" | "list")}>
                        <TabsList className="h-7">
                          <TabsTrigger value="grid" className="h-5 px-1.5">
                            <LayoutGrid className="h-3.5 w-3.5" />
                          </TabsTrigger>
                          <TabsTrigger value="list" className="h-5 px-1.5">
                            <List className="h-3.5 w-3.5" />
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {/* Batch action bar */}
                  {selectionMode && selectedMaterials.size > 0 && (
                    <div className="mb-3 p-2 bg-muted rounded-lg flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">
                        已选择 {selectedMaterials.size} 个文件
                      </span>
                      <div className="flex-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBatchDownload}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        下载
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDialogType("batch-move");
                          setBatchMoveType("files");
                          setBatchMoveCategoryId("none");
                          setDialogOpen(true);
                        }}
                      >
                        <FolderInput className="h-4 w-4 mr-1" />
                        移动
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBatchDeleteMaterials}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  )}

                  <SortableContext
                    items={currentMaterials.map((m) => m.id)}
                    strategy={rectSortingStrategy}
                  >
                    <div className={cn(
                      fileViewMode === "grid"
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
                          onMoveTo={handleMoveMaterial}
                          onCopyTo={handleCopyMaterial}
                          selectionMode={selectionMode}
                          isSelected={selectedMaterials.has(material.id)}
                          isPendingSelection={pendingSelectedIds.has(`material-${material.id}`)}
                          onSelect={handleSelectMaterial}
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
        <DragOverlayContent item={activeItem} categories={categories} batchCount={batchDragCount} />
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
                : dialogType === "edit"
                ? "重命名文件夹"
                : batchMoveType === "files"
                ? "移动文件"
                : "移动文件夹"
              }
            </DialogTitle>
          </DialogHeader>
          
          {dialogType === "batch-move" ? (
            <>
              <p className="text-sm text-muted-foreground">
                将 {batchMoveType === "files" ? selectedMaterials.size : selectedFolders.size} 个{batchMoveType === "files" ? "文件" : "文件夹"}移动到：
              </p>
              <Select
                value={batchMoveCategoryId}
                onValueChange={setBatchMoveCategoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择目标文件夹" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">根目录（无分类）</SelectItem>
                  {flatCategories
                    .filter(cat => batchMoveType === "folders" ? !selectedFolders.has(cat.id) : true)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {"　".repeat(cat.level)}{cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleBatchMove} disabled={isSaving}>
                  {isSaving ? "移动中..." : "确认移动"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
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
            </>
          )}
        </DialogContent>
      </Dialog>
    </DndContext>
  );
}
