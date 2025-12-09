import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMaterials, Material } from "@/hooks/useMaterials";
import { useCategories } from "@/hooks/useCategories";
import { useTags } from "@/hooks/useTags";
import { MaterialPreviewDialog } from "@/components/materials/MaterialPreviewDialog";
import { FileExplorer } from "@/components/materials/FileExplorer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function Materials() {
  const { materials, loading, deleteMaterial, updateMaterial, refetch: refetchMaterials } = useMaterials();
  const { categories, refetch: refetchCategories, createCategory } = useCategories();
  const { tags } = useTags();

  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    filePath: string;
  }>({ open: false, id: "", filePath: "" });
  const [createCategoryDialog, setCreateCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Sync local materials with fetched materials
  useEffect(() => {
    setLocalMaterials(materials);
  }, [materials]);

  const handleDeleteClick = (id: string, filePath: string) => {
    setDeleteDialog({ open: true, id, filePath });
  };

  const handleDeleteConfirm = async () => {
    await deleteMaterial(deleteDialog.id, deleteDialog.filePath);
    setDeleteDialog({ open: false, id: "", filePath: "" });
  };

  const handleReorder = (reorderedMaterials: Material[]) => {
    setLocalMaterials(reorderedMaterials);
  };

  const handleSave = async (id: string, data: { title: string; categoryId: string | null; tagIds: string[] }) => {
    const success = await updateMaterial(id, data);
    if (success) {
      await refetchMaterials();
    }
    return success;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    await createCategory(newCategoryName.trim());
    setNewCategoryName("");
    setCreateCategoryDialog(false);
    refetchCategories();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">我的资料</h1>
        <p className="text-muted-foreground mt-1">
          像 Windows 文件管理器一样管理你的学习资料
        </p>
      </div>

      {materials.length === 0 && categories.length === 0 ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">暂无资料</h3>
            <p className="text-muted-foreground text-center mb-4">
              你还没有上传任何学习资料
            </p>
            <Button asChild>
              <Link to="/upload">开始上传</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <FileExplorer
          materials={localMaterials}
          categories={categories}
          onDelete={handleDeleteClick}
          onSave={handleSave}
          onPreview={setPreviewMaterial}
          onReorder={handleReorder}
          onCategoryCreate={() => setCreateCategoryDialog(true)}
          onCategoriesRefresh={refetchCategories}
        />
      )}

      <MaterialPreviewDialog
        material={previewMaterial}
        open={!!previewMaterial}
        onOpenChange={(open) => !open && setPreviewMaterial(null)}
      />

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) =>
          setDeleteDialog((prev) => ({ ...prev, open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销，确定要删除这个资料吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={createCategoryDialog} onOpenChange={setCreateCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="文件夹名称"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCategoryDialog(false)}>
              取消
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
