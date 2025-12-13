import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Trash2, Eye, Download, Lock, Clock, ExternalLink, Pencil, CalendarIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Share {
  id: string;
  share_code: string;
  password: string | null;
  expires_at: string | null;
  max_downloads: number | null;
  download_count: number | null;
  allow_preview: boolean | null;
  allow_download: boolean | null;
  created_at: string;
  material_id: string;
  materials?: {
    title: string;
    file_name: string;
  };
}

export function ShareManager() {
  const { user } = useAuth();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareToDelete, setShareToDelete] = useState<string | null>(null);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingShare, setEditingShare] = useState<Share | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editExpiresAt, setEditExpiresAt] = useState<Date | undefined>(undefined);
  const [editMaxDownloads, setEditMaxDownloads] = useState<string>('');
  const [editAllowPreview, setEditAllowPreview] = useState(true);
  const [editAllowDownload, setEditAllowDownload] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchShares();
    }
  }, [user]);

  const fetchShares = async () => {
    try {
      const { data, error } = await supabase
        .from('shares')
        .select(`
          *,
          materials (
            title,
            file_name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShares(data || []);
    } catch (error) {
      console.error('Failed to fetch shares:', error);
      toast.error('获取分享列表失败');
    } finally {
      setLoading(false);
    }
  };

  const getShareStatus = (share: Share) => {
    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return { label: '已过期', variant: 'destructive' as const };
    }
    // Check if max downloads reached
    if (share.max_downloads && (share.download_count || 0) >= share.max_downloads) {
      return { label: '已达上限', variant: 'secondary' as const };
    }
    return { label: '有效', variant: 'default' as const };
  };

  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/share/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success('链接已复制到剪贴板');
  };

  const openShare = (shareCode: string) => {
    const url = `${window.location.origin}/share/${shareCode}`;
    window.open(url, '_blank');
  };

  const confirmDelete = (shareId: string) => {
    setShareToDelete(shareId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!shareToDelete) return;

    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareToDelete);

      if (error) throw error;

      setShares(shares.filter(s => s.id !== shareToDelete));
      toast.success('分享已删除');
    } catch (error) {
      console.error('Failed to delete share:', error);
      toast.error('删除分享失败');
    } finally {
      setDeleteDialogOpen(false);
      setShareToDelete(null);
    }
  };

  const openEditDialog = (share: Share) => {
    setEditingShare(share);
    setEditPassword(share.password || '');
    setEditExpiresAt(share.expires_at ? new Date(share.expires_at) : undefined);
    setEditMaxDownloads(share.max_downloads?.toString() || '');
    setEditAllowPreview(share.allow_preview ?? true);
    setEditAllowDownload(share.allow_download ?? true);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingShare) return;

    setSaving(true);
    try {
      const updateData: {
        password: string | null;
        expires_at: string | null;
        max_downloads: number | null;
        allow_preview: boolean;
        allow_download: boolean;
      } = {
        password: editPassword || null,
        expires_at: editExpiresAt ? editExpiresAt.toISOString() : null,
        max_downloads: editMaxDownloads ? parseInt(editMaxDownloads) : null,
        allow_preview: editAllowPreview,
        allow_download: editAllowDownload,
      };

      const { error } = await supabase
        .from('shares')
        .update(updateData)
        .eq('id', editingShare.id);

      if (error) throw error;

      // Update local state
      setShares(shares.map(s => 
        s.id === editingShare.id 
          ? { ...s, ...updateData }
          : s
      ));

      toast.success('分享设置已更新');
      setEditDialogOpen(false);
      setEditingShare(null);
    } catch (error) {
      console.error('Failed to update share:', error);
      toast.error('更新分享设置失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">加载中...</div>;
  }

  const getInvalidShares = () => {
    return shares.filter(share => {
      const status = getShareStatus(share);
      return status.variant !== 'default';
    });
  };

  const handleBatchDeleteInvalid = async () => {
    const invalidShares = getInvalidShares();
    if (invalidShares.length === 0) {
      toast.info('没有过期或失效的分享链接');
      return;
    }

    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .in('id', invalidShares.map(s => s.id));

      if (error) throw error;

      setShares(shares.filter(s => !invalidShares.some(inv => inv.id === s.id)));
      toast.success(`已删除 ${invalidShares.length} 个失效分享`);
    } catch (error) {
      console.error('Failed to batch delete shares:', error);
      toast.error('批量删除失败');
    }
  };

  if (shares.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>暂无分享记录</p>
        <p className="text-sm mt-1">在资料页面右键点击文件可创建分享链接</p>
      </div>
    );
  }

  const invalidCount = getInvalidShares().length;

  return (
    <div className="space-y-4">
      {invalidCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchDeleteInvalid}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            清理失效链接 ({invalidCount})
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>文件名</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>权限</TableHead>
            <TableHead>下载次数</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shares.map((share) => {
            const status = getShareStatus(share);
            return (
              <TableRow key={share.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {share.materials?.title || share.materials?.file_name || '未知文件'}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {share.password && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {share.allow_preview && (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    {share.allow_download && (
                      <Download className="h-4 w-4 text-muted-foreground" />
                    )}
                    {share.expires_at && (
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {share.max_downloads
                    ? `${share.download_count || 0} / ${share.max_downloads}`
                    : `${share.download_count || 0} 次`}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(share.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openShare(share.share_code)}
                      title="打开分享页面"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyShareLink(share.share_code)}
                      title="复制链接"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(share)}
                      title="编辑设置"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => confirmDelete(share.id)}
                      title="删除分享"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，此分享链接将失效，其他人将无法通过此链接访问文件。此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Share Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑分享设置</DialogTitle>
            <DialogDescription>
              修改分享链接的密码、过期时间等设置
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="edit-password">访问密码</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type="text"
                  placeholder="留空表示无密码"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
                {editPassword && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setEditPassword('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Expiration Date */}
            <div className="space-y-2">
              <Label>过期时间</Label>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !editExpiresAt && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editExpiresAt 
                        ? format(editExpiresAt, 'yyyy年MM月dd日', { locale: zhCN })
                        : '永不过期'
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editExpiresAt}
                      onSelect={setEditExpiresAt}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {editExpiresAt && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditExpiresAt(undefined)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Max Downloads */}
            <div className="space-y-2">
              <Label htmlFor="edit-max-downloads">最大下载次数</Label>
              <div className="relative">
                <Input
                  id="edit-max-downloads"
                  type="number"
                  min="1"
                  placeholder="留空表示不限制"
                  value={editMaxDownloads}
                  onChange={(e) => setEditMaxDownloads(e.target.value)}
                />
                {editMaxDownloads && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setEditMaxDownloads('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-3">
              <Label>权限设置</Label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">允许预览</span>
                </div>
                <Switch
                  checked={editAllowPreview}
                  onCheckedChange={setEditAllowPreview}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">允许下载</span>
                </div>
                <Switch
                  checked={editAllowDownload}
                  onCheckedChange={setEditAllowDownload}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
