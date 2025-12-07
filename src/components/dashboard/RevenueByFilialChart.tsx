import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Filial, Client, Mensalidade } from '@/types';

interface RevenueByFilialChartProps {
  filiais: Filial[];
  clients: Client[];
  mensalidades: Mensalidade[];
}

export function RevenueByFilialChart({ filiais, clients, mensalidades }: RevenueByFilialChartProps) {
  // Calculate revenue by filial
  const revenueByFilial = filiais.map(filial => {
    const filialClients = clients.filter(c => c.filialId === filial.id);
    const clientIds = filialClients.map(c => c.id);
    
    const totalReceita = mensalidades
      .filter(m => clientIds.includes(m.clientId) && m.status === 'pago')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const pendente = mensalidades
      .filter(m => clientIds.includes(m.clientId) && m.status === 'pendente')
      .reduce((sum, m) => sum + m.amount, 0);
    
    const atrasado = mensalidades
      .filter(m => clientIds.includes(m.clientId) && m.status === 'atrasado')
      .reduce((sum, m) => sum + m.amount, 0);

    const meta = filialClients.length * filial.monthlyPrice;

    return {
      name: filial.name,
      receita: totalReceita,
      meta: meta,
      pendente: pendente,
      atrasado: atrasado,
      taxaRecuperacao: meta > 0 ? ((totalReceita / meta) * 100).toFixed(1) : '0'
    };
  });

  const formatCurrency = (value: number) => {
    return `${(value / 1000).toFixed(0)}k`;
  };

  return (
    <Card className="border-0 shadow-primary">
      <CardHeader>
        <CardTitle>Receita por Filial</CardTitle>
        <CardDescription>
          Comparativo de receita realizada vs meta por filial
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={revenueByFilial}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickFormatter={formatCurrency}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                      <p className="font-semibold text-sm mb-2">{data.name}</p>
                      <div className="space-y-1 text-xs">
                        <p className="text-primary">
                          Receita: {data.receita.toLocaleString()} AOA
                        </p>
                        <p className="text-muted-foreground">
                          Meta: {data.meta.toLocaleString()} AOA
                        </p>
                        <p className="text-yellow-600">
                          Pendente: {data.pendente.toLocaleString()} AOA
                        </p>
                        <p className="text-destructive">
                          Atrasado: {data.atrasado.toLocaleString()} AOA
                        </p>
                        <p className="font-semibold border-t border-border pt-1 mt-1">
                          Taxa de Recuperação: {data.taxaRecuperacao}%
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar 
              dataKey="receita" 
              fill="hsl(var(--primary))" 
              name="Receita Realizada"
              radius={[8, 8, 0, 0]}
            />
            <Bar 
              dataKey="meta" 
              fill="hsl(var(--muted))" 
              name="Meta"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
