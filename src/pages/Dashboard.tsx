import { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Users, UserCheck, CreditCard, AlertTriangle, DollarSign, Calendar, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockDashboardMetrics, mockActivities, mockUsers, mockMensalidades, mockClients, mockFiliais } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/components/ui/notification-system';
import ActionHistory, { ActionRecord } from '@/components/ui/action-history';
import { exportToPDF } from '@/utils/export';
import { calculateClientPaymentStatus } from '@/utils/paymentStatus';
import { useNavigate } from 'react-router-dom';
import { QuickPaymentModal } from '@/components/ui/quick-payment-modal';
import { Client, Mensalidade } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock data for enhanced charts
const paymentData = [
  { month: 'Set', pago: 12, atrasado: 3, pendente: 2 },
  { month: 'Out', pago: 15, atrasado: 2, pendente: 4 },
  { month: 'Nov', pago: 18, atrasado: 4, pendente: 3 },
  { month: 'Dez', pago: 20, atrasado: 5, pendente: 2 },
  { month: 'Jan', pago: 22, atrasado: 3, pendente: 5 },
  { month: 'Fev', pago: 25, atrasado: 2, pendente: 3 },
];

const revenueData = [
  { month: 'Set', receita: 450000, meta: 500000 },
  { month: 'Out', receita: 520000, meta: 520000 },
  { month: 'Nov', receita: 580000, meta: 550000 },
  { month: 'Dez', receita: 620000, meta: 600000 },
  { month: 'Jan', receita: 680000, meta: 650000 },
  { month: 'Fev', receita: 720000, meta: 700000 },
];

const statusDistribution = [
  { name: 'Ativos', value: 234, color: 'hsl(var(--primary))' },
  { name: 'Inativos', value: 45, color: 'hsl(var(--muted))' },
  { name: 'Suspensos', value: 12, color: 'hsl(var(--destructive))' },
];

const growthData = [
  { month: 'Set', clientes: 280, crescimento: 5 },
  { month: 'Out', clientes: 285, crescimento: 8 },
  { month: 'Nov', clientes: 290, crescimento: 12 },
  { month: 'Dez', clientes: 295, crescimento: 6 },
  { month: 'Jan', clientes: 301, crescimento: 9 },
  { month: 'Fev', clientes: 310, crescimento: 15 },
];

// Mock action history data
const mockActionHistory: ActionRecord[] = [
  {
    id: '1',
    type: 'payment',
    action: 'create',
    description: 'Pagamento registrado para cliente João Silva',
    details: 'Mensalidade de Janeiro - AOA 5.000',
    userId: '1',
    userName: 'Admin Sistema',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    entityId: 'client-1',
    entityType: 'payment'
  },
  {
    id: '2',
    type: 'client',
    action: 'create',
    description: 'Novo cliente cadastrado: Maria Santos',
    details: 'Plano Premium - Filial Centro',
    userId: '2',
    userName: 'Carlos Mendes',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    entityId: 'client-2',
    entityType: 'client'
  },
  {
    id: '3',
    type: 'report',
    action: 'export',
    description: 'Relatório de inadimplência exportado',
    details: 'Formato PDF - Período: Dezembro 2024',
    userId: '1',
    userName: 'Admin Sistema',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
  },
  {
    id: '4',
    type: 'client',
    action: 'update',
    description: 'Status do cliente alterado para suspenso',
    details: 'Cliente: Pedro Costa - Motivo: Inadimplência',
    userId: '3',
    userName: 'Ana Ferreira',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    entityId: 'client-3',
    entityType: 'client'
  },
];

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  className?: string;
}

