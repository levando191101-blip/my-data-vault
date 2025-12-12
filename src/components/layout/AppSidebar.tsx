import { Home, Upload, FolderOpen, Search, Settings, LogOut, BookOpen, Sun, Moon, Trash2 } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from 'next-themes';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const mainNavItems = [
  { title: '首页', url: '/', icon: Home },
  { title: '上传', url: '/upload', icon: Upload },
  { title: '我的资料', url: '/materials', icon: FolderOpen },
  { title: '搜索', url: '/search', icon: Search },
  { title: '回收站', url: '/trash', icon: Trash2 },
];

const settingsItems = [
  { title: '设置', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const getInitials = () => {
    if (!user?.user_metadata?.display_name) {
      return user?.email?.charAt(0).toUpperCase() || 'U';
    }
    return user.user_metadata.display_name.charAt(0).toUpperCase();
  };

  return (
    <Sidebar className="!bg-background/60 backdrop-blur-xl border-r border-white/10" variant="sidebar" collapsible="icon">
      <SidebarHeader className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3 transition-all duration-300 group-data-[collapsible=icon]:justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-105 shrink-0">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden space-y-0.5">
            <h2 className="font-semibold text-foreground tracking-tight">学习资料</h2>
            <p className="text-xs text-muted-foreground/80 truncate">知识管理中心</p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors group-data-[collapsible=icon]:hidden"
              >
                {resolvedTheme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {resolvedTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            </TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/60 px-2 mb-2 group-data-[collapsible=icon]:hidden uppercase text-[10px] show tracking-wider">主菜单</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === '/'}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm"
                      activeClassName="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium shadow-sm border border-primary/10"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-muted-foreground/60 px-2 mb-2 group-data-[collapsible=icon]:hidden uppercase text-[10px] tracking-wider">系统</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:shadow-sm"
                      activeClassName="bg-gradient-to-r from-primary/10 to-secondary/10 text-primary font-medium shadow-sm border border-primary/10"
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9 ring-2 ring-background transition-transform hover:scale-105">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-medium">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.user_metadata?.display_name || '用户'}
            </p>
            <p className="text-xs text-muted-foreground/70 truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
