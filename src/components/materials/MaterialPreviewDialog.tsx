import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MaterialPreviewDialogProps {
  material: Material | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialPreviewDialog({
  material,
  open,
  onOpenChange,
}: MaterialPreviewDialogProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && material) {
      setLoading(true);
      supabase.storage
        .from("materials")
        .createSignedUrl(material.file_path, 3600) // 1 hour expiry
        .then(({ data, error }) => {
          if (error || !data?.signedUrl) {
            toast({
              title: "获取预览链接失败",
              description: error?.message || "请稍后重试",
              variant: "destructive",
            });
            setSignedUrl(null);
          } else {
            setSignedUrl(data.signedUrl);
          }
          setLoading(false);
        });
    } else {
      setSignedUrl(null);
    }
  }, [open, material, toast]);

  if (!material) return null;

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (signedUrl) {
      const link = document.createElement("a");
      link.href = signedUrl;
      link.download = material.file_name;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isImage = material.file_type === "image";
  const isPdf = material.file_type === "pdf" || material.mime_type === "application/pdf";
  const canPreview = isImage || isPdf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="truncate">{material.title}</DialogTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={!signedUrl}
            >
              <Download className="mr-2 h-4 w-4" />
              下载
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : canPreview && signedUrl ? (
            <>
              {isImage && (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={signedUrl}
                    alt={material.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}
              {isPdf && (
                <iframe
                  src={signedUrl}
                  className="w-full h-[70vh] rounded-lg border"
                  title={material.title}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-lg mb-2">此文件类型不支持预览</p>
              <p className="text-sm">文件名: {material.file_name}</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={handleDownload}
                disabled={!signedUrl}
              >
                <Download className="mr-2 h-4 w-4" />
                下载文件
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}