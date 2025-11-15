import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  maxItems?: number;
}

export function Breadcrumbs({ items, maxItems = 3 }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if items not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);
  
  // Show ellipsis if we have more items than maxItems
  const shouldShowEllipsis = breadcrumbItems.length > maxItems;
  const displayItems = shouldShowEllipsis 
    ? [
        breadcrumbItems[0], // First item (Home)
        ...breadcrumbItems.slice(-maxItems + 1) // Last items
      ]
    : breadcrumbItems;

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isFirst = index === 0;
          const showEllipsis = shouldShowEllipsis && index === 1 && breadcrumbItems.length > maxItems;
          
          return (
            <div key={index} className="flex items-center">
              {showEllipsis && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.href || '/'} className="flex items-center gap-2 hover:text-foreground transition-colors">
                      {item.icon}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const pathMapping: Record<string, { label: string; icon?: React.ReactNode }> = {
    '/': { label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
    '/filiais': { label: 'Filiais' },
    '/clientes': { label: 'Clientes' },
    '/mensalidades': { label: 'Mensalidades' },
    '/usuarios': { label: 'Usuários' },
    '/relatorios': { label: 'Relatórios' },
  };

  const items: BreadcrumbItem[] = [];
  
  // Always start with home
  items.push({
    label: 'Dashboard',
    href: '/',
    icon: <Home className="w-4 h-4" />
  });

  // Add current page if it's not home
  if (pathname !== '/') {
    const currentPage = pathMapping[pathname];
    if (currentPage) {
      items.push({
        label: currentPage.label,
        icon: currentPage.icon
      });
    } else {
      // Handle dynamic routes or unknown paths
      const segments = pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      items.push({
        label: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)
      });
    }
  }

  return items;
}

// Convenience components for specific pages
export function ClientsBreadcrumbs() {
  return <Breadcrumbs />;
}

export function FilialsBreadcrumbs() {
  return <Breadcrumbs />;
}

export function MensalidadesBreadcrumbs() {
  return <Breadcrumbs />;
}

export function UsuariosBreadcrumbs() {
  return <Breadcrumbs />;
}

export function RelatoriosBreadcrumbs() {
  return <Breadcrumbs />;
}