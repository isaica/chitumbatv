import { useState } from 'react';
import { X, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Client, Mensalidade } from '@/types';
import { mockFiliais } from '@/data/mock';

// Helper component for mensalidade item
function MensalidadeItem({ 
  m, 
  selected, 
  onToggle, 
  getMonthName,
  getMonthType 
}: { 
  m: Mensalidade & { isFuture?: boolean; isPast?: boolean }; 
  selected: boolean;
  onToggle: (id: string) => void;
  getMonthName: (month: number) => string;
  getMonthType: (m: Mensalidade & { isFuture?: boolean; isPast?: boolean }) => string;
}) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={() => onToggle(m.id)}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(m.id)}
        />
        <div>
          <p className="font-medium">
            {getMonthName(m.month)} {m.year}
            {m.isFuture && (
              <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                Adiantado
              </Badge>
            )}
          </p>
          <p className="text-sm text-muted-foreground">
            {getMonthType(m)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-semibold">{formatCurrency(m.amount)}</p>
        {m.status === 'atrasado' && (
          <Badge variant="destructive" className="text-xs">
            Vencido
          </Badge>
        )}
      </div>
    </div>
  );
}

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

  // Generate available months: last 3 + current + next 6 months
  const generateAvailableMonths = () => {
    const months = [];
    const today = new Date();
    
    // Last 3 months + current month
    for (let i = 3; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
    }
    
    // Next 6 months (advance payments)
    for (let i = 1; i <= 6; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push({ month: date.getMonth() + 1, year: date.getFullYear() });
    }
    
    return months;
  };

  const availableMonths = generateAvailableMonths();
  const filial = mockFiliais.find(f => f.id === client.filialId);
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  // Create or find mensalidades for all available months
  const allMensalidades = availableMonths.map(({ month, year }) => {
    // Find existing mensalidade
    const existing = mensalidades.find(
      m => m.clientId === client.id && m.month === month && m.year === year
    );
    
    // If exists, return it
    if (existing) return existing;
    
    // If doesn't exist, create a "virtual" one for future/past months
    const isPast = year < currentYear || (year === currentYear && month < currentMonth);
    const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
    
    return {
      id: `virtual-${client.id}-${year}-${month}`,
      clientId: client.id,
      month,
      year,
      amount: filial?.monthlyPrice || 0,
      status: 'pendente' as const,
      dueDate: new Date(year, month - 1, 15),
      createdAt: new Date(),
      isFuture,
      isPast,
      isVirtual: true
    } as Mensalidade & { isFuture?: boolean; isPast?: boolean; isVirtual?: boolean };
  });

  // Filter only unpaid
  const unPaidMensalidades = allMensalidades
    .filter(m => m.status !== 'pago')
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

  const getMonthType = (m: Mensalidade & { isFuture?: boolean; isPast?: boolean }) => {
    if (m.isFuture) return 'Adiantado';
    if (m.status === 'atrasado') return 'Atrasado';
    return 'Pendente';
  };

  // Separate months by type
  const overdueMensalidades = unPaidMensalidades.filter(m => m.status === 'atrasado');
  const currentMensalidades = unPaidMensalidades.filter(m => 
    !m.status || (m.status === 'pendente' && m.month === currentMonth && m.year === currentYear)
  );
  const futureMensalidades = unPaidMensalidades.filter(m => (m as any).isFuture);

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
                  Mensalidades Disponíveis ({unPaidMensalidades.length})
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

              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {/* Overdue months */}
                {overdueMensalidades.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm font-semibold">Meses Atrasados ({overdueMensalidades.length})</p>
                    </div>
                    {overdueMensalidades.map((m) => (
                      <MensalidadeItem 
                        key={m.id} 
                        m={m} 
                        selected={selectedMensalidades.includes(m.id)}
                        onToggle={handleToggleMensalidade}
                        getMonthName={getMonthName}
                        getMonthType={getMonthType}
                      />
                    ))}
                  </div>
                )}

                {/* Current month */}
                {currentMensalidades.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary">
                      <Calendar className="w-4 h-4" />
                      <p className="text-sm font-semibold">Mês Atual</p>
                    </div>
                    {currentMensalidades.map((m) => (
                      <MensalidadeItem 
                        key={m.id} 
                        m={m} 
                        selected={selectedMensalidades.includes(m.id)}
                        onToggle={handleToggleMensalidade}
                        getMonthName={getMonthName}
                        getMonthType={getMonthType}
                      />
                    ))}
                  </div>
                )}

                {/* Future months */}
                {futureMensalidades.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <p className="text-sm font-semibold">Pagamentos Adiantados (Opcional)</p>
                    </div>
                    {futureMensalidades.map((m) => (
                      <MensalidadeItem 
                        key={m.id} 
                        m={m} 
                        selected={selectedMensalidades.includes(m.id)}
                        onToggle={handleToggleMensalidade}
                        getMonthName={getMonthName}
                        getMonthType={getMonthType}
                      />
                    ))}
                  </div>
                )}
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
