import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Check, Clock, User, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface SecurityEvent {
  id: string;
  type: 'login' | 'failed_login' | 'password_change' | 'permission_change' | 'data_access';
  user: string;
  description: string;
  timestamp: Date;
  ip: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved';
}

interface SecurityMetrics {
  totalEvents: number;
  failedLogins: number;
  successfulLogins: number;
  securityAlerts: number;
  activeUsers: number;
}

export function SecurityAudit() {
  const { user } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalEvents: 0,
    failedLogins: 0,
    successfulLogins: 0,
    securityAlerts: 0,
    activeUsers: 0,
  });

  // Mock data - in real app, this would come from backend
  useEffect(() => {
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'failed_login',
        user: 'admin@chitumba.ao',
        description: 'Múltiplas tentativas de login falhadas',
        timestamp: new Date('2024-01-15T10:30:00'),
        ip: '192.168.1.100',
        severity: 'high',
        status: 'active',
      },
      {
        id: '2',
        type: 'login',
        user: 'joao@chitumba.ao',
        description: 'Login bem-sucedido',
        timestamp: new Date('2024-01-15T09:15:00'),
        ip: '192.168.1.105',
        severity: 'low',
        status: 'resolved',
      },
      {
        id: '3',
        type: 'permission_change',
        user: 'admin@chitumba.ao',
        description: 'Permissões de usuário alteradas',
        timestamp: new Date('2024-01-14T16:45:00'),
        ip: '192.168.1.100',
        severity: 'medium',
        status: 'resolved',
      },
      {
        id: '4',
        type: 'data_access',
        user: 'carlos@chitumba.ao',
        description: 'Acesso a dados sensíveis',
        timestamp: new Date('2024-01-14T14:20:00'),
        ip: '192.168.1.110',
        severity: 'medium',
        status: 'resolved',
      },
    ];

    setSecurityEvents(mockEvents);
    setMetrics({
      totalEvents: mockEvents.length,
      failedLogins: mockEvents.filter(e => e.type === 'failed_login').length,
      successfulLogins: mockEvents.filter(e => e.type === 'login').length,
      securityAlerts: mockEvents.filter(e => e.severity === 'high').length,
      activeUsers: 12,
    });
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <Check className="w-4 h-4 text-green-600" />;
      case 'failed_login': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'password_change': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'permission_change': return <User className="w-4 h-4 text-orange-600" />;
      case 'data_access': return <Eye className="w-4 h-4 text-purple-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'login': return 'Login';
      case 'failed_login': return 'Login Falhado';
      case 'password_change': return 'Alteração de Senha';
      case 'permission_change': return 'Alteração de Permissão';
      case 'data_access': return 'Acesso a Dados';
      default: return type;
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Card className="border-0 shadow-elegant">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Apenas administradores podem acessar o módulo de auditoria de segurança.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Auditoria de Segurança</h1>
        <p className="text-muted-foreground">
          Monitore eventos de segurança e atividades do sistema
        </p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Eventos</p>
                <p className="text-2xl font-bold">{metrics.totalEvents}</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas de Segurança</p>
                <p className="text-2xl font-bold text-red-600">{metrics.securityAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Logins Falhados</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.failedLogins}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{metrics.activeUsers}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Events */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todos os Eventos</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="logins">Logins</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Recentes</CardTitle>
              <CardDescription>
                Histórico completo de eventos de segurança do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Severidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.type)}
                          <span className="text-sm">{getEventTypeLabel(event.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.user}</TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell>{event.timestamp.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-mono text-sm">{event.ip}</TableCell>
                      <TableCell>
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Segurança</CardTitle>
              <CardDescription>
                Eventos que requerem atenção imediata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents
                    .filter(event => event.severity === 'high')
                    .map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.type)}
                          <span className="text-sm">{getEventTypeLabel(event.type)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.user}</TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell>{event.timestamp.toLocaleString('pt-BR')}</TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'active' ? 'destructive' : 'secondary'}>
                          {event.status === 'active' ? 'Ativo' : 'Resolvido'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logins">
          <Card>
            <CardHeader>
              <CardTitle>Atividade de Login</CardTitle>
              <CardDescription>
                Histórico de tentativas de login no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents
                    .filter(event => event.type === 'login' || event.type === 'failed_login')
                    .map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event.type)}
                          <span className="text-sm">
                            {event.type === 'login' ? 'Sucesso' : 'Falhou'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{event.user}</TableCell>
                      <TableCell>{event.timestamp.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className="font-mono text-sm">{event.ip}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}