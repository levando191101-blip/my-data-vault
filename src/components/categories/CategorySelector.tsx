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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, Folder, FolderOpen, Grid3X3, List, Tags } from "lucide-react";
import { Category } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
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
  onCategoryChange 
}: CategorySelectorProps) {
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
        <Badge
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          className="cursor-pointer transition-colors"
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </Badge>
      ))}
    </div>
  );
}

// Card grid selector
function CardGridSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategorySelectorProps) {
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
            "cursor-pointer transition-all hover:shadow-md",
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
  level = 0 
}: { 
  node: Category & { children: Category[] }; 
  selectedCategory: string | null; 
  onCategoryChange: (id: string | null) => void;
  level?: number;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className="space-y-1">
      {hasChildren ? (
        <Collapsible open={open} onOpenChange={setOpen}>
          <div className="flex items-center gap-1" style={{ paddingLeft: level * 16 }}>
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
          </div>
          <CollapsibleContent>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child as Category & { children: Category[] }}
                selectedCategory={selectedCategory}
                onCategoryChange={onCategoryChange}
                level={level + 1}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div className="flex items-center gap-1" style={{ paddingLeft: level * 16 + 28 }}>
          <Button
            variant={selectedCategory === node.id ? "secondary" : "ghost"}
            size="sm"
            className="justify-start flex-1"
            onClick={() => onCategoryChange(node.id)}
          >
            <Folder className="mr-2 h-4 w-4" />
            {node.name}
          </Button>
        </div>
      )}
    </div>
  );
}

function TreeListSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategorySelectorProps) {
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
        />
      ))}
    </div>
  );
}

// Breadcrumb navigation
function BreadcrumbSelector({ 
  categories, 
  selectedCategory, 
  onCategoryChange 
}: CategorySelectorProps) {
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
            <BreadcrumbItem key={cat.id}>
              <BreadcrumbSeparator />
              <BreadcrumbLink 
                className={cn("cursor-pointer", index === path.length - 1 && "font-bold")}
                onClick={() => onCategoryChange(cat.id)}
              >
                {cat.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      
      {showCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {showCategories.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              size="sm"
              onClick={() => onCategoryChange(cat.id)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {cat.name}
            </Button>
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
}: CategorySelectorProps) {
  const [viewMode, setViewMode] = useState<"badge" | "grid" | "tree" | "breadcrumb">("badge");

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">分类筛选</span>
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

      {viewMode === "badge" && (
        <BadgeSelector 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange} 
        />
      )}
      {viewMode === "grid" && (
        <CardGridSelector 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange} 
        />
      )}
      {viewMode === "tree" && (
        <TreeListSelector 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange} 
        />
      )}
      {viewMode === "breadcrumb" && (
        <BreadcrumbSelector 
          categories={categories} 
          selectedCategory={selectedCategory} 
          onCategoryChange={onCategoryChange} 
        />
      )}
    </div>
  );
}
