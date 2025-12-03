import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">搜索</h1>
        <p className="text-muted-foreground mt-1">快速找到你需要的学习资料</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="搜索资料名称、标签..." 
          className="pl-10 h-12 text-lg"
        />
      </div>

      <Card className="border-2">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
            <SearchIcon className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">开始搜索</h3>
          <p className="text-muted-foreground text-center">
            输入关键词搜索你的学习资料
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
