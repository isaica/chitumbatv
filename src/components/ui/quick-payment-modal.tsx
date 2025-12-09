import { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, AlertCircle, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Client, Mensalidade, Filial } from '@/types';

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
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-all duration-200 cursor-pointer animate-fade-in hover:scale-[1.02]"
      onClick={() => onToggle(m.id)}
    >
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle(m.id)}
        />
        <div>
          <div className="font-medium flex items-center">
            <span>{getMonthName(m.month)} {m.year}</span>
            {m.isFuture && (
              <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                Adiantado
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {getMonthType(m)}
          </div>
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
  filiais: Filial[];
  onPayment: (mensalidadeIds: string[]) => void;
}

export function QuickPaymentModal({ 
  open, 
  onClose, 
  client, 
  mensalidades,
  filiais,
  onPayment 
}: QuickPaymentModalProps) {
  const [selectedMensalidades, setSelectedMensalidades] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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
  const filial = filiais.find(f => f.id === client.filialId);
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

  // Separate months by type
  const overdueMensalidades = unPaidMensalidades.filter(m => m.status === 'atrasado');
  const currentMensalidades = unPaidMensalidades.filter(m => 
    !m.status || (m.status === 'pendente' && m.month === currentMonth && m.year === currentYear)
  );
  const futureMensalidades = unPaidMensalidades.filter(m => (m as any).isFuture);

  const handleSelectOverdue = () => {
    setSelectedMensalidades(overdueMensalidades.map(m => m.id));
  };

  const handleSelectCurrent = () => {
    setSelectedMensalidades(currentMensalidades.map(m => m.id));
  };

  const handleSelectFuture3 = () => {
    const next3 = futureMensalidades.slice(0, 3);
    setSelectedMensalidades([
      ...overdueMensalidades.map(m => m.id),
      ...currentMensalidades.map(m => m.id),
      ...next3.map(m => m.id)
    ]);
  };

  const handleSelectFuture6 = () => {
    const next6 = futureMensalidades.slice(0, 6);
    setSelectedMensalidades([
      ...overdueMensalidades.map(m => m.id),
      ...currentMensalidades.map(m => m.id),
      ...next6.map(m => m.id)
    ]);
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

  // Smart Pay: Auto-select overdue + current month when modal opens
  useEffect(() => {
    if (open && selectedMensalidades.length === 0) {
      const smartSelection = [
        ...overdueMensalidades.map(m => m.id),
        ...currentMensalidades.map(m => m.id)
      ];
      if (smartSelection.length > 0) {
        setSelectedMensalidades(smartSelection);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, overdueMensalidades.length, currentMensalidades.length]);

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedMensalidades([]);
      setShowCancelConfirm(false);
    }
  }, [open]);

  const handleCloseAttempt = () => {
    if (selectedMensalidades.length > 0) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const handleCancelConfirmed = () => {
    setShowCancelConfirm(false);
    setSelectedMensalidades([]);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseAttempt}>
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
              <div className="space-y-3">
                <div className="flex items-center justify-between">
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

                {/* Quick Selection Buttons */}
                <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Seleção Rápida</p>
                  <div className="grid grid-cols-2 gap-2">
                    {overdueMensalidades.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectOverdue}
                        className="text-xs border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Pagar Atrasados ({overdueMensalidades.length})
                      </Button>
                    )}
                    {currentMensalidades.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectCurrent}
                        className="text-xs border-primary/30 hover:bg-primary/10 hover:text-primary"
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Pagar Mês Atual
                      </Button>
                    )}
                    {futureMensalidades.length >= 3 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectFuture3}
                        className="text-xs border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-600"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Adiantar 3 Meses
                      </Button>
                    )}
                    {futureMensalidades.length >= 6 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectFuture6}
                        className="text-xs border-green-500/30 hover:bg-green-500/10 hover:text-green-600"
                      >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Adiantar 6 Meses
                      </Button>
                    )}
                  </div>
                </div>
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

              {/* Floating Summary - Sticky */}
              <div className="sticky bottom-0 -mx-6 -mb-6 bg-background border-t shadow-lg animate-fade-in">
                <div className="p-4 bg-primary/10 border-t-2 border-primary">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total a Pagar</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMensalidades.length} {selectedMensalidades.length === 1 ? 'mês selecionado' : 'meses selecionados'}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-primary transition-all duration-300">
                      {totalAmount.toLocaleString()} AOA
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCloseAttempt}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleConfirmPayment}
                      disabled={selectedMensalidades.length === 0}
                      className="flex-1 gradient-primary transition-all duration-200 hover:scale-105"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Confirmation Dialog */}
    <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Descartar seleção?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem {selectedMensalidades.length} {selectedMensalidades.length === 1 ? 'mês selecionado' : 'meses selecionados'}. 
            Tem certeza que deseja cancelar e perder esta seleção?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelConfirmed} className="bg-destructive hover:bg-destructive/90">
            Sim, Descartar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
