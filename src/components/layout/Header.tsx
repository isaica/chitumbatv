import { Bell, Search, User, LogOut, Settings, Menu, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { GlobalSearch } from './GlobalSearch';
import { NotificationDropdown } from './NotificationDropdown';
import { MobileSearch } from './MobileSearch';
import { ThemeToggle } from '@/components/ThemeToggle';


export function Header() {
  const { user, logout } = useAuth();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center justify-between h-full px-2 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground h-9 w-9 sm:h-10 sm:w-10" />
          
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-2">
          {/* Mobile Search */}
          <MobileSearch />
          
          <ThemeToggle />
          
          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-1.5 sm:px-2 h-9 sm:h-10">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm font-medium">
                    {user ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium leading-tight truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {user ? getInitials(user.name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    <Badge variant="outline" className="w-fit mt-1.5 text-[10px]">
                      {user?.role === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" />
                          Administrador
                        </>
                      ) : user?.role === 'gerente' ? 'Gerente' : 'Funcionário'}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive py-2.5">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}