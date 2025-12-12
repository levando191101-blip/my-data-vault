import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMaterials } from '@/hooks/useMaterials';
import { useDataExport } from '@/hooks/useDataExport';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Mail, Palette, FolderTree, Tags, Download, FileJson, FileSpreadsheet, Archive, Share2 } from 'lucide-react';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { TagManager } from '@/components/tags/TagManager';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShareManager } from '@/components/shares/ShareManager';

export default function Settings() {
  const { user } = useAuth();
  const { materials } = useMaterials();
  const { exporting, exportAsCSV, exportAsJSON, exportAllFiles } = useDataExport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">设置</h1>
        <p className="text-muted-foreground mt-1">管理你的账户和偏好设置</p>
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            个人信息
          </CardTitle>
          <CardDescription>查看和更新你的个人资料</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              邮箱
            </Label>
            <Input 
              id="email" 
              value={user?.email || ''} 
              disabled 
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              昵称
            </Label>
            <Input 
              id="displayName" 
              defaultValue={user?.user_metadata?.display_name || ''} 
              placeholder="设置你的昵称"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            分类管理
          </CardTitle>
          <CardDescription>创建和管理资料分类文件夹</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager />
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-secondary" />
            标签管理
          </CardTitle>
          <CardDescription>创建和管理资料标签</CardDescription>
        </CardHeader>
        <CardContent>
          <TagManager />
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            分享管理
          </CardTitle>
          <CardDescription>查看和管理已创建的分享链接</CardDescription>
        </CardHeader>
        <CardContent>
          <ShareManager />
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-secondary" />
            外观设置
          </CardTitle>
          <CardDescription>自定义应用的外观主题</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>主题模式</Label>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            数据导出
          </CardTitle>
          <CardDescription>导出你的资料数据和文件</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              variant="outline"
              onClick={() => exportAsCSV(materials)}
              disabled={exporting || materials.length === 0}
              className="justify-start gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              导出为 CSV
              <span className="ml-auto text-xs text-muted-foreground">
                {materials.length} 条记录
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => exportAsJSON(materials)}
              disabled={exporting || materials.length === 0}
              className="justify-start gap-2"
            >
              <FileJson className="h-4 w-4" />
              导出为 JSON
              <span className="ml-auto text-xs text-muted-foreground">
                {materials.length} 条记录
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={() => exportAllFiles(materials)}
              disabled={exporting || materials.length === 0}
              className="justify-start gap-2"
            >
              <Archive className="h-4 w-4" />
              下载所有文件
              <span className="ml-auto text-xs text-muted-foreground">
                {materials.length} 个文件
              </span>
            </Button>
          </div>
          {exporting && (
            <p className="text-sm text-muted-foreground">正在导出...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
