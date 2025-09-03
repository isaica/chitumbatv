import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  History, 
  User, 
  UserPlus, 
  CreditCard, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Building,
  Settings,
  Download,
  Filter,
  Search,
  Calendar,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface ActionRecord {
  id: string;
  type: 'user' | 'client' | 'payment' | 'report' | 'filial' | 'system';
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';
  description: string;
  details?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timestamp: Date;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

interface ActionHistoryProps {
  actions: ActionRecord[];
  showFilters?: boolean;
  maxHeight?: string;
  compact?: boolean;
}

const getActionIcon = (type: string, action: string) => {
  const iconMap: Record<string, any> = {
    user: User,
    client: UserPlus,
    payment: CreditCard,
    report: FileText,
    filial: Building,
    system: Settings,
  };

  const actionIconMap: Record<string, any> = {
    create: UserPlus,
    update: Edit,
    delete: Trash2,
    view: Eye,
    export: Download,
    login: User,
    logout: User,
  };

  return actionIconMap[action] || iconMap[type] || History;
};

const getActionColor = (type: string, action: string) => {
  if (action === 'delete') return 'text-destructive';
  if (action === 'create') return 'text-green-600';
  if (action === 'update') return 'text-blue-600';
  if (action === 'view' || action === 'export') return 'text-muted-foreground';
  
  return 'text-primary';
};

const getActionBadgeVariant = (action: string) => {
  switch (action) {
    case 'create':
      return 'default';
    case 'update':
      return 'secondary';
    case 'delete':
      return 'destructive';
    case 'view':
    case 'export':
      return 'outline';
    default:
      return 'secondary';
  }
};

export function ActionHistory({ 
  actions, 
  showFilters = true, 
  maxHeight = "600px",
  compact = false 
}: ActionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Filter actions
  const filteredActions = actions.filter(action => {
    const matchesSearch = action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         action.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || action.type === typeFilter;
    const matchesAction = actionFilter === 'all' || action.action === actionFilter;
    
    let matchesTime = true;
    if (timeFilter !== 'all') {
      const now = new Date();
      const actionDate = new Date(action.timestamp);
      
      switch (timeFilter) {
        case 'today':
          matchesTime = actionDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesTime = actionDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesTime = actionDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesType && matchesAction && matchesTime;
  });

  // Group actions by date
  const groupedActions = filteredActions.reduce((groups, action) => {
    const date = new Date(action.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(action);
    return groups;
  }, {} as Record<string, ActionRecord[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toDateString();
    const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toDateString();

    if (dateString === today) return 'Hoje';
    if (dateString === yesterday) return 'Ontem';
    
    return date.toLocaleDateString('pt-AO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (compact) {
    return (
      <div className="space-y-4">
        {filteredActions.slice(0, 10).map((action) => {
          const Icon = getActionIcon(action.type, action.action);
          const color = getActionColor(action.type, action.action);
          
          return (
            <div key={action.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{action.description}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <span>{action.userName}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(action.timestamp), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Ações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showFilters && (
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="client">Clientes</SelectItem>
                <SelectItem value="payment">Pagamentos</SelectItem>
                <SelectItem value="report">Relatórios</SelectItem>
                <SelectItem value="filial">Filiais</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="create">Criar</SelectItem>
                <SelectItem value="update">Editar</SelectItem>
                <SelectItem value="delete">Excluir</SelectItem>
                <SelectItem value="view">Visualizar</SelectItem>
                <SelectItem value="export">Exportar</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <ScrollArea className={`w-full`} style={{ maxHeight }}>
          <div className="space-y-6">
            {Object.entries(groupedActions).map(([date, dayActions]) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {formatDate(date)}
                  </h4>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <div className="space-y-3 pl-6">
                  {dayActions.map((action) => {
                    const Icon = getActionIcon(action.type, action.action);
                    const color = getActionColor(action.type, action.action);
                    
                    return (
                      <div key={action.id} className="flex items-start gap-3 group">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={action.userAvatar} />
                          <AvatarFallback className="text-xs">
                            {action.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm text-foreground">{action.description}</p>
                              {action.details && (
                                <p className="text-xs text-muted-foreground mt-1">{action.details}</p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <Badge variant={getActionBadgeVariant(action.action)} className="text-xs">
                                {action.action === 'create' ? 'Criar' :
                                 action.action === 'update' ? 'Editar' :
                                 action.action === 'delete' ? 'Excluir' :
                                 action.action === 'view' ? 'Ver' :
                                 action.action === 'export' ? 'Exportar' :
                                 action.action}
                              </Badge>
                              <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(action.timestamp).toLocaleTimeString('pt-AO', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span>•</span>
                            <span>{action.userName}</span>
                            {action.ipAddress && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{action.ipAddress}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {filteredActions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma ação encontrada</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default ActionHistory;