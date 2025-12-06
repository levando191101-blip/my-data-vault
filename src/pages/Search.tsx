import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search as SearchIcon } from 'lucide-react';
import { useMaterials } from '@/hooks/useMaterials';
import { MaterialCard } from '@/components/materials/MaterialCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<{ id: string; filePath: string } | null>(null);
  const { materials, loading, deleteMaterial } = useMaterials();

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return materials.filter(material => 
      material.title.toLowerCase().includes(query) ||
      material.file_name.toLowerCase().includes(query)
    );
  }, [searchQuery, materials]);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMaterial(deleteId.id, deleteId.filePath);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">搜索</h1>
        <p className="text-muted-foreground mt-1">快速找到你需要的学习资料</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="搜索资料标题、文件名..." 
          className="pl-10 h-12 text-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground">加载中...</p>
          </CardContent>
        </Card>
      ) : searchQuery.trim() === '' ? (
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
      ) : searchResults.length === 0 ? (
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-4">
              <SearchIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">未找到结果</h3>
            <p className="text-muted-foreground text-center">
              没有找到匹配 "{searchQuery}" 的资料
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            找到 {searchResults.length} 个结果
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {searchResults.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onDelete={(id, filePath) => setDeleteId({ id, filePath })}
              />
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个资料吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
