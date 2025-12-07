import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MobileTableProps {
  data: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function MobileTable({ data, renderCard, emptyMessage = "Nenhum item encontrado", className }: MobileTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function MobileCard({ children, className, actions }: MobileCardProps) {
  return (
    <Card className={`p-4 ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {actions && (
          <div className="ml-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </Card>
  );
}

interface MobileActionMenuProps {
  actions: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }[];
}

export function MobileActionMenu({ actions }: MobileActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={action.onClick}
            className={action.variant === 'destructive' ? 'text-destructive' : ''}
          >
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  const getVariant = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('ativo') || statusLower.includes('pago')) return 'default';
    if (statusLower.includes('inativo') || statusLower.includes('suspenso')) return 'destructive';
    if (statusLower.includes('pendente') || statusLower.includes('atrasado')) return 'secondary';
    return variant;
  };

  return (
    <Badge variant={getVariant(status)} className="text-xs">
      {status}
    </Badge>
  );
}