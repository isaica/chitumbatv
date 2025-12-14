import { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen min-h-[100dvh] flex w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          <Header />
          <div className="flex-1 p-2 sm:p-4 lg:p-6 pb-safe">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}