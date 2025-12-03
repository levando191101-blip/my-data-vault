import { Card, CardContent } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Materials() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">我的资料</h1>
        <p className="text-muted-foreground mt-1">查看和管理你的所有学习资料</p>
      </div>

      <Card className="border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">暂无资料</h3>
          <p className="text-muted-foreground text-center mb-4">
            你还没有上传任何学习资料
          </p>
          <Button asChild>
            <Link to="/upload">开始上传</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
