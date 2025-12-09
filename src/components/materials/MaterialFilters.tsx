import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Category } from "@/hooks/useCategories";
import { CategorySelector } from "@/components/categories/CategorySelector";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface MaterialFiltersProps {
  categories: Category[];
  tags: Tag[];
  selectedCategory: string | null;
  selectedTags: string[];
  onCategoryChange: (categoryId: string | null) => void;
  onTagToggle: (tagId: string) => void;
  onClearFilters: () => void;
  editableCategories?: boolean;
  onCategoriesRefresh?: () => void;
}

export function MaterialFilters({
  categories,
  tags,
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagToggle,
  onClearFilters,
  editableCategories = false,
  onCategoriesRefresh,
}: MaterialFiltersProps) {
  const hasFilters = selectedCategory || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <CategorySelector
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        editable={editableCategories}
        onRefresh={onCategoriesRefresh}
      />

      {tags.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">标签筛选</span>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isSelected = selectedTags.includes(tag.id);
              return (
                <Badge
                  key={tag.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  style={
                    isSelected
                      ? { backgroundColor: tag.color, borderColor: tag.color }
                      : { borderColor: tag.color, color: tag.color }
                  }
                  onClick={() => onTagToggle(tag.id)}
                >
                  {tag.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClearFilters}>
          <X className="mr-1 h-4 w-4" />
          清除筛选
        </Button>
      )}
    </div>
  );
}
