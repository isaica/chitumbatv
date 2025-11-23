import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, User, CreditCard, AlertCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { mockClients, mockFiliais, mockMensalidades } from '@/data/mock';
import { loadOrInit, set as storageSet } from '@/services/storage';
import { confirmPayments } from '@/services/payments';
import { Client, Mensalidade } from '@/types';
import { calculateClientPaymentStatus, ClientPaymentStatus, getStatusLabel, getStatusColor } from '@/utils/paymentStatus';
import { ClientDetailsModal } from '@/components/ui/client-details-modal';
import { QuickPaymentModal } from '@/components/ui/quick-payment-modal';
import { useAuth } from '@/contexts/AuthContext';
import { PaginationWrapper } from '@/components/ui/pagination-wrapper';
import { NoClients, NoSearchResults } from '@/components/ui/empty-states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { MobileTable, MobileCard, MobileActionMenu, StatusBadge } from '@/components/ui/mobile-table';
import { useResponsive } from '@/hooks/use-responsive';
import { exportToExcel } from '@/utils/export';
import { generateReceipt } from '@/utils/receipt';
import { VirtualTableBody } from '@/components/ui/virtual-table-body';
import { useRef } from 'react';

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  street: z.string().min(1, 'Endereço é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  province: z.string().min(1, 'Província é obrigatória'),
  document: z.string().min(1, 'Documento é obrigatório'),
  filialId: z.string().min(1, 'Filial é obrigatória'),
  status: z.enum(['ativo', 'inativo']),
});

type ClientFormData = z.infer<typeof clientSchema>;

function reviveMensalidades(data: Mensalidade[]): Mensalidade[] {
  return data.map(m => ({
    ...m,
    dueDate: new Date(m.dueDate as any),
    paidAt: m.paidAt ? new Date(m.paidAt as any) : undefined,
    createdAt: new Date(m.createdAt as any),
  }));
}

