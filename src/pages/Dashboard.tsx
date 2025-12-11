import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FolderOpen, Upload, FileText, Video, Image, BookOpen, 
  TrendingUp, Clock, Search, Zap, ChevronRight 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user } = useAuth();
  
  const displayName = user?.user_metadata?.display_name || '同学';

  const stats = [
    { 
      title: '全部资料', 
      count: 0, 
      icon: FolderOpen, 
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
      iconColor: 'text-violet-600 dark:text-violet-400',
      trend: '+12%'
    },
    { 
      title: '文档', 
      count: 0, 
      icon: FileText, 
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      trend: '+8%'
    },
    { 
      title: '视频', 
      count: 0, 
      icon: Video, 
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: '+15%'
    },
    { 
      title: '图片', 
      count: 0, 
      icon: Image, 
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20',
      iconColor: 'text-amber-600 dark:text-amber-400',
      trend: '+5%'
    },
  ];

  const quickActions = [
    {
      title: '上传资料',
      description: '添加新的学习材料',
      icon: Upload,
      href: '/upload',
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'bg-gradient-to-br from-violet-500/20 to-purple-600/20',
      iconColor: 'text-violet-600 dark:text-violet-400'
    },
    {
      title: '浏览资料',
      description: '查看所有资料',
      icon: FolderOpen,
      href: '/materials',
      gradient: 'from-cyan-500 to-blue-600',
      iconBg: 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400'
    },
    {
      title: '搜索资料',
      description: '快速查找',
      icon: Search,
      href: '/search',
      gradient: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-600/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: '最近使用',
      description: '查看历史记录',
      icon: Clock,
      href: '#',
      gradient: 'from-amber-500 to-orange-600',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-600/20',
      iconColor: 'text-amber-600 dark:text-amber-400'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner - Glass Morphism */}
      <div className="banner-glass">
        {/* Background Decorations */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.05),transparent_50%)]" />
        
        {/* Content */}
        <div className="relative flex items-center gap-6">
          <div className="banner-icon-glow animate-pulse-slow">
            <BookOpen className="h-10 w-10 text-white drop-shadow-lg" />
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              你好，{displayName}！
            </h1>
            <p className="text-white/90 mt-2 text-lg drop-shadow">
              欢迎使用学习资料管理系统
            </p>
          </div>
          {/* Decorative Elements */}
          <div className="hidden lg:flex gap-2">
            <div className="h-16 w-1 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="h-16 w-1 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="h-16 w-1 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>

      {/* Stats Grid - Modern Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="group stat-card-modern"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Hover Gradient Background */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br rounded-2xl",
              stat.gradient
            )} />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                {/* Trend Indicator */}
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full bg-emerald-500/10">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </div>
              </div>
              
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    {stat.count}
                  </div>
                </div>
                
                {/* Icon with Glow Effect */}
                <div className={cn(
                  "stat-card-icon",
                  stat.iconBg
                )}>
                  <stat.icon className={cn("h-6 w-6 transition-transform group-hover:rotate-12", stat.iconColor)} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Action Cards Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Zap className="h-6 w-6 text-amber-500 animate-pulse" />
          快速操作
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <a
              key={action.title}
              href={action.href}
              className="group relative rounded-2xl p-6 bg-card border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover Gradient Background */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br",
                action.gradient
              )} />
              
              <div className="relative">
                <div className={cn(
                  "inline-flex rounded-xl p-3 mb-4 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
                  action.iconBg
                )}>
                  <action.icon className={cn("h-6 w-6", action.iconColor)} />
                </div>
                
                <h3 className="font-semibold text-lg mb-1 group-hover:text-foreground transition-colors">
                  {action.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {action.description}
                </p>
              </div>
              
              {/* Arrow Indicator */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            最近活动
          </CardTitle>
          <CardDescription>你最近的操作记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">暂无活动记录</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
