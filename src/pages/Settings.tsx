import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { User, Mail, Palette, FolderTree, Tags } from 'lucide-react';
import { CategoryManager } from '@/components/categories/CategoryManager';
import { TagManager } from '@/components/tags/TagManager';

export default function Settings() {
  const { user } = useAuth();

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
            <Palette className="h-5 w-5 text-secondary" />
            外观设置
          </CardTitle>
          <CardDescription>自定义应用的外观主题</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">主题切换功能即将推出...</p>
        </CardContent>
      </Card>
    </div>
  );
}
