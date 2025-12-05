import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTags = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("tags" as any)
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "获取标签失败",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTags((data as unknown as Tag[]) || []);
    }
    setLoading(false);
  };

  const createTag = async (name: string, color: string = "#3b82f6") => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("tags" as any)
      .insert({
        name,
        color,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "创建标签失败",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    toast({ title: "标签创建成功" });
    await fetchTags();
    return data as unknown as Tag;
  };

  const updateTag = async (id: string, name: string, color: string) => {
    const { error } = await supabase
      .from("tags" as any)
      .update({ name, color })
      .eq("id", id);

    if (error) {
      toast({
        title: "更新标签失败",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "标签更新成功" });
    await fetchTags();
    return true;
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase
      .from("tags" as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "删除标签失败",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }

    toast({ title: "标签已删除" });
    await fetchTags();
    return true;
  };

  useEffect(() => {
    fetchTags();
  }, [user]);

  return {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    refetch: fetchTags,
  };
}
