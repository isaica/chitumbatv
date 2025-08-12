import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, UserCheck, CreditCard, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockDashboardMetrics, mockActivities, mockUsers, mockMensalidades, mockClients, mockFiliais } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';

// Mock data for charts
const defaultData = [
  { month: 'Set', pago: 12, atrasado: 3 },
  { month: 'Out', pago: 15, atrasado: 2 },
  { month: 'Nov', pago: 18, atrasado: 4 },
  { month: 'Dez', pago: 20, atrasado: 5 },
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-card-foreground/80">{title}</CardTitle>
        <Icon className="w-4 h-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-card-foreground">{value}</div>
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
          <span>{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const metrics = mockDashboardMetrics;

  // Filter data based on user role and filial
  const userFilials = user?.role === 'admin' 
    ? mockFiliais 
    : mockFiliais.filter(f => f.id === user?.filialId);

  const recentActivities = mockActivities.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo de volta, {user?.name}! Aqui está um resumo das suas atividades.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          title="Taxa de Inadimplência"
          value={`${metrics.defaultRate.toFixed(1)}%`}
          description="últimos 30 dias"
          icon={AlertTriangle}
          trend="down"
          trendValue="-3.2%"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart */}
        <Card className="lg:col-span-4 border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Pagamentos vs Inadimplência</CardTitle>
            <CardDescription>
              Comparativo mensal de pagamentos realizados e mensalidades em atraso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={defaultData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pago" fill="hsl(var(--primary))" name="Pagos" />
                <Bar dataKey="atrasado" fill="hsl(var(--destructive))" name="Atrasados" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-3 border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas ações realizadas no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const user = mockUsers.find(u => u.id === activity.userId);
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>por {user?.name}</span>
                        <span>•</span>
                        <span>
                          {new Date(activity.timestamp).toLocaleString('pt-AO', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: 'short'
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        activity.type === 'payment' ? 'default' :
                        activity.type === 'client_added' ? 'secondary' :
                        'destructive'
                      }
                      className="text-xs"
                    >
                      {activity.type === 'payment' ? 'Pagamento' :
                       activity.type === 'client_added' ? 'Cliente' :
                       'Status'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filiais Overview (only for admin) */}
      {user?.role === 'admin' && (
        <Card className="border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Visão Geral das Filiais</CardTitle>
            <CardDescription>
              Status e performance das filiais da Chitumba TV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
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
    </div>
  );
}