export default function Clientes() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<Client[]>(loadOrInit('clients', mockClients).map(c => ({ ...c, createdAt: new Date(c.createdAt as any) })));
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>(reviveMensalidades(loadOrInit('mensalidades', mockMensalidades)));
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'kilapeiro' | 'inativo'>('all');
  const [filialFilter, setFilialFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [detailsClient, setDetailsClient] = useState<Client | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [paymentClient, setPaymentClient] = useState<Client | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    storageSet('clients', clients);
  }, [clients]);

  useEffect(() => {
    storageSet('mensalidades', mensalidades);
  }, [mensalidades]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      status: 'ativo',
      province: 'Luanda',
      city: 'Luanda',
    },
  });

  // Filter filiais based on user role
  const availableFiliais = user?.role === 'admin' 
    ? mockFiliais 
    : mockFiliais.filter(f => f.id === user?.filialId);

  // Calculate payment status for all clients
  const clientsWithPaymentStatus = useMemo(() => {
    return clients.map(client => ({
      ...client,
      paymentStatus: calculateClientPaymentStatus(client, mensalidades)
    }));
  }, [clients, mensalidades]);

  const filteredClients = useMemo(() => clientsWithPaymentStatus.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || client.paymentStatus.status === statusFilter;
    
    const matchesFilial = filialFilter === 'all' || client.filialId === filialFilter;
    
    const hasAccess = user?.role === 'admin' || client.filialId === user?.filialId;
    
    return matchesSearch && matchesStatus && matchesFilial && hasAccess;
  }), [clientsWithPaymentStatus, searchTerm, statusFilter, filialFilter, user]);

  const getFilialName = (filialId: string) => {
    return mockFiliais.find(f => f.id === filialId)?.name || 'N/A';
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setValue('name', client.name);
      setValue('phone', client.phone);
      setValue('email', client.email);
      setValue('street', client.address.street);
      setValue('neighborhood', client.address.neighborhood);
      setValue('city', client.address.city);
      setValue('province', client.address.province);
      setValue('document', client.document);
      setValue('filialId', client.filialId);
      setValue('status', client.status);
    } else {
      setEditingClient(null);
      reset();
      // Set default filial for non-admin users
      if (user?.role !== 'admin' && user?.filialId) {
        setValue('filialId', user.filialId);
      }
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingClient(null);
    reset();
  };

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      // Update existing client
      setClients(prev => prev.map(c => 
        c.id === editingClient.id 
          ? { 
              ...c, 
              name: data.name,
              phone: data.phone,
              email: data.email,
              address: {
                street: data.street,
                neighborhood: data.neighborhood,
                city: data.city,
                province: data.province,
              },
              document: data.document,
              filialId: data.filialId,
              status: data.status,
            }
          : c
      ));
      toast({
        title: 'Cliente atualizado',
        description: 'Os dados do cliente foram atualizados com sucesso.',
      });
    } else {
      // Create new client
      const newClient: Client = {
        id: Date.now().toString(),
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: {
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          province: data.province,
        },
        document: data.document,
        filialId: data.filialId,
        status: data.status,
        createdAt: new Date(),
      };
      setClients(prev => [...prev, newClient]);
      toast({
        title: 'Cliente criado',
        description: 'Novo cliente foi adicionado com sucesso.',
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (client: Client) => {
    setClients(prev => prev.filter(c => c.id !== client.id));
    toast({
      title: 'Cliente excluído',
      description: 'O cliente foi removido com sucesso.',
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFilialFilter('all');
  };

  const handleViewDetails = (client: Client) => {
    setDetailsClient(client);
    setIsDetailsOpen(true);
  };

  const handleRegisterPayment = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setPaymentClient(client);
      setIsPaymentModalOpen(true);
    }
  };

  const handleConfirmPayment = (mensalidadeIds: string[]) => {
    setMensalidades(prev => confirmPayments(mensalidadeIds, clients, prev));
    
    toast({
      title: 'Pagamento registrado!',
      description: `${mensalidadeIds.length} ${mensalidadeIds.length === 1 ? 'mensalidade foi registrada' : 'mensalidades foram registradas'} com sucesso.`,
    });
    
    setIsPaymentModalOpen(false);
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleBulkAction = (action: 'remind' | 'export') => {
    if (action === 'remind') {
      toast({
        title: 'Lembretes enviados',
        description: `Lembretes foram enviados para ${selectedClients.length} ${selectedClients.length === 1 ? 'cliente' : 'clientes'}.`,
      });
    } else if (action === 'export') {
      const selectedData = clients.filter(c => selectedClients.includes(c.id));
      exportToExcel({
        filename: 'clientes_selecionados',
        title: 'Clientes Selecionados',
        columns: [
          { key: 'name', title: 'Nome' },
          { key: 'phone', title: 'Telefone' },
          { key: 'email', title: 'Email' },
        ],
        data: selectedData,
      });
    }
    setSelectedClients([]);
  };

  // Calculate status counts
  const kilapeiroCount = clientsWithPaymentStatus.filter(c => c.paymentStatus.status === 'kilapeiro').length;
  const paidCount = clientsWithPaymentStatus.filter(c => c.paymentStatus.status === 'pago').length;
  const inativoCount = clientsWithPaymentStatus.filter(c => c.paymentStatus.status === 'inativo').length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA'
    }).format(value);
  };

  const getCurrentPaidMensalidade = (clientId: string) => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return mensalidades.find(m => m.clientId === clientId && m.month === month && m.year === year && m.status === 'pago');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Gestão de Clientes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie os clientes da ALF Chitumba
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="gradient-primary shadow-primary w-full sm:w-auto"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
              </DialogTitle>
              <DialogDescription>
                {editingClient 
                  ? 'Atualize as informações do cliente.' 
                  : 'Adicione um novo cliente ao sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome do cliente"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    placeholder="Bilhete de identidade"
                    {...register('document')}
                    className={errors.document ? 'border-destructive' : ''}
                  />
                  {errors.document && (
                    <p className="text-sm text-destructive">{errors.document.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="+244 9XX XXX XXX"
                    {...register('phone')}
                    className={errors.phone ? 'border-destructive' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="street">Endereço</Label>
                <Input
                  id="street"
                  placeholder="Rua, número"
                  {...register('street')}
                  className={errors.street ? 'border-destructive' : ''}
                />
                {errors.street && (
                  <p className="text-sm text-destructive">{errors.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Nome do bairro"
                    {...register('neighborhood')}
                    className={errors.neighborhood ? 'border-destructive' : ''}
                  />
                  {errors.neighborhood && (
                    <p className="text-sm text-destructive">{errors.neighborhood.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    {...register('city')}
                    className={errors.city ? 'border-destructive' : ''}
                  />
                  {errors.city && (
                    <p className="text-sm text-destructive">{errors.city.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Província</Label>
                  <Input
                    id="province"
                    placeholder="Província"
                    {...register('province')}
                    className={errors.province ? 'border-destructive' : ''}
                  />
                  {errors.province && (
                    <p className="text-sm text-destructive">{errors.province.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filialId">Filial</Label>
                  <Select onValueChange={(value) => setValue('filialId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a filial" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFiliais.map((filial) => (
                        <SelectItem key={filial.id} value={filial.id}>
                          {filial.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value: 'ativo' | 'inativo') => setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                      {user?.role === 'admin' && (
                        <SelectItem value="inativo">Inativo</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingClient ? 'Atualizar' : 'Criar'} Cliente
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status de Pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="kilapeiro">Kilapeiro</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
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

          {/* Bulk Actions */}
          {selectedClients.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center p-3 bg-muted/50 rounded-lg">
              <Checkbox
                checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium flex-1">
                {selectedClients.length} {selectedClients.length === 1 ? 'cliente selecionado' : 'clientes selecionados'}
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleBulkAction('remind')}
              >
                Enviar Lembretes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('export')}
              >
                Exportar Seleção
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {filteredClients.length === 0 ? (
        searchTerm || statusFilter !== 'all' || filialFilter !== 'all' ? (
          <NoSearchResults searchTerm={searchTerm} onClear={clearSearch} />
        ) : (
          <NoClients onCreate={() => handleOpenDialog()} />
        )
      ) : (
        <PaginationWrapper data={filteredClients} itemsPerPage={isMobile ? 5 : 10}>
          {(paginatedClients, paginationInfo, paginationElement) => (
            <div className="space-y-4">
              <Card className="border-0 shadow-primary">
                <CardHeader>
                  <CardTitle>
                    Clientes ({paginationInfo.totalItems})
                  </CardTitle>
                <CardDescription>
                  Lista de clientes da ALF Chitumba
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  <MobileTable 
                    data={paginatedClients}
                    emptyMessage="Nenhum cliente encontrado"
                    renderCard={(client) => (
                      <MobileCard
                        key={client.id}
                        actions={
                          <MobileActionMenu
                            actions={[
                              {
                                label: 'Ver Detalhes',
                                onClick: () => handleViewDetails(client),
                              },
                              {
                                label: 'Registrar Pagamento',
                                onClick: () => handleRegisterPayment(client.id),
                              },
                              {
                                label: 'Editar',
                                onClick: () => handleOpenDialog(client),
                              },
                              {
                                label: 'Excluir',
                                onClick: () => handleDelete(client),
                                variant: 'destructive' as const,
                              },
                            ]}
                          />
                        }
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg">{client.name}</h3>
                            <Badge className={`${getStatusColor(client.paymentStatus.status)} border text-xs`}>
                              {getStatusLabel(client.paymentStatus.status)}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Telefone</p>
                              <p className="font-medium">{client.phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium truncate">{client.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Filial</p>
                              <p className="font-medium">{getFilialName(client.filialId)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Documento</p>
                              <p className="font-medium">{client.document}</p>
                            </div>
                          </div>

                          {client.paymentStatus.totalDebt > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-700">Dívida Pendente</span>
                                </div>
                                <span className="text-sm font-bold text-red-600">
                                  {formatCurrency(client.paymentStatus.totalDebt)}
                                </span>
                              </div>
                              <p className="text-xs text-red-600">
                                {client.paymentStatus.overdueCount} mês(es) em atraso
                              </p>
                            </div>
                          )}

                          {client.paymentStatus.status === 'pago' && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">Todas as mensalidades em dia</span>
                            </div>
                          )}
                        </div>
                      </MobileCard>
                    )}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <div style={{ maxHeight: 520, overflowY: 'auto' }} ref={tableScrollRef}>
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Contato</TableHead>
                          <TableHead>Status de Pagamento</TableHead>
                          <TableHead>Dívida</TableHead>
                          <TableHead>Filial</TableHead>
                          <TableHead>Documento</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <VirtualTableBody
                        items={paginatedClients}
                        height={520}
                        rowHeight={64}
                        containerRef={tableScrollRef}
                        renderRow={(client) => (
                          <TableRow 
                            key={client.id} 
                            className={`hover:bg-muted/50 transition-colors ${
                              client.paymentStatus.status === 'kilapeiro' && client.paymentStatus.overdueCount >= 3 ? 'critical-row' :
                              client.paymentStatus.overdueCount >= 2 ? 'warning-row' : ''
                            }`}
                          >
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-sm">
                                  {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <p className="font-medium">{client.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm font-medium">{client.phone}</p>
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge className={`${getStatusColor(client.paymentStatus.status)} border`}>
                                    {getStatusLabel(client.paymentStatus.status)}
                                  </Badge>
                                  {getCurrentPaidMensalidade(client.id) && (
                                    <Button size="sm" variant="outline" onClick={() => generateReceipt(getCurrentPaidMensalidade(client.id)!)}>
                                      Recibo
                                    </Button>
                                  )}
                                </div>
                                {client.paymentStatus.overdueCount > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>{client.paymentStatus.overdueCount} mês(es)</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {client.paymentStatus.totalDebt > 0 ? (
                                <div className="space-y-1">
                                  <p className="font-semibold text-red-600">
                                    {formatCurrency(client.paymentStatus.totalDebt)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {client.paymentStatus.overdueMonths.slice(0, 2).join(', ')}
                                    {client.paymentStatus.overdueMonths.length > 2 && '...'}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CreditCard className="w-4 h-4" />
                                  <span className="text-sm font-medium">Em dia</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{getFilialName(client.filialId)}</span>
                            </TableCell>
                            <TableCell>
                              <span className="font-mono text-sm">{client.document}</span>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleRegisterPayment(client.id)}>
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Registrar Pagamento
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleOpenDialog(client)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => handleDelete(client)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )}
                      />
                    </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            {paginationElement}
            </div>
          )}
        </PaginationWrapper>
      )}

      {/* Client Details Modal */}
      <ClientDetailsModal
        client={detailsClient}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        paymentStatus={detailsClient ? calculateClientPaymentStatus(detailsClient, mensalidades) : {} as ClientPaymentStatus}
        mensalidades={mensalidades}
        onRegisterPayment={handleRegisterPayment}
      />

      {/* Quick Payment Modal */}
      {paymentClient && (
        <QuickPaymentModal
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentClient(null);
          }}
          client={paymentClient}
          mensalidades={mensalidades}
          onPayment={handleConfirmPayment}
        />
      )}
    </div>
  );
}