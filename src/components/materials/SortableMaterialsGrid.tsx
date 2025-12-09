import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Material } from "@/hooks/useMaterials";
import { Category } from "@/hooks/useCategories";
import { DraggableMaterialCard } from "./DraggableMaterialCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SortableMaterialsGridProps {
  materials: Material[];
  categories: Category[];
  onDelete: (id: string, filePath: string) => void;
  onSave: (id: string, data: { title: string; categoryId: string | null; tagIds: string[] }) => Promise<boolean>;
  onPreview?: (material: Material) => void;
  onReorder: (materials: Material[]) => void;
}

export function SortableMaterialsGrid({
  materials,
  categories,
  onDelete,
  onSave,
  onPreview,
  onReorder,
}: SortableMaterialsGridProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = materials.findIndex((m) => m.id === active.id);
      const newIndex = materials.findIndex((m) => m.id === over.id);

      const newMaterials = arrayMove(materials, oldIndex, newIndex);
      onReorder(newMaterials);

      // Update sort_order in database
      setIsSaving(true);
      try {
        const updates = newMaterials.map((m, index) => ({
          id: m.id,
          sort_order: index,
        }));

        for (const update of updates) {
          await supabase
            .from("materials")
            .update({ sort_order: update.sort_order })
            .eq("id", update.id);
        }
      } catch (error) {
        toast({
          title: "排序保存失败",
          description: "请重试",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={materials.map((m) => m.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => (
            <DraggableMaterialCard
              key={material.id}
              material={material}
              categories={categories}
              onDelete={onDelete}
              onSave={onSave}
              onPreview={onPreview}
            />
          ))}
        </div>
      </SortableContext>
      {isSaving && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-4 py-2 shadow-lg text-sm">
          正在保存排序...
        </div>
      )}
    </DndContext>
  );
}
