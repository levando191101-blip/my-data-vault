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

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "prismjs/themes/prism-tomorrow.css";

// Helper component for Markdown and Code preview
function MarkdownOrCodePreview({ url, isMarkdown, fileName }: { url: string; isMarkdown: boolean; fileName: string }) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        setContent(text);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch content:", err);
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-muted/30 rounded-lg max-h-[70vh] overflow-auto">
      {isMarkdown ? (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <div>
          <div className="text-sm text-muted-foreground mb-2 font-mono">{fileName}</div>
          <pre className="language-javascript overflow-x-auto">
            <code>{content}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

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
  const isVideo = material.file_type === "video" || material.mime_type?.startsWith("video/");
  const isAudio = material.file_type === "audio" || material.mime_type?.startsWith("audio/");
  const isMarkdown = material.file_name.endsWith(".md") || material.file_name.endsWith(".markdown");
  const isCode = /\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|html|json|xml|yaml|yml|sh|bash)$/i.test(material.file_name);
  const canPreview = isImage || isPdf || isVideo || isAudio || isMarkdown || isCode;

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
              {isVideo && (
                <div className="flex items-center justify-center h-full bg-black rounded-lg">
                  <video
                    src={signedUrl}
                    controls
                    className="w-full h-auto max-h-[70vh]"
                  />
                </div>
              )}
              {isAudio && (
                <div className="flex items-center justify-center h-64">
                  <audio
                    src={signedUrl}
                    controls
                    className="w-full"
                  />
                </div>
              )}
              {(isMarkdown || isCode) && (
                <MarkdownOrCodePreview
                  url={signedUrl}
                  isMarkdown={isMarkdown}
                  fileName={material.file_name}
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