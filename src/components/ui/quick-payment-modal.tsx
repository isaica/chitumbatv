import { useState } from 'react';
import { X, CheckCircle, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Client, Mensalidade } from '@/types';
import { mockFiliais } from '@/data/mock';

interface QuickPaymentModalProps {
  open: boolean;
  onClose: () => void;
  client: Client;
  mensalidades: Mensalidade[];
  onPayment: (mensalidadeIds: string[]) => void;
}

export function QuickPaymentModal({ 
  open, 
  onClose, 
  client, 
  mensalidades,
  onPayment 
}: QuickPaymentModalProps) {
  const [selectedMensalidades, setSelectedMensalidades] = useState<string[]>([]);

  // Filter unpaid mensalidades
  const unPaidMensalidades = mensalidades
    .filter(m => m.clientId === client.id && m.status !== 'pago')
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

  const totalAmount = unPaidMensalidades
    .filter(m => selectedMensalidades.includes(m.id))
    .reduce((sum, m) => sum + m.amount, 0);

  const handleToggleMensalidade = (mensalidadeId: string) => {
    setSelectedMensalidades(prev => 
      prev.includes(mensalidadeId)
        ? prev.filter(id => id !== mensalidadeId)
        : [...prev, mensalidadeId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMensalidades.length === unPaidMensalidades.length) {
      setSelectedMensalidades([]);
    } else {
      setSelectedMensalidades(unPaidMensalidades.map(m => m.id));
    }
  };

  const handleConfirmPayment = () => {
    if (selectedMensalidades.length > 0) {
      onPayment(selectedMensalidades);
      setSelectedMensalidades([]);
      onClose();
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2024, month - 1, 1).toLocaleDateString('pt-AO', { month: 'long' });
  };

  const filial = mockFiliais.find(f => f.id === client.filialId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Registro Rápido de Pagamento
          </DialogTitle>
          <DialogDescription>
            Selecione os meses que deseja marcar como pagos para {client.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Info */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{client.name}</p>
                <p className="text-sm text-muted-foreground">{filial?.name}</p>
              </div>
              <Badge variant={client.status === 'ativo' ? 'default' : 'destructive'}>
                {client.status}
              </Badge>
            </div>
          </div>

          {/* Mensalidades List */}
          {unPaidMensalidades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
              <p>Todas as mensalidades estão pagas!</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">
                  Mensalidades em Aberto ({unPaidMensalidades.length})
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSelectAll}
                >
                  {selectedMensalidades.length === unPaidMensalidades.length 
                    ? 'Desmarcar Todos' 
                    : 'Selecionar Todos'}
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {unPaidMensalidades.map((mensalidade) => (
                  <div
                    key={mensalidade.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/30 ${
                      selectedMensalidades.includes(mensalidade.id)
                        ? 'bg-primary/5 border-primary'
                        : 'border-border'
                    }`}
                    onClick={() => handleToggleMensalidade(mensalidade.id)}
                  >
                    <Checkbox
                      checked={selectedMensalidades.includes(mensalidade.id)}
                      onCheckedChange={() => handleToggleMensalidade(mensalidade.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">
                          {getMonthName(mensalidade.month)} {mensalidade.year}
                        </p>
                        <Badge 
                          variant={mensalidade.status === 'atrasado' ? 'destructive' : 'secondary'}
                        >
                          {mensalidade.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                          Vencimento: {mensalidade.dueDate.toLocaleDateString('pt-AO')}
                        </p>
                        <p className="text-sm font-semibold">
                          {mensalidade.amount.toLocaleString()} AOA
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="p-4 bg-primary/10 rounded-lg border-2 border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total a Pagar</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMensalidades.length} {selectedMensalidades.length === 1 ? 'mês selecionado' : 'meses selecionados'}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {totalAmount.toLocaleString()} AOA
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmPayment}
                  disabled={selectedMensalidades.length === 0}
                  className="flex-1 gradient-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Pagamento
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
