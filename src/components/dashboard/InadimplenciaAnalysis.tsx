import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Filial, Client, Mensalidade } from '@/types';
import { calculateClientPaymentStatus } from '@/utils/paymentStatus';

const COLORS = {
  pago: 'hsl(var(--primary))',
  kilapeiro: 'hsl(var(--destructive))',
  inativo: 'hsl(var(--muted))',
};

interface InadimplenciaAnalysisProps {
  filiais: Filial[];
  clients: Client[];
  mensalidades: Mensalidade[];
}

export function InadimplenciaAnalysis({ filiais, clients, mensalidades }: InadimplenciaAnalysisProps) {
  // Calculate inadimplência by filial
  const inadimplenciaByFilial = filiais.map(filial => {
    const filialClients = clients.filter(c => c.filialId === filial.id);
    
    const statusCounts = {
      pago: 0,
      kilapeiro: 0,
      inativo: 0,
      total: filialClients.length
    };

    filialClients.forEach(client => {
      const status = calculateClientPaymentStatus(client, mensalidades);
      if (status.status === 'pago') statusCounts.pago++;
      else if (status.status === 'kilapeiro') statusCounts.kilapeiro++;
      else if (status.status === 'inativo') statusCounts.inativo++;
    });

    const totalDebt = filialClients.reduce((sum, client) => {
      const status = calculateClientPaymentStatus(client, mensalidades);
      return sum + status.totalDebt;
    }, 0);

    const taxaInadimplencia = statusCounts.total > 0 
      ? ((statusCounts.kilapeiro / statusCounts.total) * 100).toFixed(1)
      : '0';

    return {
      filial: filial.name,
      ...statusCounts,
      totalDebt,
      taxaInadimplencia: parseFloat(taxaInadimplencia),
    };
  });

  // Overall status distribution
  const totalStatusDistribution = [
    { 
      name: 'Pago', 
      value: inadimplenciaByFilial.reduce((sum, f) => sum + f.pago, 0),
      color: COLORS.pago
    },
    { 
      name: 'Kilapeiros', 
      value: inadimplenciaByFilial.reduce((sum, f) => sum + f.kilapeiro, 0),
      color: COLORS.kilapeiro
    },
    { 
      name: 'Inativos', 
      value: inadimplenciaByFilial.reduce((sum, f) => sum + f.inativo, 0),
      color: COLORS.inativo
    },
  ];

  const totalClients = totalStatusDistribution.reduce((sum, s) => sum + s.value, 0);
  const totalKilapeiros = totalStatusDistribution.find(s => s.name === 'Kilapeiros')?.value || 0;
  const taxaGeralInadimplencia = totalClients > 0 
    ? ((totalKilapeiros / totalClients) * 100).toFixed(1)
    : '0';

  const totalDebt = inadimplenciaByFilial.reduce((sum, f) => sum + f.totalDebt, 0);

  // Find worst performing filial
  const worstFilial = inadimplenciaByFilial.reduce((worst, current) => 
    current.taxaInadimplencia > worst.taxaInadimplencia ? current : worst
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Pie Chart */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle>Distribuição de Status</CardTitle>
          <CardDescription>
            Análise geral de pagamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <p className="text-2xl font-bold text-primary">{totalStatusDistribution[0].value}</p>
                <p className="text-xs text-muted-foreground">Pago</p>
              </div>
              <div className="text-center p-3 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{totalStatusDistribution[1].value}</p>
                <p className="text-xs text-muted-foreground">Kilapeiros</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-muted-foreground">{totalStatusDistribution[2].value}</p>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={totalStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {totalStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Inadimplência</p>
                <p className="text-2xl font-bold text-destructive">{taxaGeralInadimplencia}%</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Dívida Total</p>
                <p className="text-2xl font-bold">{totalDebt.toLocaleString()} AOA</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inadimplência by Filial */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle>Inadimplência por Filial</CardTitle>
          <CardDescription>
            Análise detalhada de atrasos por localização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {inadimplenciaByFilial.map((filial, index) => {
              const isWorst = filial.filial === worstFilial.filial;
              const trend = filial.taxaInadimplencia > parseFloat(taxaGeralInadimplencia) ? 'up' : 'down';
              
              return (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    isWorst ? 'border-destructive bg-destructive/5' : 'border-border bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{filial.filial}</h4>
                      {isWorst && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Crítico
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-destructive" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-success" />
                      )}
                      <span className={`text-sm font-bold ${
                        trend === 'up' ? 'text-destructive' : 'text-success'
                      }`}>
                        {filial.taxaInadimplencia}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Pago</p>
                      <p className="font-semibold text-primary">{filial.pago}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kilapeiros</p>
                      <p className="font-semibold text-destructive">{filial.kilapeiro}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Dívida</p>
                      <p className="font-semibold">{(filial.totalDebt / 1000).toFixed(0)}k</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div 
                        className="bg-primary" 
                        style={{ width: `${(filial.pago / filial.total) * 100}%` }}
                      />
                      <div 
                        className="bg-destructive" 
                        style={{ width: `${(filial.kilapeiro / filial.total) * 100}%` }}
                      />
                      <div 
                        className="bg-muted-foreground" 
                        style={{ width: `${(filial.inativo / filial.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
