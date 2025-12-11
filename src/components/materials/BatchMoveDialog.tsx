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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';

interface BatchMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onSave: (categoryId: string | null) => Promise<void>;
}

export function BatchMoveDialog({
  open,
  onOpenChange,
  selectedCount,
  onSave,
}: BatchMoveDialogProps) {
  const { categories, loading: categoriesLoading } = useCategories();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedCategoryId(null);
    }
  }, [open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selectedCategoryId);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  // Build flat list with indentation for nested categories
  const flatCategories = categories
    .filter((c) => !c.parent_id)
    .flatMap((parent) => {
      const children = categories.filter((c) => c.parent_id === parent.id);
      return [
        parent,
        ...children.map((child) => ({ ...child, isChild: true })),
      ];
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            批量移动到分类
          </DialogTitle>
          <DialogDescription>
            将 {selectedCount} 个文件移动到指定分类
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>目标分类</Label>
            {categoriesLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                暂无分类，请先在设置中创建分类
              </p>
            ) : (
              <Select
                value={selectedCategoryId || 'none'}
                onValueChange={(value) =>
                  setSelectedCategoryId(value === 'none' ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无分类</SelectItem>
                  {flatCategories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.isChild && '　　'}
                      {category.icon && `${category.icon} `}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || categoriesLoading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认移动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

