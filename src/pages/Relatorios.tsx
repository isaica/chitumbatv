import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart } from 'recharts';
import { Calendar, Download, FileText, TrendingDown, TrendingUp, Users, CreditCard, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockMensalidades, mockClients, mockFiliais } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { exportToPDF, exportToExcel } from '@/utils/export';

export default function Relatorios() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedFilial, setSelectedFilial] = useState('all');
  const { toast } = useToast();

  // Filter data based on user role
  const availableFiliais = user?.role === 'admin' 
    ? mockFiliais 
    : mockFiliais.filter(f => f.id === user?.filialId);

  const userFilialClients = user?.role === 'admin' 
    ? mockClients 
    : mockClients.filter(c => c.filialId === user?.filialId);

  // Generate inadimplência data
  const getInadimplenciaData = () => {
    const currentDate = new Date();
    const months = [];
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-AO', { month: 'short' });
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const monthMensalidades = mockMensalidades.filter(m => 
        m.year === year && m.month === month
      );
      
      const filteredMensalidades = selectedFilial === 'all' 
        ? monthMensalidades
        : monthMensalidades.filter(m => {
            const client = mockClients.find(c => c.id === m.clientId);
            return client?.filialId === selectedFilial;
          });

      const total = filteredMensalidades.length;
      const pagos = filteredMensalidades.filter(m => m.status === 'pago').length;
      const atrasados = filteredMensalidades.filter(m => m.status === 'atrasado').length;
      const pendentes = filteredMensalidades.filter(m => m.status === 'pendente').length;
      
      months.push({
        month: monthName,
        total,
        pagos,
        atrasados,
        pendentes,
        inadimplencia: total > 0 ? ((atrasados + pendentes) / total * 100).toFixed(1) : 0
      });
    }
    
    return months;
  };

  // Generate status distribution data
  const getStatusDistribution = () => {
    const filteredClients = selectedFilial === 'all' 
      ? userFilialClients
      : userFilialClients.filter(c => c.filialId === selectedFilial);
      
    const statusCounts = {
      ativo: filteredClients.filter(c => c.status === 'ativo').length,
      inativo: filteredClients.filter(c => c.status === 'inativo').length,
    };

    return [
      { name: 'Ativos', value: statusCounts.ativo, color: 'hsl(var(--primary))' },
      { name: 'Inativos', value: statusCounts.inativo, color: 'hsl(var(--muted))' },
    ];
  };

  const inadimplenciaData = getInadimplenciaData();
  const statusDistribution = getStatusDistribution();

  const totalClients = statusDistribution.reduce((acc, item) => acc + item.value, 0);
  const activeClients = statusDistribution.find(item => item.name === 'Ativos')?.value || 0;
  const suspendedClients = statusDistribution.find(item => item.name === 'Suspensos')?.value || 0;

  // Calculate current month metrics
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthMensalidades = mockMensalidades.filter(m => 
    m.year === currentYear && m.month === currentMonth
  );

  const handleExport = (type: 'pdf' | 'excel') => {
    toast({
      title: 'Exportação em desenvolvimento',
      description: `A exportação para ${type.toUpperCase()} será implementada em breve.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de dados e relatórios de inadimplência
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('excel')}>
            <Download className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport('pdf')}>
            <FileText className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Últimos 3 Meses</SelectItem>
                <SelectItem value="6months">Últimos 6 Meses</SelectItem>
                <SelectItem value="1year">Último Ano</SelectItem>
              </SelectContent>
            </Select>
            {user?.role === 'admin' && (
              <Select value={selectedFilial} onValueChange={setSelectedFilial}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Filiais</SelectItem>
                  {mockFiliais.map((filial) => (
                    <SelectItem key={filial.id} value={filial.id}>
                      {filial.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{activeClients} ativos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Atividade</CardTitle>
            <TrendingDown className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalClients > 0 ? ((activeClients / totalClients) * 100).toFixed(1) : 0}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>clientes ativos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Suspensos</CardTitle>
            <TrendingDown className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{suspendedClients}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>precisam atenção</span>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensalidades Mês</CardTitle>
            <CreditCard className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonthMensalidades.length}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>este mês</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Inadimplencia Chart */}
        <Card className="lg:col-span-4 border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Análise de Inadimplência</CardTitle>
            <CardDescription>
              Evolução mensal dos pagamentos e inadimplência
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={inadimplenciaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="pagos" fill="hsl(var(--primary))" name="Pagos" />
                <Bar dataKey="atrasados" fill="hsl(var(--destructive))" name="Atrasados" />
                <Bar dataKey="pendentes" fill="hsl(var(--warning))" name="Pendentes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="lg:col-span-3 border-0 shadow-primary">
          <CardHeader>
            <CardTitle>Distribuição de Clientes</CardTitle>
            <CardDescription>
              Status atual dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2">
                {statusDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.value}</span>
                      <Badge variant="secondary" className="text-xs">
                        {totalClients > 0 ? ((item.value / totalClients) * 100).toFixed(1) : 0}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle>Análise Detalhada por Mês</CardTitle>
          <CardDescription>
            Detalhamento mensal dos indicadores de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {inadimplenciaData.map((month, index) => (
              <div key={index} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{month.month}</h3>
                  <Badge 
                    variant={parseFloat(month.inadimplencia as string) > 30 ? 'destructive' : 'default'}
                  >
                    {month.inadimplencia}% inadimplência
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{month.total}</span>
                  </div>
                  <div className="flex justify-between text-success">
                    <span>Pagos:</span>
                    <span className="font-medium">{month.pagos}</span>
                  </div>
                  <div className="flex justify-between text-destructive">
                    <span>Atrasados:</span>
                    <span className="font-medium">{month.atrasados}</span>
                  </div>
                  <div className="flex justify-between text-warning">
                    <span>Pendentes:</span>
                    <span className="font-medium">{month.pendentes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}