function MetricCard({ title, value, description, icon: Icon, trend, trendValue, className }: MetricCardProps) {
  return (
    <Card className={`gradient-card border-0 shadow-primary ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-card-foreground/80 leading-tight">{title}</CardTitle>
        <Icon className="w-4 h-4 text-primary flex-shrink-0" />
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-lg sm:text-2xl font-bold text-card-foreground">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {trend && trendValue && (
            <>
              {trend === 'up' ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-destructive" />
              )}
              <span className={trend === 'up' ? 'text-success' : 'text-destructive'}>
                {trendValue}
              </span>
            </>
          )}
          <span className="truncate">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>(mockMensalidades);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const handlePayment = (mensalidadeIds: string[]) => {
    // Separate existing IDs from virtual/future ones
    const existingIds = mensalidadeIds.filter(id => !id.startsWith('virtual-'));
    const virtualIds = mensalidadeIds.filter(id => id.startsWith('virtual-'));
    
    // Create new mensalidades for virtual/future months
    const newMensalidades: Mensalidade[] = virtualIds.map(id => {
      // Extract info from ID: virtual-{clientId}-{year}-{month}
      const parts = id.split('-');
      const clientId = parts.slice(1, -2).join('-');
      const year = parseInt(parts[parts.length - 2]);
      const month = parseInt(parts[parts.length - 1]);
      
      const client = mockClients.find(c => c.id === clientId);
      const filial = client ? mockFiliais.find(f => f.id === client.filialId) : null;
      
      return {
        id: `${clientId}-${year}-${month}-${Date.now()}`,
        clientId,
        month,
        year,
        amount: filial?.monthlyPrice || 0,
        status: 'pago' as const,
        dueDate: new Date(year, month - 1, 15),
        paidAt: new Date(),
        createdAt: new Date()
      };
    });
    
    // Update state
    setMensalidades(prev => [
      ...prev.map(m =>
        existingIds.includes(m.id)
          ? { ...m, status: 'pago' as const, paidAt: new Date() }
          : m
      ),
      ...newMensalidades
    ]);
    
    toast({
      title: 'Pagamento registrado',
      description: `${mensalidadeIds.length} ${mensalidadeIds.length === 1 ? 'mensalidade paga' : 'mensalidades pagas'} com sucesso.`,
    });

    setIsPaymentModalOpen(false);
    setSelectedClientForPayment(null);
  };
  const metrics = mockDashboardMetrics;

  // Filter data based on user role and filial
  const userFilials = user?.role === 'admin' 
    ? mockFiliais 
    : mockFiliais.filter(f => f.id === user?.filialId);

  const userFilialClients = user?.role === 'admin' 
    ? mockClients 
    : mockClients.filter(c => c.filialId === user?.filialId);

  // Calculate critical clients
  const criticalClients = userFilialClients
    .map(client => {
      const clientMensalidades = mockMensalidades.filter(m => m.clientId === client.id);
      const paymentStatus = calculateClientPaymentStatus(client, clientMensalidades);
      return { client, paymentStatus };
    })
    .filter(({ paymentStatus }) => 
      paymentStatus.status === 'suspenso' || paymentStatus.overdueCount >= 2
    )
    .sort((a, b) => b.paymentStatus.overdueCount - a.paymentStatus.overdueCount)
    .slice(0, 5);

  const totalOverdueClients = userFilialClients.filter(client => {
    const clientMensalidades = mockMensalidades.filter(m => m.clientId === client.id);
    const status = calculateClientPaymentStatus(client, clientMensalidades);
    return status.status === 'inadimplente' || status.status === 'suspenso';
  }).length;

  const recentActivities = mockActivities.slice(0, 5);

  const handleExportDashboard = () => {
    const dashboardData = [
      { metric: 'Total de Clientes', value: metrics.totalClients },
      { metric: 'Clientes Ativos', value: metrics.activeClients },
      { metric: 'Mensalidades Pagas', value: metrics.monthlyPaid },
      { metric: 'Taxa de Inadimplência', value: `${metrics.defaultRate.toFixed(1)}%` },
    ];

    exportToPDF({
      filename: `dashboard_${new Date().toISOString().split('T')[0]}`,
      title: 'Dashboard - ALF Chitumba',
      subtitle: `Relatório gerado em ${new Date().toLocaleString('pt-AO')}`,
      columns: [
        { key: 'metric', title: 'Métrica' },
        { key: 'value', title: 'Valor' }
      ],
      data: dashboardData,
      author: user?.name || 'Sistema'
    });

    addNotification({
      type: 'success',
      title: 'Dashboard Exportado',
      message: 'Relatório do dashboard foi exportado com sucesso!'
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Bem-vindo de volta, {user?.name}! Aqui está um resumo das suas atividades.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={handleExportDashboard} className="text-xs sm:text-sm">
            <Download className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            <Eye className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Visualização</span>
          </Button>
        </div>
      </div>

      {/* Critical Clients Alert */}
      {criticalClients.length > 0 && (
        <Card className="border-l-4 border-l-destructive bg-destructive/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <CardTitle className="text-lg">Clientes que Requerem Atenção</CardTitle>
              </div>
              <Badge variant="destructive" className="text-sm">
                {totalOverdueClients} Kilapeiros
              </Badge>
            </div>
            <CardDescription>
              Clientes com pagamentos críticos ou suspensos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalClients.map(({ client, paymentStatus }) => {
                const filial = mockFiliais.find(f => f.id === client.filialId);
                return (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-destructive transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{client.name}</p>
                        <Badge 
                          variant={paymentStatus.status === 'suspenso' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {paymentStatus.status === 'suspenso' ? 'Suspenso' : `${paymentStatus.overdueCount} meses`}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{filial?.name}</span>
                        <span className="text-destructive font-medium">
                          Dívida: {paymentStatus.totalDebt.toLocaleString()} AOA
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => navigate('/clientes')}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                );
              })}
              
              <Button 
                className="w-full mt-2" 
                variant="destructive"
                onClick={() => navigate('/clientes')}
              >
                Ver Todos os Kilapeiros ({totalOverdueClients})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Clientes"
          value={metrics.totalClients}
          description="clientes cadastrados"
          icon={Users}
          trend="up"
          trendValue="+5.2%"
        />
        <MetricCard
          title="Clientes Ativos"
          value={metrics.activeClients}
          description="clientes ativos"
          icon={UserCheck}
          trend="up"
          trendValue="+2.1%"
        />
        <MetricCard
          title="Mensalidades Pagas"
          value={metrics.monthlyPaid}
          description="neste mês"
          icon={CreditCard}
          trend="up"
          trendValue="+12.5%"
        />
        <MetricCard
          title="Kilapeiros Críticos"
          value={totalOverdueClients}
          description="clientes com atraso"
          icon={AlertTriangle}
          trend="down"
          trendValue="-3.2%"
          className={totalOverdueClients > 0 ? 'border-l-4 border-l-destructive' : ''}
        />
      </div>

      {/* Enhanced Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm">Pagamentos</TabsTrigger>
          <TabsTrigger value="growth" className="text-xs sm:text-sm">Crescimento</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs sm:text-sm">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
            {/* Main Chart */}
            <Card className="lg:col-span-4 border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Receita vs Meta</CardTitle>
                <CardDescription>
                  Comparativo mensal entre receita realizada e meta estabelecida
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`AOA ${Number(value).toLocaleString('pt-AO')}`, '']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3}
                      name="Receita"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="meta" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      name="Meta"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Action History */}
            <Card className="lg:col-span-3 border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas ações realizadas no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionHistory 
                  actions={mockActionHistory} 
                  showFilters={false}
                  maxHeight="300px"
                  compact={true}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Status de Pagamentos</CardTitle>
                <CardDescription>
                  Distribuição mensal de pagamentos por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="pago" fill="hsl(var(--primary))" name="Pagos" />
                    <Bar dataKey="atrasado" fill="hsl(var(--destructive))" name="Atrasados" />
                    <Bar dataKey="pendente" fill="hsl(var(--warning))" name="Pendentes" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Tendência de Inadimplência</CardTitle>
                <CardDescription>
                  Evolução da taxa de inadimplência ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={paymentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="atrasado" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={3}
                      name="Atrasados"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <Card className="border-0 shadow-primary">
            <CardHeader>
              <CardTitle>Crescimento de Clientes</CardTitle>
              <CardDescription>
                Evolução do número de clientes e taxa de crescimento mensal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="clientes" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.3}
                    name="Total Clientes"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="crescimento" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={3}
                    name="Crescimento %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card className="border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
                <CardDescription>
                  Proporção de clientes por status atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Métricas Rápidas</CardTitle>
                <CardDescription>
                  Indicadores importantes do mês atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket Médio</p>
                    <p className="text-lg font-semibold">AOA 5.250</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Novos Clientes</p>
                    <p className="text-lg font-semibold">+15</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Taxa Conversão</p>
                    <p className="text-lg font-semibold">87.3%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm text-muted-foreground">Churn Rate</p>
                    <p className="text-lg font-semibold">2.1%</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Filiais Overview (only for admin) */}
      {user?.role === 'admin' && (
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Visão Geral das Filiais</CardTitle>
            <CardDescription>
              Status e performance das filiais da ALF Chitumba
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {mockFiliais.map((filial) => {
                const filialClients = mockClients.filter(c => c.filialId === filial.id);
                const activeClients = filialClients.filter(c => c.status === 'ativo').length;
                
                return (
                  <div key={filial.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{filial.name}</h3>
                      <Badge variant={filial.status === 'ativa' ? 'default' : 'secondary'}>
                        {filial.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{filialClients.length} clientes total</p>
                      <p>{activeClients} clientes ativos</p>
                      <p className="font-medium text-foreground">{filial.responsavel}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Payment Modal */}
      {selectedClientForPayment && (
        <QuickPaymentModal
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedClientForPayment(null);
          }}
          client={selectedClientForPayment}
          mensalidades={mensalidades}
          onPayment={handlePayment}
        />
      )}
    </div>
  );
}