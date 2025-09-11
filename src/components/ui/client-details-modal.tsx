import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, MapPin, Phone, Mail, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Client, Mensalidade } from '@/types';
import { ClientPaymentStatus, getStatusLabel, getStatusColor } from '@/utils/paymentStatus';
import { mockFiliais } from '@/data/mock';

interface ClientDetailsModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  paymentStatus: ClientPaymentStatus;
  mensalidades: Mensalidade[];
  onRegisterPayment?: (clientId: string) => void;
}

export function ClientDetailsModal({
  client,
  isOpen,
  onClose,
  paymentStatus,
  mensalidades,
  onRegisterPayment
}: ClientDetailsModalProps) {
  if (!client) return null;

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
              {paymentStatus.status === 'inadimplente' && (
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
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}