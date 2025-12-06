import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { Category } from "@/hooks/useCategories";

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
}

export function MaterialFilters({
  categories,
  tags,
  selectedCategory,
  selectedTags,
  onCategoryChange,
  onTagToggle,
  onClearFilters,
}: MaterialFiltersProps) {
  const hasFilters = selectedCategory || selectedTags.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={selectedCategory || "all"}
          onValueChange={(value) =>
            onCategoryChange(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="mr-1 h-4 w-4" />
            清除筛选
          </Button>
        )}
      </div>

      {tags.length > 0 && (
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
      )}
    </div>
  );
}
