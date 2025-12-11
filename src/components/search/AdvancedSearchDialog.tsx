import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useTags } from '@/hooks/useTags';

export interface AdvancedSearchFilters {
  minSize?: number; // bytes
  maxSize?: number; // bytes
  dateFrom?: Date;
  dateTo?: Date;
  fileTypes?: string[];
  categoryId?: string;
  tagIds?: string[];
}

interface AdvancedSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AdvancedSearchFilters;
  onApply: (filters: AdvancedSearchFilters) => void;
}

const FILE_TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
  { value: 'audio', label: '音频' },
  { value: 'document', label: '文档' },
  { value: 'spreadsheet', label: '表格' },
  { value: 'other', label: '其他' },
];

const FILE_SIZE_PRESETS = [
  { label: '小于 1MB', max: 1024 * 1024 },
  { label: '1MB - 10MB', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { label: '10MB - 100MB', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
  { label: '大于 100MB', min: 100 * 1024 * 1024 },
];

export function AdvancedSearchDialog({
  open,
  onOpenChange,
  filters,
  onApply,
}: AdvancedSearchDialogProps) {
  const [localFilters, setLocalFilters] = useState<AdvancedSearchFilters>(filters);
  const { categories } = useCategories();
  const { tags } = useTags();

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    onApply(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  const toggleFileType = (type: string) => {
    setLocalFilters(prev => {
      const types = prev.fileTypes || [];
      return {
        ...prev,
        fileTypes: types.includes(type)
          ? types.filter(t => t !== type)
          : [...types, type],
      };
    });
  };

  const toggleTag = (tagId: string) => {
    setLocalFilters(prev => {
      const tagIds = prev.tagIds || [];
      return {
        ...prev,
        tagIds: tagIds.includes(tagId)
          ? tagIds.filter(id => id !== tagId)
          : [...tagIds, tagId],
      };
    });
  };

  const applySizePreset = (preset: typeof FILE_SIZE_PRESETS[0]) => {
    setLocalFilters(prev => ({
      ...prev,
      minSize: preset.min,
      maxSize: preset.max,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            高级搜索
          </DialogTitle>
          <DialogDescription>
            使用多个条件精确搜索你的资料
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Size Filter */}
          <div className="space-y-3">
            <Label>文件大小</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {FILE_SIZE_PRESETS.map((preset, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => applySizePreset(preset)}
                >
                  {preset.label}
                </Badge>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">最小大小 (MB)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minSize ? (localFilters.minSize / (1024 * 1024)).toFixed(2) : ''}
                  onChange={(e) =>
                    setLocalFilters(prev => ({
                      ...prev,
                      minSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">最大大小 (MB)</Label>
                <Input
                  type="number"
                  placeholder="无限制"
                  value={localFilters.maxSize ? (localFilters.maxSize / (1024 * 1024)).toFixed(2) : ''}
                  onChange={(e) =>
                    setLocalFilters(prev => ({
                      ...prev,
                      maxSize: e.target.value ? parseFloat(e.target.value) * 1024 * 1024 : undefined,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label>上传时间</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">开始日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !localFilters.dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateFrom ? (
                        format(localFilters.dateFrom, 'PPP', { locale: zhCN })
                      ) : (
                        '选择日期'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateFrom}
                      onSelect={(date) =>
                        setLocalFilters(prev => ({ ...prev, dateFrom: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">结束日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !localFilters.dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localFilters.dateTo ? (
                        format(localFilters.dateTo, 'PPP', { locale: zhCN })
                      ) : (
                        '选择日期'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={localFilters.dateTo}
                      onSelect={(date) =>
                        setLocalFilters(prev => ({ ...prev, dateTo: date }))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* File Type Filter */}
          <div className="space-y-3">
            <Label>文件类型</Label>
            <div className="flex flex-wrap gap-2">
              {FILE_TYPE_OPTIONS.map((type) => (
                <Badge
                  key={type.value}
                  variant={localFilters.fileTypes?.includes(type.value) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleFileType(type.value)}
                >
                  {type.label}
                  {localFilters.fileTypes?.includes(type.value) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div className="space-y-2">
              <Label>分类</Label>
              <Select
                value={localFilters.categoryId || 'all'}
                onValueChange={(value) =>
                  setLocalFilters(prev => ({
                    ...prev,
                    categoryId: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有分类</SelectItem>
                  {categories
                    .filter((c) => !c.parent_id)
                    .map((category) => {
                      const children = categories.filter(
                        (c) => c.parent_id === category.id
                      );
                      return [
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>,
                        ...children.map((child) => (
                          <SelectItem key={child.id} value={child.id}>
                            　　{child.name}
                          </SelectItem>
                        )),
                      ];
                    })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div className="space-y-3">
              <Label>标签</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
                {tags.map((tag) => {
                  const isSelected = localFilters.tagIds?.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      style={{
                        backgroundColor: isSelected ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: isSelected ? 'white' : tag.color,
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            重置
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleApply}>
            应用筛选
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

