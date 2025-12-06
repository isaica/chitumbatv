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
import { mockActivities } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/components/ui/notification-system';
import ActionHistory, { ActionRecord } from '@/components/ui/action-history';
import { exportToPDF } from '@/utils/export';
import { calculateClientPaymentStatus } from '@/utils/paymentStatus';
import { useNavigate } from 'react-router-dom';
import { QuickPaymentModal } from '@/components/ui/quick-payment-modal';
import { Client, Mensalidade, Filial } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { RevenueByFilialChart } from '@/components/dashboard/RevenueByFilialChart';
import { InadimplenciaAnalysis } from '@/components/dashboard/InadimplenciaAnalysis';
import { FinancialProjections } from '@/components/dashboard/FinancialProjections';
import { useAppStore } from '@/stores/useAppStore';

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
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
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
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
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
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
  },
  {
    id: '4',
    type: 'client',
    action: 'update',
    description: 'Status do cliente alterado para suspenso',
    details: 'Cliente: Pedro Costa - Motivo: Inadimplência',
    userId: '3',
    userName: 'Ana Ferreira',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
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
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  // Use Zustand store
  const { clients, mensalidades, filiais, setMensalidades } = useAppStore();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  const handlePayment = (mensalidadeIds: string[]) => {
    const existingIds = mensalidadeIds.filter(id => !id.startsWith('virtual-'));
    const virtualIds = mensalidadeIds.filter(id => id.startsWith('virtual-'));
    
    const newMensalidades: Mensalidade[] = virtualIds.map(id => {
      const parts = id.split('-');
      const clientId = parts.slice(1, -2).join('-');
      const year = parseInt(parts[parts.length - 2]);
      const month = parseInt(parts[parts.length - 1]);
      
      const client = clients.find(c => c.id === clientId);
      const filial = client ? filiais.find(f => f.id === client.filialId) : null;
      
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
    
    const updatedMensalidades = [
      ...mensalidades.map(m =>
        existingIds.includes(m.id)
          ? { ...m, status: 'pago' as const, paidAt: new Date() }
          : m
      ),
      ...newMensalidades
    ];
    
    setMensalidades(updatedMensalidades);
    
    toast({
      title: 'Pagamento registrado',
      description: `${mensalidadeIds.length} ${mensalidadeIds.length === 1 ? 'mensalidade paga' : 'mensalidades pagas'} com sucesso.`,
    });
    setIsPaymentModalOpen(false);
    setSelectedClientForPayment(null);
  };
  
  const userFilials = user?.role === 'admin' 
    ? filiais 
    : filiais.filter(f => f.id === user?.filialId);

  const userFilialClients = user?.role === 'admin' 
    ? clients 
    : clients.filter(c => c.filialId === user?.filialId);

  const criticalClients = userFilialClients
    .map(client => {
      const clientMensalidades = mensalidades.filter(m => m.clientId === client.id);
      const paymentStatus = calculateClientPaymentStatus(client, clientMensalidades);
      return { client, paymentStatus };
    })
    .filter(({ paymentStatus }) => 
      paymentStatus.status === 'kilapeiro' && paymentStatus.overdueCount >= 2
    )
    .sort((a, b) => b.paymentStatus.overdueCount - a.paymentStatus.overdueCount)
    .slice(0, 5);

  const totalOverdueClients = userFilialClients.filter(client => {
    const clientMensalidades = mensalidades.filter(m => m.clientId === client.id);
    const status = calculateClientPaymentStatus(client, clientMensalidades);
    return status.status === 'kilapeiro';
  }).length;

  const metrics = {
    totalClients: userFilialClients.length,
    activeClients: userFilialClients.filter(c => c.status === 'ativo').length,
    monthlyPaid: mensalidades.filter(m => 
      m.month === new Date().getMonth() + 1 && 
      m.year === new Date().getFullYear() && 
      m.status === 'pago'
    ).length,
    defaultRate: userFilialClients.length > 0 
      ? (totalOverdueClients / userFilialClients.length) * 100 
      : 0
  };

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
                const filial = filiais.find(f => f.id === client.filialId);
                return (
                  <div 
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-background border hover:border-destructive transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{client.name}</p>
                        <Badge 
                          variant="destructive"
                          className="text-xs"
                        >
                          {paymentStatus.overdueCount} meses
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{filial?.name}</span>
                        <span className="text-destructive font-medium">
                          Dívida: {paymentStatus.totalDebt.toLocaleString()} AOA
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="gradient-primary"
                        onClick={() => {
                          setSelectedClientForPayment(client);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Pagar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate('/clientes')}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
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
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial" className="text-xs sm:text-sm">Financeiro</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs sm:text-sm">Pagamentos</TabsTrigger>
          <TabsTrigger value="growth" className="text-xs sm:text-sm">Crescimento</TabsTrigger>
          <TabsTrigger value="distribution" className="text-xs sm:text-sm">Distribuição</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
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

            <Card className="lg:col-span-3 border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Ações Recentes</CardTitle>
                <CardDescription>
                  Últimas atividades no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ActionHistory actions={mockActionHistory} compact />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <RevenueByFilialChart filiais={filiais} clients={clients} mensalidades={mensalidades} />
            <FinancialProjections filiais={filiais} clients={clients} mensalidades={mensalidades} />
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-7">
            <Card className="lg:col-span-4 border-0 shadow-primary">
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
                    <Legend />
                    <Bar dataKey="pago" fill="hsl(var(--primary))" name="Pago" />
                    <Bar dataKey="atrasado" fill="hsl(var(--destructive))" name="Atrasado" />
                    <Bar dataKey="pendente" fill="hsl(var(--warning))" name="Pendente" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 border-0 shadow-primary">
              <CardHeader>
                <CardTitle>Análise de Inadimplência</CardTitle>
                <CardDescription>
                  Detalhamento por filial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InadimplenciaAnalysis filiais={filiais} clients={clients} mensalidades={mensalidades} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4 sm:space-y-6">
          <Card className="border-0 shadow-primary">
            <CardHeader>
              <CardTitle>Crescimento de Clientes</CardTitle>
              <CardDescription>
                Evolução da base de clientes ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="clientes" 
                    stroke="hsl(var(--primary))" 
                    name="Total de Clientes"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="crescimento" 
                    stroke="hsl(var(--success))" 
                    name="Crescimento (%)"
                  />
                </LineChart>
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
                  Status atual dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                <CardTitle>Resumo do Mês</CardTitle>
                <CardDescription>
                  {currentMonth}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-primary" />
                    <div>
                      <p className="font-medium">Receita Esperada</p>
                      <p className="text-sm text-muted-foreground">Base de clientes ativos</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    {(metrics.activeClients * 5000).toLocaleString()} AOA
                  </p>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-lg bg-success/10">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-8 h-8 text-success" />
                    <div>
                      <p className="font-medium">Já Recebido</p>
                      <p className="text-sm text-muted-foreground">Pagamentos confirmados</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-success">
                    {(metrics.monthlyPaid * 5000).toLocaleString()} AOA
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-destructive/10">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                    <div>
                      <p className="font-medium">Em Atraso</p>
                      <p className="text-sm text-muted-foreground">Valores pendentes</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-destructive">
                    {(totalOverdueClients * 5000).toLocaleString()} AOA
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      {selectedClientForPayment && (
        <QuickPaymentModal
          client={selectedClientForPayment}
          mensalidades={mensalidades.filter(m => m.clientId === selectedClientForPayment.id)}
          filiais={filiais}
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedClientForPayment(null);
          }}
          onPayment={handlePayment}
        />
      )}
    </div>
  );
}
