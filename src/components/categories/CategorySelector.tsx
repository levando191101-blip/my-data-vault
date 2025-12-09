import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  FolderPlus,
  Grid3X3, 
  List, 
  Tags, 
  Plus, 
  Pencil, 
  Trash2,
  MoreHorizontal,
  Settings2
} from "lucide-react";
import { Category, useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
  editable?: boolean;
  onRefresh?: () => void;
}

// Build tree structure from flat categories
function buildCategoryTree(categories: Category[]) {
  const map = new Map<string, Category & { children: Category[] }>();
  const roots: (Category & { children: Category[] })[] = [];

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

// Badge/Tag style selector
function BadgeSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  editable,
  onEdit,
  onDelete,
  onAddSub,
}: CategorySelectorProps & {
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onAddSub?: (cat: Category) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={selectedCategory === null ? "default" : "outline"}
        className="cursor-pointer transition-colors"
        onClick={() => onCategoryChange(null)}
      >
        全部
      </Badge>
      {categories.map((category) => (
        <div key={category.id} className="relative group">
          <Badge
            variant={selectedCategory === category.id ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-colors",
              editable && "pr-7"
            )}
            onClick={() => onCategoryChange(category.id)}
          >
            {category.name}
          </Badge>
          {editable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => onEdit?.(category)}>
                  <Pencil className="mr-2 h-3 w-3" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddSub?.(category)}>
                  <FolderPlus className="mr-2 h-3 w-3" />
                  添加子分类
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(category)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      ))}
    </div>
  );
}

// Card grid selector
function CardGridSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  editable,
  onEdit,
  onDelete,
  onAddSub,
}: CategorySelectorProps & {
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onAddSub?: (cat: Category) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:shadow-md",
          selectedCategory === null && "ring-2 ring-primary"
        )}
        onClick={() => onCategoryChange(null)}
      >
        <CardContent className="p-3 flex flex-col items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium text-center">全部分类</span>
        </CardContent>
      </Card>
      {categories.map((category) => (
        <Card 
          key={category.id}
          className={cn(
            "cursor-pointer transition-all hover:shadow-md group relative",
            selectedCategory === category.id && "ring-2 ring-primary"
          )}
          onClick={() => onCategoryChange(category.id)}
        >
          <CardContent className="p-3 flex flex-col items-center gap-2">
            <Folder className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium text-center truncate w-full">
              {category.name}
            </span>
          </CardContent>
          {editable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                <DropdownMenuItem onClick={() => onEdit?.(category)}>
                  <Pencil className="mr-2 h-3 w-3" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddSub?.(category)}>
                  <FolderPlus className="mr-2 h-3 w-3" />
                  添加子分类
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete?.(category)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Card>
      ))}
    </div>
  );
}

// Tree list selector
function TreeNode({ 
  node, 
  selectedCategory, 
  onCategoryChange, 
  level = 0,
  editable,
  onEdit,
  onDelete,
  onAddSub,
}: { 
  node: Category & { children: Category[] }; 
  selectedCategory: string | null; 
  onCategoryChange: (id: string | null) => void;
  level?: number;
  editable?: boolean;
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onAddSub?: (cat: Category) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  const actionButton = editable && (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover">
        <DropdownMenuItem onClick={() => onEdit?.(node)}>
          <Pencil className="mr-2 h-3 w-3" />
          编辑
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAddSub?.(node)}>
          <FolderPlus className="mr-2 h-3 w-3" />
          添加子分类
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => onDelete?.(node)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-3 w-3" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-1">
      {hasChildren ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-1 group" style={{ paddingLeft: level * 16 }}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
              </Button>
            </CollapsibleTrigger>
            <Button
              variant={selectedCategory === node.id ? "secondary" : "ghost"}
              size="sm"
              className="justify-start flex-1"
              onClick={() => onCategoryChange(node.id)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {node.name}
            </Button>
            {actionButton}
          </div>
          <CollapsibleContent>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child as Category & { children: Category[] }}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                level={level + 1}
                editable={editable}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSub={onAddSub}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex items-center gap-1 group" style={{ paddingLeft: level * 16 + 28 }}>
          <Button
            variant={selectedCategory === node.id ? "secondary" : "ghost"}
            size="sm"
            className="justify-start flex-1"
            onClick={() => onCategoryChange(node.id)}
          >
            <Folder className="mr-2 h-4 w-4" />
            {node.name}
          </Button>
          {actionButton}
        </div>
      )}
    </div>
  );
}

function TreeListSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  editable,
  onEdit,
  onDelete,
  onAddSub,
}: CategorySelectorProps & {
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onAddSub?: (cat: Category) => void;
}) {
  const { roots, map } = buildCategoryTree(categories);

  return (
    <div className="space-y-1 border rounded-lg p-3 bg-muted/30">
      <Button
        variant={selectedCategory === null ? "secondary" : "ghost"}
        size="sm"
        className="justify-start w-full"
        onClick={() => onCategoryChange(null)}
      >
        <FolderOpen className="mr-2 h-4 w-4" />
        全部分类
      </Button>
      {roots.map((root) => (
        <TreeNode
          key={root.id}
          node={root}
          selectedCategory={selectedCategory}
          onCategoryChange={onCategoryChange}
          editable={editable}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSub={onAddSub}
        />
      ))}
    </div>
  );
}

