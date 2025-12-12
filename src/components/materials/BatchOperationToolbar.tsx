import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  FolderOpen, 
  Download, 
  X, 
  Tags,
  CheckSquare,
  Square
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BatchOperationToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
  onBatchMove: () => void;
  onBatchDownload: () => void;
  onBatchTags: () => void;
  isAllSelected: boolean;
}

export function BatchOperationToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBatchDelete,
  onBatchMove,
  onBatchDownload,
  onBatchTags,
  isAllSelected,
}: BatchOperationToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 backdrop-blur-sm border-y border-border/50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              已选择 <span className="text-primary font-bold">{selectedCount}</span> 项
            </span>

            <div className="h-4 w-px bg-border" />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isAllSelected ? onDeselectAll : onSelectAll}
                    className="gap-2"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                    {isAllSelected ? "取消全选" : "全选"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isAllSelected ? `取消选择所有 ${totalCount} 项` : `选择所有 ${totalCount} 项`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <span className="text-xs text-muted-foreground">
              提示：右键可快速操作单个文件
            </span>
          </div>

          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBatchTags}
                    className="gap-2 hover:bg-blue-500/10 hover:border-blue-500/50 hover:text-blue-600 transition-all"
                  >
                    <Tags className="h-4 w-4" />
                    标签
                  </Button>
                </TooltipTrigger>
                <TooltipContent>批量编辑标签</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBatchMove}
                    className="gap-2 hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-amber-600 transition-all"
                  >
                    <FolderOpen className="h-4 w-4" />
                    移动
                  </Button>
                </TooltipTrigger>
                <TooltipContent>批量移动到分类</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBatchDownload}
                    className="gap-2 hover:bg-green-500/10 hover:border-green-500/50 hover:text-green-600 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    下载
                  </Button>
                </TooltipTrigger>
                <TooltipContent>批量下载</TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-border" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onBatchDelete}
                    className="gap-2 hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    删除
                  </Button>
                </TooltipTrigger>
                <TooltipContent>批量删除</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDeselectAll}
                    className="gap-1 hover:bg-destructive/10 hover:border-destructive/50"
                  >
                    <X className="h-4 w-4" />
                    清除选择
                  </Button>
                </TooltipTrigger>
                <TooltipContent>清除所有选择（ESC 键快捷键）</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </div>
  );
}

