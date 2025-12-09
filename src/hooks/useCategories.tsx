import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Category {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) return;
    
    // Only show loading on initial fetch (when no data exists)
    if (categories.length === 0) {
      setLoading(true);
    }
    const { data, error } = await supabase
      .from("categories" as any)
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "获取分类失败",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCategories((data as unknown as Category[]) || []);
    }
    setLoading(false);
  };

  const createCategory = async (name: string, parentId?: string | null) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("categories" as any)
      .insert({
        name,
        user_id: user.id,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "创建分类失败",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    toast({ title: "分类创建成功" });
    await fetchCategories();
    return data as unknown as Category;
  };

  const updateCategory = async (id: string, name: string) => {
    const { error } = await supabase
      .from("categories" as any)
      .update({ name })
      .eq("id", id);

    if (error) {
      toast({
        title: "更新分类失败",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "分类更新成功" });
    await fetchCategories();
    return true;
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("categories" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "删除分类失败",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "分类已删除" });
    await fetchCategories();
    return true;
  };

  useEffect(() => {
    fetchCategories();
  }, [user?.id]);

  return {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  };
}
