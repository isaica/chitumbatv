import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { mockFiliais } from '@/data/mock';
import { Filial } from '@/types';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Save } from 'lucide-react';

export default function PrecosPorFilial() {
  const [filiais, setFiliais] = useState<Filial[]>(mockFiliais);
  const { toast } = useToast();

  const handlePriceChange = (filialId: string, newPrice: number) => {
    setFiliais(prev => prev.map(f => 
      f.id === filialId ? { ...f, monthlyPrice: newPrice } : f
    ));
  };

  const handleSave = () => {
    toast({
      title: 'Preços atualizados',
      description: 'Os preços das mensalidades foram atualizados com sucesso.',
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Preços por Filial</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Defina o preço da mensalidade para cada filial
          </p>
        </div>
        <Button onClick={handleSave} className="gradient-primary shadow-primary">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filiais.map((filial) => (
          <Card key={filial.id} className="border-0 shadow-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{filial.name}</CardTitle>
                <Badge variant={filial.status === 'ativa' ? 'default' : 'secondary'}>
                  {filial.status}
                </Badge>
              </div>
              <CardDescription>{filial.address}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`price-${filial.id}`}>Preço Mensal (AOA)</Label>
                <Input
                  id={`price-${filial.id}`}
                  type="number"
                  value={filial.monthlyPrice}
                  onChange={(e) => handlePriceChange(filial.id, Number(e.target.value))}
                  placeholder="0"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Responsável: {filial.responsavel}</p>
                <p>Contato: {filial.phone}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}