import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';
import { Filial, Client, Mensalidade } from '@/types';

interface FinancialProjectionsProps {
  filiais: Filial[];
  clients: Client[];
  mensalidades: Mensalidade[];
}

export function FinancialProjections({ filiais, clients, mensalidades }: FinancialProjectionsProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Calculate historical revenue (last 6 months)
  const historicalData = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(currentYear, currentMonth - i, 1);
    const month = monthDate.getMonth() + 1;
    const year = monthDate.getFullYear();
    
    const monthlyRevenue = mensalidades
      .filter(m => m.month === month && m.year === year && m.status === 'pago')
      .reduce((sum, m) => sum + m.amount, 0);

    const monthlyPendente = mensalidades
      .filter(m => m.month === month && m.year === year && m.status === 'pendente')
      .reduce((sum, m) => sum + m.amount, 0);

    historicalData.push({
      month: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
      receita: monthlyRevenue,
      pendente: monthlyPendente,
      total: monthlyRevenue + monthlyPendente,
    });
  }

  // Calculate projections (next 6 months)
  const avgGrowthRate = 1.05; // 5% growth rate
  const lastMonthRevenue = historicalData[historicalData.length - 1].receita;
  const projectionData = [];

  for (let i = 1; i <= 6; i++) {
    const monthDate = new Date(currentYear, currentMonth + i, 1);
    const projectedRevenue = lastMonthRevenue * Math.pow(avgGrowthRate, i);
    const optimistic = projectedRevenue * 1.15;
    const pessimistic = projectedRevenue * 0.85;

    projectionData.push({
      month: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
      projecao: Math.round(projectedRevenue),
      otimista: Math.round(optimistic),
      pessimista: Math.round(pessimistic),
    });
  }

  const combinedData = [...historicalData, ...projectionData];

  // Calculate key metrics
  const totalActiveClients = clients.filter(c => c.status === 'ativo').length;
  const avgMonthlyPrice = filiais.length > 0 
    ? filiais.reduce((sum, f) => sum + f.monthlyPrice, 0) / filiais.length 
    : 0;
  const maxPotentialRevenue = totalActiveClients * avgMonthlyPrice;
  
  const currentRevenue = historicalData[historicalData.length - 1].receita;
  const projectedRevenue6Months = projectionData[5].projecao;
  const growthRate = ((projectedRevenue6Months - currentRevenue) / currentRevenue * 100).toFixed(1);

  const formatCurrency = (value: number) => {
    return `${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-0 shadow-primary bg-gradient-to-br from-primary/10 to-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Receita Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(currentRevenue / 1000).toFixed(0)}k AOA</p>
            <p className="text-xs text-muted-foreground mt-1">Mês atual</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-primary bg-gradient-to-br from-success/10 to-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Projeção 6 Meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">{(projectedRevenue6Months / 1000).toFixed(0)}k AOA</p>
            <p className="text-xs text-success mt-1">+{growthRate}% crescimento</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-primary bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Potencial Máximo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{(maxPotentialRevenue / 1000).toFixed(0)}k AOA</p>
            <p className="text-xs text-muted-foreground mt-1">{totalActiveClients} clientes ativos</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-primary bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Taxa de Realização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {((currentRevenue / maxPotentialRevenue) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Do potencial máximo</p>
          </CardContent>
        </Card>
      </div>

      {/* Projection Chart */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Projeções Financeiras</CardTitle>
              <CardDescription>
                Histórico dos últimos 6 meses e projeções para os próximos 6 meses
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-primary/10">
                Histórico
              </Badge>
              <Badge variant="outline" className="bg-success/10">
                Projeção
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={combinedData}>
              <defs>
                <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProjecao" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-chart-grid" />
              <XAxis 
                dataKey="month" 
                className="fill-chart-text"
                stroke="currentColor"
                fontSize={12}
              />
              <YAxis 
                className="fill-chart-text"
                stroke="currentColor"
                fontSize={12}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                        <p className="font-semibold text-sm mb-2">{payload[0].payload.month}</p>
                        <div className="space-y-1 text-xs">
                          {payload.map((entry: any, index: number) => (
                            <p key={index} style={{ color: entry.color }}>
                              {entry.name}: {entry.value.toLocaleString()} AOA
                            </p>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--chart-1))"
                fillOpacity={1}
                fill="url(#colorReceita)"
                name="Receita Realizada"
              />
              <Area
                type="monotone"
                dataKey="projecao"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorProjecao)"
                strokeDasharray="5 5"
                name="Projeção"
              />
              <Line
                type="monotone"
                dataKey="otimista"
                stroke="hsl(var(--chart-2))"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                name="Cenário Otimista"
              />
              <Line
                type="monotone"
                dataKey="pessimista"
                stroke="hsl(var(--chart-5))"
                strokeDasharray="3 3"
                strokeWidth={1}
                dot={false}
                name="Cenário Pessimista"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
