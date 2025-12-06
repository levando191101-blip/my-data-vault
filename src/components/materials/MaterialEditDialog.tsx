import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, FolderOpen, Tags, Loader2 } from 'lucide-react';
import { Material } from '@/hooks/useMaterials';
import { useCategories, Category } from '@/hooks/useCategories';
import { useTags, Tag } from '@/hooks/useTags';

interface MaterialEditDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, data: { title: string; categoryId: string | null; tagIds: string[] }) => Promise<boolean>;
}

export function MaterialEditDialog({ material, open, onOpenChange, onSave }: MaterialEditDialogProps) {
  const { categories } = useCategories();
  const { tags } = useTags();
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (material) {
      setTitle(material.title);
      setCategoryId(material.category_id);
      setSelectedTagIds(material.tags?.map(t => t.id) || []);
    }
  }, [material]);

  const handleSave = async () => {
    if (!material || !title.trim()) return;
    
    setSaving(true);
    const success = await onSave(material.id, {
      title: title.trim(),
      categoryId,
      tagIds: selectedTagIds
    });
    setSaving(false);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Build flat list with indentation for nested categories
  const flatCategories = categories.filter(c => !c.parent_id).flatMap(parent => {
    const children = categories.filter(c => c.parent_id === parent.id);
    return [parent, ...children.map(child => ({ ...child, isChild: true }))];
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>编辑资料</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入资料标题"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              分类
            </Label>
            <Select 
              value={categoryId || "none"} 
              onValueChange={(v) => setCategoryId(v === "none" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">不选择分类</SelectItem>
                {flatCategories.map((category: Category & { isChild?: boolean }) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.isChild ? `  └ ${category.name}` : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tags className="h-4 w-4" />
              标签
            </Label>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无标签，请先在设置中创建标签</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-all hover:scale-105"
                      style={{
                        backgroundColor: isSelected ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: isSelected ? 'white' : tag.color
                      }}
                      onClick={() => toggleTag(tag.id)}
                    >
                      {tag.name}
                      {isSelected && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
