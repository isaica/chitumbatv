import { useState, useMemo, useEffect } from 'react';
import { Search, CheckCircle, Clock, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { mockMensalidades, mockClients, mockFiliais } from '@/data/mock';
import { Mensalidade, Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PaginationWrapper } from '@/components/ui/pagination-wrapper';
import { NoMensalidades, NoSearchResults } from '@/components/ui/empty-states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { QuickPaymentModal } from '@/components/ui/quick-payment-modal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { confirmPayments } from '@/services/payments';
import { loadOrInit, set as storageSet, get as storageGet } from '@/services/storage';
import { generateReceipt } from '@/utils/receipt';
import { VirtualTableBody } from '@/components/ui/virtual-table-body';
import { useRef } from 'react';

function reviveMensalidades(data: Mensalidade[]): Mensalidade[] {
  return data.map(m => ({
    ...m,
    dueDate: new Date(m.dueDate as any),
    paidAt: m.paidAt ? new Date(m.paidAt as any) : undefined,
    createdAt: new Date(m.createdAt as any),
  }));
}

export default function Mensalidades() {
  const { user } = useAuth();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>(reviveMensalidades(loadOrInit('mensalidades', mockMensalidades)));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente' | 'atrasado'>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [filialFilter, setFilialFilter] = useState<string>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClientForPayment, setSelectedClientForPayment] = useState<Client | null>(null);
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    storageSet('mensalidades', mensalidades);
  }, [mensalidades]);

  // Filter mensalidades based on user role
  const userFilialClients = user?.role === 'admin' 
    ? mockClients 
    : mockClients.filter(c => c.filialId === user?.filialId);
  
  const userFilialClientIds = userFilialClients.map(c => c.id);

  const filteredMensalidades = useMemo(() => {
    return mensalidades.filter((mensalidade) => {
      const client = mockClients.find(c => c.id === mensalidade.clientId);
      if (!client) return false;

      if (!userFilialClientIds.includes(mensalidade.clientId)) return false;

      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || mensalidade.status === statusFilter;
      const matchesMonth = monthFilter === 'all' || 
        `${mensalidade.year}-${mensalidade.month.toString().padStart(2, '0')}` === monthFilter;
      const matchesFilial = filialFilter === 'all' || client.filialId === filialFilter;
      
      return matchesSearch && matchesStatus && matchesMonth && matchesFilial;
    });
  }, [mensalidades, searchTerm, statusFilter, monthFilter, filialFilter, userFilialClientIds]);

  const getClientName = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId);
    return client?.name || 'Cliente não encontrado';
  };

  const getClientFilial = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId);
    if (!client) return 'N/A';
    const filial = mockFiliais.find(f => f.id === client.filialId);
    return filial?.name || 'N/A';
  };

  const handleMarkAsPaid = (mensalidadeId: string) => {
    const target = mensalidades.find(m => m.id === mensalidadeId);
    setMensalidades(prev => prev.map(m => 
      m.id === mensalidadeId 
        ? { ...m, status: 'pago' as const, paidAt: new Date() }
        : m
    ));
    
    toast({
      title: 'Mensalidade marcada como paga',
      description: 'O pagamento foi registrado com sucesso.',
    });
    if (target) generateReceipt({ ...target, status: 'pago', paidAt: new Date() });
  };

  const handlePayment = (mensalidadeIds: string[]) => {
    setMensalidades(prev => confirmPayments(mensalidadeIds, mockClients, prev));
    
    toast({
      title: 'Pagamento registrado!',
      description: `${mensalidadeIds.length} ${mensalidadeIds.length === 1 ? 'mensalidade foi registrada' : 'mensalidades foram registradas'} com sucesso.`,
    });
    
    setIsPaymentModalOpen(false);
  };

  const handleOpenPaymentModal = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId);
    if (client) {
      setSelectedClientForPayment(client);
      setIsPaymentModalOpen(true);
    }
  };

  const handleOpenGlobalPayment = () => {
    setIsClientPickerOpen(true);
  };

  const handleClientPicked = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId) || null;
    setSelectedClientForPayment(client);
    setIsClientPickerOpen(false);
    setIsPaymentModalOpen(!!client);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pago':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pendente':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'atrasado':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  // Generate month options for the last 6 months
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthString = month.toString().padStart(2, '0');
      const monthName = date.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
      
      options.push({
        value: `${year}-${monthString}`,
        label: monthName.charAt(0).toUpperCase() + monthName.slice(1)
      });
    }
    
    return options;
  };

  const clearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMonthFilter('all');
    setFilialFilter('all');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Mensalidades</h1>
          <p className="text-muted-foreground">
            Controle os pagamentos dos clientes da ALF Chitumba
          </p>
        </div>
        <Button className="gradient-primary" onClick={handleOpenGlobalPayment}>
          <CreditCard className="w-4 h-4 mr-2" />
          Registrar Pagamento
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensalidades</CardTitle>
            <Calendar className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredMensalidades.length}</div>
            <p className="text-xs text-muted-foreground">mensalidades registradas</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagas</CardTitle>
            <CheckCircle className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {filteredMensalidades.filter(m => m.status === 'pago').length}
            </div>
            <p className="text-xs text-muted-foreground">mensalidades quitadas</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {filteredMensalidades.filter(m => m.status === 'pendente').length}
            </div>
            <p className="text-xs text-muted-foreground">aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {filteredMensalidades.filter(m => m.status === 'atrasado').length}
            </div>
            <p className="text-xs text-muted-foreground">em atraso</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Mês/Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Meses</SelectItem>
                {generateMonthOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user?.role === 'admin' && (
              <Select value={filialFilter} onValueChange={setFilialFilter}>
                <SelectTrigger>
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

      {/* Results */}
      {filteredMensalidades.length === 0 ? (
        searchTerm || statusFilter !== 'all' || monthFilter !== 'all' || filialFilter !== 'all' ? (
          <NoSearchResults searchTerm={searchTerm} onClear={clearSearch} />
        ) : (
          <NoMensalidades />
        )
      ) : (
        <PaginationWrapper data={filteredMensalidades} itemsPerPage={15}>
          {(paginatedMensalidades, paginationInfo, paginationElement) => (
            <div className="space-y-4">
              <Card className="border-0 shadow-primary">
                <CardHeader>
                  <CardTitle>
                    Mensalidades ({paginationInfo.totalItems})
                  </CardTitle>
                <CardDescription>
                  Lista de mensalidades dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table className="w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[220px]">Cliente</TableHead>
                      <TableHead className="w-[170px]">Período</TableHead>
                      <TableHead className="w-[120px]">Valor</TableHead>
                      {user?.role === 'admin' && <TableHead className="w-[160px]">Filial</TableHead>}
                      <TableHead className="w-[140px]">Vencimento</TableHead>
                      <TableHead className="w-[120px]">Status</TableHead>
                      <TableHead className="w-[220px] text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMensalidades.map((mensalidade) => (
                      <TableRow key={mensalidade.id}>
                        <TableCell>
                          <div className="font-medium truncate">{getClientName(mensalidade.clientId)}</div>
                        </TableCell>
                        <TableCell>
                          {new Date(mensalidade.year, mensalidade.month - 1).toLocaleDateString('pt-AO', {
                            month: 'long',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">{mensalidade.amount.toLocaleString()} AOA</span>
                        </TableCell>
                        {user?.role === 'admin' && (
                          <TableCell className="truncate">{getClientFilial(mensalidade.clientId)}</TableCell>
                        )}
                        <TableCell>
                          <span className="whitespace-nowrap">{mensalidade.dueDate.toLocaleDateString('pt-AO')}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(mensalidade.status)}
                            <Badge 
                              variant={
                                mensalidade.status === 'pago' ? 'default' :
                                mensalidade.status === 'pendente' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {mensalidade.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {mensalidade.status !== 'pago' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleMarkAsPaid(mensalidade.id)}
                                className="gradient-primary"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Marcar como Pago
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleOpenPaymentModal(mensalidade.clientId)}
                              >
                                <CreditCard className="w-4 h-4 mr-2" />
                                Registrar Pagamento
                              </Button>
                            </div>
                          )}
                          {mensalidade.status === 'pago' && mensalidade.paidAt && (
                            <div className="flex items-center justify-end gap-2">
                              <div className="text-sm text-muted-foreground mr-2 whitespace-nowrap">
                                Pago em {mensalidade.paidAt.toLocaleDateString('pt-AO')}
                              </div>
                              <Button size="sm" variant="outline" onClick={() => generateReceipt(mensalidade)}>
                                Recibo
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            {paginationElement}
            </div>
          )}
        </PaginationWrapper>
      )}
      {selectedClientForPayment && (
        <QuickPaymentModal
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedClientForPayment(null);
          }}
          client={selectedClientForPayment}
          mensalidades={mensalidades}
          onPayment={handlePayment}
        />
      )}

      <Dialog open={isClientPickerOpen} onOpenChange={setIsClientPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecionar Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Select onValueChange={handleClientPicked}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>
              <SelectContent>
                {(user?.role === 'admin' ? mockClients : mockClients.filter(c => c.filialId === user?.filialId)).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}