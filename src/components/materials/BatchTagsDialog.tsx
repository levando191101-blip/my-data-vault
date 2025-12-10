import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { X, Tags, Loader2, Plus, Minus, RefreshCw } from 'lucide-react';
import { useTags, Tag } from '@/hooks/useTags';

interface BatchTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMaterialIds: string[];
  onSave: (materialIds: string[], tagIds: string[], mode: 'add' | 'remove' | 'replace') => Promise<void>;
}

export function BatchTagsDialog({ 
  open, 
  onOpenChange, 
  selectedMaterialIds,
  onSave 
}: BatchTagsDialogProps) {
  const { tags, loading: tagsLoading } = useTags();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'add' | 'remove' | 'replace'>('add');
  const [saving, setSaving] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTagIds([]);
      setMode('add');
    }
  }, [open]);

  const handleSave = async () => {
    if (selectedTagIds.length === 0 && mode !== 'replace') return;
    
    setSaving(true);
    try {
      await onSave(selectedMaterialIds, selectedTagIds, mode);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const getModeDescription = () => {
    switch (mode) {
      case 'add':
        return '将选中的标签添加到所有选中的文件（保留已有标签）';
      case 'remove':
        return '从所有选中的文件中移除选中的标签';
      case 'replace':
        return '用选中的标签替换所有选中文件的标签（清除原有标签）';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            批量编辑标签
          </DialogTitle>
          <DialogDescription>
            为 {selectedMaterialIds.length} 个文件编辑标签
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Mode Selection */}
          <div className="space-y-3">
            <Label>操作模式</Label>
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'add' | 'remove' | 'replace')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="mode-add" />
                <Label htmlFor="mode-add" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Plus className="h-4 w-4 text-green-500" />
                  添加标签
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="mode-remove" />
                <Label htmlFor="mode-remove" className="flex items-center gap-2 cursor-pointer font-normal">
                  <Minus className="h-4 w-4 text-red-500" />
                  移除标签
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="mode-replace" />
                <Label htmlFor="mode-replace" className="flex items-center gap-2 cursor-pointer font-normal">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  替换标签
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">{getModeDescription()}</p>
          </div>

          {/* Tags Selection */}
          <div className="space-y-2">
            <Label>选择标签</Label>
            {tagsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                暂无标签，请先在设置中创建标签
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
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

          {/* Selected count */}
          {selectedTagIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              已选择 {selectedTagIds.length} 个标签
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || (selectedTagIds.length === 0 && mode !== 'replace') || tagsLoading}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}