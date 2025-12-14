import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MobileTableProps {
  data: any[];
  renderCard: (item: any, index: number) => React.ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function MobileTable({ data, renderCard, emptyMessage = "Nenhum item encontrado", className }: MobileTableProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {data.map((item, index) => renderCard(item, index))}
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

export function MobileCard({ children, className, actions, onClick, showChevron }: MobileCardProps) {
  return (
    <Card 
      className={cn(
        "p-3 sm:p-4 transition-colors border-0 shadow-sm",
        onClick && "cursor-pointer active:bg-muted/50 hover:bg-muted/30",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          {children}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {actions}
          {showChevron && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    </Card>
  );
}

interface MobileActionMenuProps {
  actions: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'destructive';
  }[];
}

export function MobileActionMenu({ actions }: MobileActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="w-4 h-4" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        {actions.map((action, index) => (
          <DropdownMenuItem
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              action.onClick();
            }}
            className={cn(
              "flex items-center gap-2",
              action.variant === 'destructive' && 'text-destructive focus:text-destructive'
            )}
          >
            {action.icon}
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
  size?: 'sm' | 'default';
}

export function StatusBadge({ status, variant = 'default', size = 'default' }: StatusBadgeProps) {
  const getVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('pago')) return 'default';
    if (statusLower.includes('kilapeiro') || statusLower.includes('atrasado')) return 'destructive';
    if (statusLower.includes('inativo') || statusLower.includes('suspenso')) return 'secondary';
    return variant;
  };

  return (
    <Badge 
      variant={getVariant(status)} 
      className={cn(
        "font-medium",
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      )}
    >
      {status}
    </Badge>
  );
}

interface MobileInfoRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileInfoRow({ label, value, className }: MobileInfoRowProps) {
  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, badge }: MobileHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-sm truncate">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
      {badge}
    </div>
  );
}