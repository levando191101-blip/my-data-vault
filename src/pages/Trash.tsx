import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Trash2,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useTrash } from '@/hooks/useTrash';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { MaterialPreviewDialog } from '@/components/materials/MaterialPreviewDialog';
import { Material } from '@/hooks/useMaterials';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Trash() {
  const { trashedMaterials, loading, restoreMaterial, permanentDelete, emptyTrash } = useTrash();
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] = useState(false);
  const [permanentDeleteDialogOpen, setPermanentDeleteDialogOpen] = useState(false);

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    );
  };

  const selectAll = () => {
    setSelectedMaterialIds(trashedMaterials.map((m) => m.id));
  };

  const deselectAll = () => {
    setSelectedMaterialIds([]);
  };

  const handleRestore = async (ids: string[]) => {
    for (const id of ids) {
      await restoreMaterial(id);
    }
    setSelectedMaterialIds([]);
  };

  const handlePermanentDelete = async () => {
    for (const id of selectedMaterialIds) {
      const material = trashedMaterials.find((m) => m.id === id);
      if (material) {
        await permanentDelete(id, material.file_path);
      }
    }
    setSelectedMaterialIds([]);
    setPermanentDeleteDialogOpen(false);
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setSelectedMaterialIds([]);
    setEmptyTrashDialogOpen(false);
  };

  const isAllSelected =
    selectedMaterialIds.length === trashedMaterials.length &&
    trashedMaterials.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Trash2 className="h-8 w-8" />
          回收站
        </h1>
        <p className="text-muted-foreground mt-1">
          已删除的文件将保留 30 天后自动清空
        </p>
      </div>

      {trashedMaterials.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={isAllSelected ? deselectAll : selectAll}
              className="gap-2"
            >
              {isAllSelected ? '取消全选' : '全选'}
            </Button>
            {selectedMaterialIds.length > 0 && (
              <>
                <div className="h-4 w-px bg-border" />
                <span className="text-sm font-medium">
                  已选择 <span className="text-primary">{selectedMaterialIds.length}</span> 项
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedMaterialIds.length > 0 ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(selectedMaterialIds)}
                  className="gap-2 hover:bg-green-500/10 hover:border-green-500/50"
                >
                  <RotateCcw className="h-4 w-4" />
                  恢复选中
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPermanentDeleteDialogOpen(true)}
                  className="gap-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  永久删除
                </Button>
              </>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setEmptyTrashDialogOpen(true)}
                disabled={trashedMaterials.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                清空回收站
              </Button>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground mt-4">加载中...</p>
          </CardContent>
        </Card>
      ) : trashedMaterials.length === 0 ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <Trash2 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">回收站为空</h3>
            <p className="text-muted-foreground text-center">
              删除的文件会显示在这里
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trashedMaterials.map((material) => {
              const deletedDate = material.deleted_at ? new Date(material.deleted_at) : null;
              const deletedAgo = deletedDate
                ? formatDistanceToNow(deletedDate, { locale: zhCN, addSuffix: true })
                : '';

              return (
                <div 
                  key={material.id} 
                  className="relative group"
                  onContextMenu={(e) => {
                    // 让右键事件传递到 MaterialCard 的 ContextMenu
                  }}
                >
                  <Checkbox
                    className="absolute top-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100 bg-background border-2"
                    checked={selectedMaterialIds.includes(material.id)}
                    onCheckedChange={() => toggleMaterialSelection(material.id)}
                    onContextMenu={(e) => {
                      // Checkbox 上右键时阻止默认菜单
                      e.preventDefault();
                    }}
                  />
                  <div className="relative">
                    <MaterialCard
                      material={material}
                      onDelete={() => {}}
                      onEdit={() => {}}
                      onPreview={setPreviewMaterial}
                    />
                    <div 
                      className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-lg pointer-events-none"
                      onContextMenu={(e) => {
                        // 遮罩层不阻止右键事件
                        e.stopPropagation();
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {deletedAgo}
                      </Badge>
                    </div>
                    <div className="absolute bottom-2 right-2 left-2 flex gap-2 pointer-events-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleRestore([material.id])}
                        className="flex-1 gap-1 bg-green-500/80 hover:bg-green-500 text-white"
                      >
                        <RotateCcw className="h-3 w-3" />
                        恢复
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedMaterialIds([material.id]);
                          setPermanentDeleteDialogOpen(true);
                        }}
                        className="gap-1 bg-destructive/80 hover:bg-destructive text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <MaterialPreviewDialog
        material={previewMaterial}
        open={!!previewMaterial}
        onOpenChange={(open) => !open && setPreviewMaterial(null)}
      />

      <AlertDialog open={emptyTrashDialogOpen} onOpenChange={setEmptyTrashDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认清空回收站
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除回收站中的所有 {trashedMaterials.length} 个文件，且无法恢复。
              确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyTrash}
              className="bg-destructive text-destructive-foreground"
            >
              清空回收站
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={permanentDeleteDialogOpen}
        onOpenChange={setPermanentDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              确认永久删除
            </AlertDialogTitle>
            <AlertDialogDescription>
              此操作将永久删除选中的 {selectedMaterialIds.length} 个文件，且无法恢复。
              确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePermanentDelete}
              className="bg-destructive text-destructive-foreground"
            >
              永久删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

