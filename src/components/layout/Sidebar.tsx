import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  UserCog,
  BarChart3,
  ChevronLeft,
  Tv
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'gerente', 'funcionario']
  },
  {
    title: 'Filiais',
    url: '/filiais',
    icon: Building2,
    roles: ['admin']
  },
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
    roles: ['admin', 'gerente', 'funcionario']
  },
  {
    title: 'Mensalidades',
    url: '/mensalidades',
    icon: CreditCard,
    roles: ['admin', 'gerente', 'funcionario']
  },
  {
    title: 'Usuários',
    url: '/usuarios',
    icon: UserCog,
    roles: ['admin', 'gerente']
  },
  {
    title: 'Relatórios',
    url: '/relatorios',
    icon: BarChart3,
    roles: ['admin', 'gerente']
  }
];

export function AppSidebar() {
  const { open } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const currentPath = location.pathname;
  const collapsed = !open;

  const filteredMenuItems = menuItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  const getNavCls = (path: string) => {
    const baseClasses = "w-full justify-start transition-colors";
    return isActive(path) 
      ? `${baseClasses} bg-sidebar-accent text-sidebar-accent-foreground font-medium`
      : `${baseClasses} text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground`;
  };

  return (
    <Sidebar
      className={`${collapsed ? 'w-14' : 'w-64'} transition-all duration-300 bg-sidebar border-sidebar-border`}
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center">
              <Tv className="w-5 h-5 text-sidebar-accent-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">Chitumba</h2>
                <p className="text-xs text-sidebar-foreground/70">TV Comunitária</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-2">
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium px-2 py-2">
              MENU PRINCIPAL
            </SidebarGroupLabel>
          )}
          
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavCls(item.url)}>
                      <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} flex-shrink-0`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}