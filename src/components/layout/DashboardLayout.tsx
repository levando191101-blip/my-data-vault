import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-sidebar-accent/50 to-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <header className="h-16 border-b flex items-center px-6 bg-background/40 backdrop-blur-md sticky top-0 z-20 border-white/10 shadow-sm transition-all duration-300">
            <SidebarTrigger className="mr-4 hover:bg-primary/10 hover:text-primary transition-colors" />
          </header>
          <div className="flex-1 p-6 overflow-auto custom-scrollbar">
            {children}
            {/* Ambient background glow for content area */}
            <div className="fixed -top-[20%] -right-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
            <div className="fixed -bottom-[10%] -left-[10%] w-[30%] h-[30%] bg-secondary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
