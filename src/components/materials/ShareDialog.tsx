import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { CalendarIcon, Copy, Link, Lock, Download, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialId: string;
  materialTitle: string;
}

export function ShareDialog({ open, onOpenChange, materialId, materialTitle }: ShareDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [shareCode, setShareCode] = useState<string | null>(null);
  
  // Share settings
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [useExpiry, setUseExpiry] = useState(false);
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(undefined);
  const [useMaxDownloads, setUseMaxDownloads] = useState(false);
  const [allowPreview, setAllowPreview] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);

  const generateShareCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreateShare = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: '请先登录',
          variant: 'destructive',
        });
        return;
      }

      const code = generateShareCode();
      
      const { data, error } = await supabase
        .from('shares')
        .insert({
          material_id: materialId,
          user_id: user.id,
          share_code: code,
          password: usePassword && password ? password : null,
          expires_at: useExpiry && expiresAt ? expiresAt.toISOString() : null,
          max_downloads: useMaxDownloads && maxDownloads ? maxDownloads : null,
          allow_preview: allowPreview,
          allow_download: allowDownload,
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/share/${code}`;
      setShareLink(link);
      setShareCode(code);

      toast({
        title: '分享链接已创建',
        description: '链接已复制到剪贴板',
      });

      await navigator.clipboard.writeText(link);
    } catch (error) {
      console.error('Error creating share:', error);
      toast({
        title: '创建分享失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (shareLink) {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: '链接已复制',
      });
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setShareLink(null);
    setShareCode(null);
    setPassword('');
    setUsePassword(false);
    setExpiresAt(undefined);
    setUseExpiry(false);
    setMaxDownloads(undefined);
    setUseMaxDownloads(false);
    setAllowPreview(true);
    setAllowDownload(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            分享文件
          </DialogTitle>
          <DialogDescription>
            为 "{materialTitle}" 创建分享链接
          </DialogDescription>
        </DialogHeader>

        {!shareLink ? (
          <div className="space-y-6">
            {/* Password Protection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="use-password">密码保护</Label>
                </div>
                <Switch
                  id="use-password"
                  checked={usePassword}
                  onCheckedChange={setUsePassword}
                />
              </div>
              {usePassword && (
                <Input
                  type="password"
                  placeholder="设置访问密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
            </div>

            {/* Expiration Date */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="use-expiry">设置过期时间</Label>
                </div>
                <Switch
                  id="use-expiry"
                  checked={useExpiry}
                  onCheckedChange={setUseExpiry}
                />
              </div>
              {useExpiry && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !expiresAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {expiresAt ? format(expiresAt, "PPP", { locale: zhCN }) : "选择过期日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={expiresAt}
                      onSelect={setExpiresAt}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Max Downloads */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="use-max-downloads">限制下载次数</Label>
                </div>
                <Switch
                  id="use-max-downloads"
                  checked={useMaxDownloads}
                  onCheckedChange={setUseMaxDownloads}
                />
              </div>
              {useMaxDownloads && (
                <Input
                  type="number"
                  min={1}
                  placeholder="最大下载次数"
                  value={maxDownloads || ''}
                  onChange={(e) => setMaxDownloads(e.target.value ? parseInt(e.target.value) : undefined)}
                />
              )}
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="allow-preview">允许预览</Label>
                </div>
                <Switch
                  id="allow-preview"
                  checked={allowPreview}
                  onCheckedChange={setAllowPreview}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="allow-download">允许下载</Label>
                </div>
                <Switch
                  id="allow-download"
                  checked={allowDownload}
                  onCheckedChange={setAllowDownload}
                />
              </div>
            </div>

            <Button 
              onClick={handleCreateShare} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  创建分享链接
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <Label className="text-xs text-muted-foreground">分享链接</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  readOnly
                  value={shareLink}
                  className="bg-background"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {usePassword && password && (
              <div className="rounded-lg border bg-muted/50 p-4">
                <Label className="text-xs text-muted-foreground">访问密码</Label>
                <p className="mt-1 font-mono text-sm">{password}</p>
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              {useExpiry && expiresAt && (
                <p>• 过期时间: {format(expiresAt, "PPP", { locale: zhCN })}</p>
              )}
              {useMaxDownloads && maxDownloads && (
                <p>• 最大下载次数: {maxDownloads}</p>
              )}
              <p>• 允许预览: {allowPreview ? '是' : '否'}</p>
              <p>• 允许下载: {allowDownload ? '是' : '否'}</p>
            </div>

            <Button onClick={handleClose} variant="outline" className="w-full">
              完成
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
