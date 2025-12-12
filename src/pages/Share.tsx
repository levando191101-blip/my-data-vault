import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Download, Eye, FileText, Image, Video, Music, File, Loader2, AlertCircle } from 'lucide-react';

interface ShareData {
  id: string;
  share_code: string;
  password: string | null;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number | null;
  allow_preview: boolean | null;
  allow_download: boolean | null;
  material_id: string;
}

interface MaterialData {
  id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  mime_type: string | null;
}

export default function Share() {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [materialData, setMaterialData] = useState<MaterialData | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (code) {
      loadShareData();
    }
  }, [code]);

  const loadShareData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch share data
      const { data: share, error: shareError } = await supabase
        .from('shares')
        .select('*')
        .eq('share_code', code)
        .single();

      if (shareError || !share) {
        setError('分享链接无效或已被删除');
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        setError('分享链接已过期');
        setIsLoading(false);
        return;
      }

      // Check download limit
      if (share.max_downloads && (share.download_count || 0) >= share.max_downloads) {
        setError('已达到最大下载次数');
        setIsLoading(false);
        return;
      }

      setShareData(share);

      // Check if password is required
      if (share.password) {
        setRequiresPassword(true);
        setIsLoading(false);
        return;
      }

      // No password required, load material data
      await loadMaterialData(share.material_id);
      setIsVerified(true);
    } catch (err) {
      console.error('Error loading share:', err);
      setError('加载失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMaterialData = async (materialId: string) => {
    const { data: material, error: materialError } = await supabase
      .from('materials')
      .select('id, title, file_name, file_type, file_size, file_path, mime_type')
      .eq('id', materialId)
      .single();

    if (materialError || !material) {
      setError('文件不存在或已被删除');
      return;
    }

    setMaterialData(material);
  };

  const handleVerifyPassword = async () => {
    if (!shareData || !passwordInput) return;

    if (passwordInput === shareData.password) {
      await loadMaterialData(shareData.material_id);
      setIsVerified(true);
      setRequiresPassword(false);
    } else {
      toast({
        title: '密码错误',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async () => {
    if (!materialData || !shareData?.allow_download) return;

    setIsDownloading(true);
    try {
      // Get signed URL for download
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('materials')
        .createSignedUrl(materialData.file_path, 3600);

      if (urlError || !signedUrlData) {
        throw new Error('Failed to get download URL');
      }

      // Increment download count
      await supabase
        .from('shares')
        .update({ download_count: (shareData.download_count || 0) + 1 })
        .eq('id', shareData.id);

      // Trigger download
      const link = document.createElement('a');
      link.href = signedUrlData.signedUrl;
      link.download = materialData.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '下载已开始',
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: '下载失败',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = async () => {
    if (!materialData || !shareData?.allow_preview) return;

    try {
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('materials')
        .createSignedUrl(materialData.file_path, 3600);

      if (urlError || !signedUrlData) {
        throw new Error('Failed to get preview URL');
      }

      setPreviewUrl(signedUrlData.signedUrl);
    } catch (err) {
      console.error('Preview error:', err);
      toast({
        title: '预览失败',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-12 w-12 text-primary" />;
      case 'video':
        return <Video className="h-12 w-12 text-primary" />;
      case 'audio':
        return <Music className="h-12 w-12 text-primary" />;
      case 'document':
        return <FileText className="h-12 w-12 text-primary" />;
      default:
        return <File className="h-12 w-12 text-primary" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderPreview = () => {
    if (!previewUrl || !materialData) return null;

    const mimeType = materialData.mime_type || '';

    if (mimeType.startsWith('image/')) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border">
          <img src={previewUrl} alt={materialData.title} className="max-w-full h-auto" />
        </div>
      );
    }

    if (mimeType.startsWith('video/')) {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border">
          <video controls className="w-full">
            <source src={previewUrl} type={mimeType} />
          </video>
        </div>
      );
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <div className="mt-4">
          <audio controls className="w-full">
            <source src={previewUrl} type={mimeType} />
          </audio>
        </div>
      );
    }

    if (mimeType === 'application/pdf') {
      return (
        <div className="mt-4 rounded-lg overflow-hidden border h-[600px]">
          <iframe src={previewUrl} className="w-full h-full" />
        </div>
      );
    }

    return (
      <p className="mt-4 text-sm text-muted-foreground">
        此文件类型不支持在线预览，请下载后查看
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>访问失败</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (requiresPassword && !isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>需要密码</CardTitle>
            <CardDescription>此分享链接需要密码才能访问</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="请输入访问密码"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPassword()}
            />
            <Button onClick={handleVerifyPassword} className="w-full">
              验证
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isVerified && materialData) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              {getFileIcon(materialData.file_type)}
              <CardTitle className="mt-4">{materialData.title}</CardTitle>
              <CardDescription>
                {materialData.file_name} • {formatFileSize(materialData.file_size)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 justify-center">
                {shareData?.allow_preview && (
                  <Button variant="outline" onClick={handlePreview}>
                    <Eye className="mr-2 h-4 w-4" />
                    预览
                  </Button>
                )}
                {shareData?.allow_download && (
                  <Button onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    下载
                  </Button>
                )}
              </div>

              {renderPreview()}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
