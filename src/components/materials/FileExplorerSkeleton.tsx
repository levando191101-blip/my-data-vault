import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FileExplorerSkeletonProps {
  viewMode?: "grid" | "list";
  itemCount?: number;
}

/**
 * 文件浏览器骨架屏
 * 在数据加载时显示，避免白屏等待
 */
export function FileExplorerSkeleton({ 
  viewMode = "grid", 
  itemCount = 12 
}: FileExplorerSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* 顶部工具栏骨架 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" /> {/* 面包屑 */}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" /> {/* 视图切换 */}
          <Skeleton className="h-9 w-9" /> {/* 排序 */}
          <Skeleton className="h-9 w-24" /> {/* 选择按钮 */}
        </div>
      </div>

      {/* 文件夹列表骨架 */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-24" /> {/* "文件夹" 标题 */}
        <div className={cn(
          viewMode === "grid"
            ? "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-2"
        )}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`folder-${i}`} className="hover:shadow-md transition-all">
              <CardContent className="p-3 flex items-center gap-3">
                <Skeleton className="h-4 w-4" /> {/* 拖拽图标 */}
                <Skeleton className="h-10 w-10 rounded-lg" /> {/* 文件夹图标 */}
                <Skeleton className="h-4 flex-1" /> {/* 文件夹名称 */}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 文件列表骨架 */}
      <div className="space-y-3">
        <Skeleton className="h-6 w-20" /> {/* "文件" 标题 */}
        <div className={cn(
          viewMode === "grid"
            ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            : "space-y-2"
        )}>
          {Array.from({ length: itemCount }).map((_, i) => (
            <Card key={`file-${i}`} className="group hover:shadow-xl transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* 文件图标 */}
                  <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
                  
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* 文件标题 */}
                    <Skeleton className="h-5 w-3/4" />
                    {/* 文件名 */}
                    <Skeleton className="h-4 w-full" />
                    {/* 文件信息（大小、日期、标签） */}
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-5 w-12 rounded-full" />
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <Skeleton className="h-9 w-9 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 简化版骨架屏（用于快速加载场景）
 */
export function FileExplorerSkeletonCompact() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

