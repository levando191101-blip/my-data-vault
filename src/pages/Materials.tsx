import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useMaterials, Material } from "@/hooks/useMaterials";
import { useCategories } from "@/hooks/useCategories";
import { useTags } from "@/hooks/useTags";
import { MaterialFilters } from "@/components/materials/MaterialFilters";
import { MaterialPreviewDialog } from "@/components/materials/MaterialPreviewDialog";
import { SortableMaterialsGrid } from "@/components/materials/SortableMaterialsGrid";
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

export default function Materials() {
  const { materials, loading, deleteMaterial, updateMaterial } = useMaterials();
  const { categories, refetch: refetchCategories } = useCategories();
  const { tags } = useTags();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);
  const [localMaterials, setLocalMaterials] = useState<Material[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    id: string;
    filePath: string;
  }>({ open: false, id: "", filePath: "" });

  // Sync local materials with fetched materials
  useEffect(() => {
    setLocalMaterials(materials);
  }, [materials]);

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedTags([]);
  };

  const handleDeleteClick = (id: string, filePath: string) => {
    setDeleteDialog({ open: true, id, filePath });
  };

  const handleDeleteConfirm = async () => {
    await deleteMaterial(deleteDialog.id, deleteDialog.filePath);
    setDeleteDialog({ open: false, id: "", filePath: "" });
  };

  // Filter materials from local state for drag support
  const filteredMaterials = localMaterials.filter((material) => {
    // Category filter
    if (selectedCategory && material.category_id !== selectedCategory) {
      return false;
    }

    // Tags filter (material must have all selected tags)
    if (selectedTags.length > 0) {
      const materialTagIds = material.tags?.map((t) => t.id) || [];
      if (!selectedTags.every((tagId) => materialTagIds.includes(tagId))) {
        return false;
      }
    }

    return true;
  });

  const handleReorder = (reorderedMaterials: Material[]) => {
    setLocalMaterials(reorderedMaterials);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">我的资料</h1>
        <p className="text-muted-foreground mt-1">
          查看和管理你的所有学习资料
        </p>
      </div>

      {(materials.length > 0 || categories.length > 0) && (
        <MaterialFilters
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          onCategoryChange={setSelectedCategory}
          onTagToggle={handleTagToggle}
          onClearFilters={handleClearFilters}
          editableCategories={true}
          onCategoriesRefresh={refetchCategories}
        />
      )}

      {materials.length === 0 ? (
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
      ) : filteredMaterials.length === 0 ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">无匹配资料</h3>
            <p className="text-muted-foreground text-center mb-4">
              没有找到符合筛选条件的资料
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              清除筛选条件
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SortableMaterialsGrid
          materials={filteredMaterials}
          categories={categories}
          onDelete={handleDeleteClick}
          onSave={updateMaterial}
          onPreview={setPreviewMaterial}
          onReorder={handleReorder}
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
    </div>
  );
}
