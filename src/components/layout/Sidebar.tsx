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
  Tv,
  BadgeDollarSign
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
import { mockClients, mockMensalidades } from '@/data/mock';
import { calculateClientPaymentStatus } from '@/utils/paymentStatus';
import { Badge } from '@/components/ui/badge';
import { loadOrInit } from '@/services/storage';
import { Client, Mensalidade } from '@/types';

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
    title: 'Preços',
    url: '/precos',
    icon: BadgeDollarSign,
    roles: ['admin']
  },
  {
    title: 'Clientes',
    url: '/clientes',
    icon: Users,
    roles: ['admin', 'gerente', 'funcionario'],
    badge: true
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

  // Load data from storage
  const clients = loadOrInit<Client[]>('clients', mockClients);
  const mensalidades = loadOrInit<Mensalidade[]>('mensalidades', mockMensalidades);

  // Calculate badges
  const userFilialClients = user?.role === 'admin' 
    ? clients 
    : clients.filter(c => c.filialId === user?.filialId);

  // Count clients with payment issues (Kilapeiros)
  const clientsWithIssues = userFilialClients.filter(client => {
    const clientMensalidades = mensalidades.filter(m => m.clientId === client.id);
    const status = calculateClientPaymentStatus(client, clientMensalidades);
    return status.status === 'kilapeiro';
  }).length;

  const getBadgeCount = (title: string) => {
    if (title === 'Clientes') return clientsWithIssues;
    return 0;
  };

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
      side="left"
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
              {filteredMenuItems.map((item) => {
                const badgeCount = item.badge ? getBadgeCount(item.title) : 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls(item.url)}>
                        <item.icon className={`${collapsed ? 'w-5 h-5' : 'w-4 h-4 mr-3'} flex-shrink-0`} />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {badgeCount > 0 && (
                              <Badge 
                                variant="destructive" 
                                className="ml-2 h-5 min-w-[20px] flex items-center justify-center px-1.5"
                              >
                                {badgeCount}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}