// Breadcrumb navigation
function BreadcrumbSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange,
  editable,
  onEdit,
  onDelete,
  onAddSub,
}: CategorySelectorProps & {
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
  onAddSub?: (cat: Category) => void;
}) {
  const path = getCategoryPath(selectedCategory, categories);
  const { roots, map } = buildCategoryTree(categories);
  
  // Get children of current category
  const currentNode = selectedCategory ? map.get(selectedCategory) : null;
  const children = currentNode?.children || [];
  const showCategories = selectedCategory === null ? roots : children;

  return (
    <div className="space-y-3">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink 
              className={cn("cursor-pointer", !selectedCategory && "font-bold")}
              onClick={() => onCategoryChange(null)}
            >
              全部分类
            </BreadcrumbLink>
          </BreadcrumbItem>
          {path.map((cat, index) => (
            <BreadcrumbItem key={cat.id} className="group">
              <BreadcrumbSeparator />
              <BreadcrumbLink 
                className={cn("cursor-pointer", index === path.length - 1 && "font-bold")}
                onClick={() => onCategoryChange(cat.id)}
              >
                {cat.name}
              </BreadcrumbLink>
              {editable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => onEdit?.(cat)}>
                      <Pencil className="mr-2 h-3 w-3" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddSub?.(cat)}>
                      <FolderPlus className="mr-2 h-3 w-3" />
                      添加子分类
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(cat)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {showCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {showCategories.map((cat) => (
            <div key={cat.id} className="relative group">
              <Button
                variant="outline"
                size="sm"
                className={cn(editable && "pr-8")}
                onClick={() => onCategoryChange(cat.id)}
              >
                <Folder className="mr-2 h-4 w-4" />
                {cat.name}
              </Button>
              {editable && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => onEdit?.(cat)}>
                      <Pencil className="mr-2 h-3 w-3" />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddSub?.(cat)}>
                      <FolderPlus className="mr-2 h-3 w-3" />
                      添加子分类
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete?.(cat)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CategorySelector({
  categories,
  selectedCategory,
  onCategoryChange,
  editable = false,
  onRefresh,
}: CategorySelectorProps) {
  const [viewMode, setViewMode] = useState<"badge" | "grid" | "tree" | "breadcrumb">("badge");
  const [editMode, setEditMode] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"create" | "edit">("create");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategory, setParentCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  
  const { createCategory, updateCategory, deleteCategory } = useCategories();

  const handleCreate = async () => {
    if (!categoryName.trim()) return;
    await createCategory(categoryName.trim(), parentCategory?.id);
    setCategoryName("");
    setParentCategory(null);
    setDialogOpen(false);
    onRefresh?.();
  };

  const handleEdit = async () => {
    if (!categoryName.trim() || !editingCategory) return;
    await updateCategory(editingCategory.id, categoryName.trim());
    setCategoryName("");
    setEditingCategory(null);
    setDialogOpen(false);
    onRefresh?.();
  };

  const handleDelete = async (category: Category) => {
    if (confirm(`确定要删除分类「${category.name}」吗？`)) {
      await deleteCategory(category.id);
      onRefresh?.();
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">分类筛选</span>
          {editable && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setEditMode(!editMode)}
                title={editMode ? "退出编辑" : "编辑分类"}
              >
                <Settings2 className={cn("h-4 w-4", editMode && "text-primary")} />
              </Button>
              {editMode && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => openCreateDialog(null)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  新建分类
                </Button>
              )}
            </>
          )}
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
          <TabsList className="h-8">
            <TabsTrigger value="badge" className="h-6 px-2">
              <Tags className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="grid" className="h-6 px-2">
              <Grid3X3 className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="tree" className="h-6 px-2">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="breadcrumb" className="h-6 px-2">
              <ChevronRight className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {categories.length === 0 ? (
        editable ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">暂无分类</p>
            <Button variant="outline" size="sm" onClick={() => openCreateDialog(null)}>
              <Plus className="mr-1 h-4 w-4" />
              创建第一个分类
            </Button>
          </div>
        ) : null
      ) : (
        <>
          {viewMode === "badge" && (
            <BadgeSelector 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onCategoryChange={onCategoryChange}
              editable={editMode}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddSub={openCreateDialog}
            />
          )}
          {viewMode === "grid" && (
            <CardGridSelector 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onCategoryChange={onCategoryChange}
              editable={editMode}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddSub={openCreateDialog}
            />
          )}
          {viewMode === "tree" && (
            <TreeListSelector 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onCategoryChange={onCategoryChange}
              editable={editMode}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddSub={openCreateDialog}
            />
          )}
          {viewMode === "breadcrumb" && (
            <BreadcrumbSelector 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onCategoryChange={onCategoryChange}
              editable={editMode}
              onEdit={openEditDialog}
              onDelete={handleDelete}
              onAddSub={openCreateDialog}
            />
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "create" 
                ? parentCategory 
                  ? `在「${parentCategory.name}」下新建子分类` 
                  : "新建分类"
                : "编辑分类"
              }
            </DialogTitle>
          </DialogHeader>
          <Input
            placeholder="分类名称"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (dialogType === "create" ? handleCreate() : handleEdit())}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={dialogType === "create" ? handleCreate : handleEdit}>
              {dialogType === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
