import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Material {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  tags?: { id: string; name: string; color: string }[];
}

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMaterials = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch materials
    const { data: materialsData, error: materialsError } = await supabase
      .from("materials")
      .select("*")
      .order("created_at", { ascending: false });

    if (materialsError) {
      toast({
        title: "获取资料失败",
        description: materialsError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch material tags
    const { data: materialTagsData } = await supabase
      .from("material_tags" as any)
      .select("material_id, tag_id");

    // Fetch all tags
    const { data: tagsData } = await supabase
      .from("tags" as any)
      .select("id, name, color");

    const tagsMap = new Map((tagsData as any[] || []).map((tag: any) => [tag.id, tag]));

    // Map tags to materials
    const materialsWithTags = (materialsData || []).map((material) => {
      const materialTags = (materialTagsData as any[] || [])
        .filter((mt: any) => mt.material_id === material.id)
        .map((mt: any) => tagsMap.get(mt.tag_id))
        .filter(Boolean);

      return {
        ...material,
        tags: materialTags,
      };
    });

    setMaterials(materialsWithTags);
    setLoading(false);
  };

  const deleteMaterial = async (id: string, filePath: string) => {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("materials")
      .remove([filePath]);

    if (storageError) {
      toast({
        title: "删除文件失败",
        description: storageError.message,
        variant: "destructive",
      });
      return false;
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("materials")
      .delete()
      .eq("id", id);

    if (dbError) {
      toast({
        title: "删除记录失败",
        description: dbError.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "资料已删除" });
    await fetchMaterials();
    return true;
  };

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  return {
    materials,
    loading,
    deleteMaterial,
    refetch: fetchMaterials,
  };
}
