import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Upload, FileText, Video, Image, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  
  const displayName = user?.user_metadata?.display_name || '同学';

  const stats = [
    { title: '全部资料', count: 0, icon: FolderOpen, color: 'bg-primary/10 text-primary' },
    { title: '文档', count: 0, icon: FileText, color: 'bg-secondary/10 text-secondary' },
    { title: '视频', count: 0, icon: Video, color: 'bg-emerald-500/10 text-emerald-500' },
    { title: '图片', count: 0, icon: Image, color: 'bg-accent/10 text-accent' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent p-8 text-primary-foreground">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-foreground/20">
            <BookOpen className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">你好，{displayName}！</h1>
            <p className="text-primary-foreground/80 mt-1">欢迎使用学习资料管理系统</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            快速开始
          </CardTitle>
          <CardDescription>上传你的第一份学习资料</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <a 
              href="/upload" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Upload className="h-4 w-4" />
              上传资料
            </a>
            <a 
              href="/materials" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              <FolderOpen className="h-4 w-4" />
              浏览资料
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
