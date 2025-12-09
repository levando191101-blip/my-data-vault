import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Material } from "@/hooks/useMaterials";
import { supabase } from "@/integrations/supabase/client";

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
  if (!material) return null;

  const { data } = supabase.storage
    .from("materials")
    .getPublicUrl(material.file_path);

  const publicUrl = data?.publicUrl;

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (publicUrl) {
      const link = document.createElement("a");
      link.href = publicUrl;
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
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              下载
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {canPreview ? (
            <>
              {isImage && publicUrl && (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={publicUrl}
                    alt={material.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  />
                </div>
              )}
              {isPdf && publicUrl && (
                <iframe
                  src={publicUrl}
                  className="w-full h-[70vh] rounded-lg border"
                  title={material.title}
                />
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <p className="text-lg mb-2">此文件类型不支持预览</p>
              <p className="text-sm">文件名: {material.file_name}</p>
              <Button variant="outline" className="mt-4" onClick={handleDownload}>
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
