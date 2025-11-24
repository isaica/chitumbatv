import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, MapPin, Phone, Mail, Calendar, CreditCard, AlertCircle, TrendingUp, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { Client, Mensalidade } from '@/types';
import { ClientPaymentStatus, getStatusLabel, getStatusColor } from '@/utils/paymentStatus';
import { mockFiliais } from '@/data/mock';
import { useToast } from '@/hooks/use-toast';

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  paymentStatus: ClientPaymentStatus;
  mensalidades: Mensalidade[];
  onRegisterPayment?: (clientId: string) => void;
  onDeactivateClient?: (clientId: string, reason: string, technician: string) => void;
}

export function ClientDetailsModal({
  client,
  isOpen,
  onClose,
  paymentStatus,
  mensalidades,
  onRegisterPayment,
  onDeactivateClient
}: ClientDetailsModalProps) {
  const { toast } = useToast();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [technicianName, setTechnicianName] = useState('');

  if (!client) return null;

  const handleDeactivateSubmit = () => {
    if (!deactivateReason.trim() || !technicianName.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos antes de desativar o cliente.',
        variant: 'destructive'
      });
      return;
    }

    if (onDeactivateClient) {
      onDeactivateClient(client.id, deactivateReason, technicianName);
    }

    // Reset form
    setDeactivateReason('');
    setTechnicianName('');
    setShowDeactivateDialog(false);
    
    toast({
      title: 'Cliente desativado',
      description: `${client.name} foi desativado com sucesso.`
    });
  };

  const filial = mockFiliais.find(f => f.id === client.filialId);
  const clientMensalidades = mensalidades
    .filter(m => m.clientId === client.id)
    .sort((a, b) => new Date(b.year, b.month - 1).getTime() - new Date(a.year, a.month - 1).getTime());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[month - 1];
  };

  // Get last 6 months payment history
  const getLast6MonthsHistory = () => {
    const history = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const mensalidade = clientMensalidades.find(m => m.year === year && m.month === month);
      
      history.push({
        month: getMonthName(month).substring(0, 3),
        year,
        fullMonth: month,
        status: mensalidade?.status || 'pendente',
        paid: mensalidade?.status === 'pago'
      });
    }
    
    return history;
  };

  const paymentHistory = getLast6MonthsHistory();

  // Determine recommended actions
  const getRecommendedActions = () => {
    if (paymentStatus.status === 'inativo') {
      return [
        { label: 'Reativar Cliente', variant: 'secondary' as const }
      ];
    }
    if (paymentStatus.status === 'kilapeiro' || paymentStatus.totalDebt > 0) {
      return [
        { label: 'Enviar Lembrete', variant: 'default' as const },
        { label: 'Registrar Pagamento', variant: 'secondary' as const }
      ];
    }
    return [
      { label: 'Ver Histórico Completo', variant: 'secondary' as const }
    ];
  };

  const recommendedActions = getRecommendedActions();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detalhes do Cliente
          </DialogTitle>
          <DialogDescription>
            Informações completas e histórico de pagamentos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Timeline Chart */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Histórico de Pagamentos (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between gap-2 h-32">
                {paymentHistory.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center h-24">
                      {item.paid ? (
                        <div className="w-full bg-success/20 border-2 border-success rounded-t-lg flex items-center justify-center h-full animate-in fade-in slide-in-from-bottom-4">
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        </div>
                      ) : (
                        <div className="w-full bg-destructive/20 border-2 border-destructive rounded-t-lg flex items-center justify-center h-16">
                          <XCircle className="w-4 h-4 text-destructive" />
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium">{item.month}</p>
                      <p className="text-[10px] text-muted-foreground">{item.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status de Pagamento */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Status de Pagamento</span>
                <Badge className={`${getStatusColor(paymentStatus.status)} border px-3 py-1`}>
                  {getStatusLabel(paymentStatus.status)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentStatus.status === 'kilapeiro' && !paymentStatus.currentMonthPaid && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-700 font-medium">Cliente não pagou o mês atual</span>
                </div>
              )}

              {paymentStatus.totalDebt > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Dívida Total</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(paymentStatus.totalDebt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Meses em Atraso</p>
                    <div className="flex flex-wrap gap-1">
                      {paymentStatus.overdueMonths.map((month, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {month}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {paymentStatus.status === 'pago' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Todas as mensalidades em dia!</span>
                </div>
              )}

              {/* Recommended Actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Ações Recomendadas</p>
                <div className="flex flex-wrap gap-2">
                  {recommendedActions.map((action, index) => (
                    <Button 
                      key={index}
                      variant={action.variant}
                      size="sm"
                      onClick={() => {
                        if (action.label === 'Registrar Pagamento' && onRegisterPayment) {
                          onRegisterPayment(client.id);
                        }
                      }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                  <p className="font-semibold">{client.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Documento</p>
                  <p>{client.document}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    <p>{client.address.street}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.address.neighborhood}, {client.address.city}, {client.address.province}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Filial */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Filial</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Filial</p>
                  <p className="font-semibold">{filial?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mensalidade</p>
                  <p className="text-lg font-bold text-primary">
                    {formatCurrency(filial?.monthlyPrice || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Responsável</p>
                  <p>{filial?.responsavel}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Contato da Filial</p>
                  <p>{filial?.phone}</p>
                  <p className="text-sm text-muted-foreground">{filial?.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico de Pagamentos */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de Pagamentos</CardTitle>
                {paymentStatus.totalDebt > 0 && onRegisterPayment && (
                  <Button 
                    onClick={() => onRegisterPayment(client.id)}
                    className="gradient-primary"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Registrar Pagamento
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {clientMensalidades.slice(0, 6).map((mensalidade, index) => (
                  <div key={mensalidade.id}>
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="font-semibold">
                            {getMonthName(mensalidade.month)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mensalidade.year}
                          </p>
                        </div>
                        <div>
                          <p className="font-medium">
                            {formatCurrency(mensalidade.amount)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Venc: {new Date(mensalidade.dueDate).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={mensalidade.status === 'pago' ? 'default' : 'destructive'}
                          className="mb-1"
                        >
                          {mensalidade.status === 'pago' ? 'Pago' : 
                           mensalidade.status === 'pendente' ? 'Pendente' : 'Atrasado'}
                        </Badge>
                        {mensalidade.paidAt && (
                          <p className="text-xs text-muted-foreground">
                            Pago em {new Date(mensalidade.paidAt).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    {index < clientMensalidades.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-3 pt-4">
            <div>
              {client.status === 'ativo' && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeactivateDialog(true)}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  Desativar Cliente
                </Button>
              )}
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Deactivate Client Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-destructive" />
              Desativar Cliente
            </DialogTitle>
            <DialogDescription>
              Informe os motivos da desativação e o técnico responsável pelo corte do sinal
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="technician">Nome do Técnico *</Label>
              <Input
                id="technician"
                placeholder="Ex: João Silva"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Desativação *</Label>
              <Textarea
                id="reason"
                placeholder="Descreva os motivos para desativar este cliente..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                rows={4}
              />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Atenção:</strong> Esta ação irá desativar o cliente <strong>{client.name}</strong>. 
                O histórico de pagamentos será mantido.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeactivateDialog(false);
                setDeactivateReason('');
                setTechnicianName('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeactivateSubmit}
            >
              Confirmar Desativação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}