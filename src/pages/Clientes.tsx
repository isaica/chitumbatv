import { useState, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, User, CreditCard, AlertCircle, DollarSign, Download, FileText, FileSpreadsheet, FileDown, Printer, Users, CheckCircle, XCircle, Filter } from 'lucide-react';
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
import { confirmPayments } from '@/services/payments';
import { Client, Mensalidade } from '@/types';
import { calculateClientPaymentStatus, getStatusLabel, getStatusColor } from '@/utils/paymentStatus';
import { ClientDetailsModal } from '@/components/ui/client-details-modal';
import { QuickPaymentModal } from '@/components/ui/quick-payment-modal';
import { useAuth } from '@/contexts/AuthContext';
import { PaginationWrapper } from '@/components/ui/pagination-wrapper';
import { NoClients, NoSearchResults } from '@/components/ui/empty-states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { MobileTable, MobileCard, MobileActionMenu, StatusBadge } from '@/components/ui/mobile-table';
import { useResponsive } from '@/hooks/use-responsive';
import { exportToExcel, exportToPDF, exportToCSV, ExportColumn, ExportOptions } from '@/utils/export';
import { generateReceipt } from '@/utils/receipt';
import { VirtualTableBody } from '@/components/ui/virtual-table-body';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DateRangeFilter, FilterBar } from '@/components/ui/advanced-filters';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppStore } from '@/stores/useAppStore';

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

export default function Clientes() {
  const { user } = useAuth();
  const { isMobile } = useResponsive();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  
  // Use Zustand store
  const { 
    clients, mensalidades, filiais,
    addClient, updateClient, deleteClient,
    setMensalidades
  } = useAppStore();
  
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
  
  // Advanced Filters
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [minDebt, setMinDebt] = useState<string>('');
  const [maxDebt, setMaxDebt] = useState<string>('');
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const { toast } = useToast();

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
    ? filiais 
    : filiais.filter(f => f.id === user?.filialId);

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
    
    // Advanced Filters
    const matchesDateRange = (!startDate || !endDate) || 
      (client.createdAt >= startDate && client.createdAt <= endDate);
    
    const matchesDebtRange = (() => {
      const minDebtNum = parseFloat(minDebt) || 0;
      const maxDebtNum = parseFloat(maxDebt) || Infinity;
      const clientDebt = client.paymentStatus.totalDebt;
      return clientDebt >= minDebtNum && clientDebt <= maxDebtNum;
    })();
    
    const matchesAddress = !addressSearch || 
      client.address.street.toLowerCase().includes(addressSearch.toLowerCase()) ||
      client.address.neighborhood.toLowerCase().includes(addressSearch.toLowerCase()) ||
      client.address.city.toLowerCase().includes(addressSearch.toLowerCase()) ||
      client.address.province.toLowerCase().includes(addressSearch.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesFilial && hasAccess && 
           matchesDateRange && matchesDebtRange && matchesAddress;
  }), [clientsWithPaymentStatus, searchTerm, statusFilter, filialFilter, user, startDate, endDate, minDebt, maxDebt, addressSearch]);

  const getFilialName = (filialId: string) => {
    return filiais.find(f => f.id === filialId)?.name || 'N/A';
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
      updateClient(editingClient.id, {
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
      });
      toast({
        title: 'Cliente atualizado',
        description: 'Os dados do cliente foram atualizados com sucesso.',
      });
    } else {
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
      addClient(newClient);
      toast({
        title: 'Cliente criado',
        description: 'Novo cliente foi adicionado com sucesso.',
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (client: Client) => {
    deleteClient(client.id);
    toast({
      title: 'Cliente excluído',
      description: 'O cliente foi removido com sucesso.',
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setFilialFilter('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setMinDebt('');
    setMaxDebt('');
    setAddressSearch('');
  };
  
  const activeAdvancedFiltersCount = useMemo(() => {
    let count = 0;
    if (startDate && endDate) count++;
    if (minDebt || maxDebt) count++;
    if (addressSearch) count++;
    return count;
  }, [startDate, endDate, minDebt, maxDebt, addressSearch]);

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
    const updatedMensalidades = confirmPayments(mensalidadeIds, clients, mensalidades);
    setMensalidades(updatedMensalidades);
    
    toast({
      title: 'Pagamento registrado!',
      description: `${mensalidadeIds.length} ${mensalidadeIds.length === 1 ? 'mensalidade foi registrada' : 'mensalidades foram registradas'} com sucesso.`,
    });
    
    setIsPaymentModalOpen(false);
  };

  const handleDeactivateClient = (clientId: string, reason: string, technician: string) => {
    updateClient(clientId, { status: 'inativo' });
    
    console.log('Cliente desativado:', {
      clientId,
      reason,
      technician,
      deactivatedAt: new Date().toISOString()
    });

    setIsDetailsOpen(false);
    
    toast({
      title: 'Cliente desativado',
      description: 'O cliente foi desativado com sucesso.',
    });
  };

  const handleReactivateClient = (clientId: string, reason: string, responsible: string) => {
    updateClient(clientId, { status: 'ativo' });
    
    console.log('Cliente reativado:', {
      clientId,
      reason,
      responsible,
      reactivatedAt: new Date().toISOString()
    });

    setIsDetailsOpen(false);
    
    toast({
      title: 'Cliente reativado',
      description: 'O cliente foi reativado com sucesso.',
    });
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

  const getLastPaymentDate = (clientId: string) => {
    const paidMensalidades = mensalidades
      .filter(m => m.clientId === clientId && m.status === 'pago')
      .sort((a, b) => new Date(b.paidAt!).getTime() - new Date(a.paidAt!).getTime());
    
    return paidMensalidades[0]?.paidAt;
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const exportData = filteredClients.map(client => ({
      name: client.name,
      phone: client.phone,
      email: client.email,
      filial: getFilialName(client.filialId),
      status: getStatusLabel(client.paymentStatus.status),
      lastPayment: getLastPaymentDate(client.id),
      overdueMonths: client.paymentStatus.overdueCount,
      totalDebt: client.paymentStatus.totalDebt,
      createdAt: client.createdAt
    }));

    const columns: ExportColumn[] = [
      { key: 'name', title: 'Nome', width: 40 },
      { key: 'phone', title: 'Telefone', width: 25 },
      { key: 'email', title: 'Email', width: 35 },
      { key: 'filial', title: 'Filial', width: 30 },
      { key: 'status', title: 'Status', width: 20 },
      { 
        key: 'lastPayment', 
        title: 'Último Pagamento', 
        width: 25,
        format: (value) => value ? new Date(value).toLocaleDateString('pt-AO') : 'Nunca'
      },
      { 
        key: 'totalDebt', 
        title: 'Dívida Total', 
        width: 25,
        format: (value) => formatCurrency(value)
      },
      { key: 'overdueMonths', title: 'Meses em Atraso', width: 20 },
    ];

    let subtitle = 'Todos os clientes';
    if (statusFilter !== 'all') {
      subtitle = `Clientes ${getStatusLabel(statusFilter)}`;
    }
    if (filialFilter !== 'all') {
      const filialName = getFilialName(filialFilter);
      subtitle += ` - Filial ${filialName}`;
    }

    const options: ExportOptions = {
      filename: `clientes_${statusFilter}_${new Date().toISOString().split('T')[0]}`,
      title: 'Lista de Clientes - ALF Chitumba',
      subtitle,
      columns,
      data: exportData,
      author: user?.name || 'Sistema',
      orientation: 'landscape'
    };

    switch (format) {
      case 'pdf':
        exportToPDF(options);
        break;
      case 'excel':
        exportToExcel(options);
        break;
      case 'csv':
        exportToCSV(options);
        break;
    }

    toast({
      title: 'Exportação concluída!',
      description: `${filteredClients.length} clientes exportados em ${format.toUpperCase()}.`,
    });
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gradient">Gestão de Clientes</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Gerencie os clientes e mensalidades da ALF Chitumba
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileDown className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleOpenDialog()}
                className="gradient-primary shadow-primary text-xs sm:text-sm"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Cliente</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </DialogTitle>
                <DialogDescription>
                  {editingClient 
                    ? 'Atualize as informações do cliente.' 
                    : 'Preencha os dados do novo cliente.'
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="document">Documento (BI)</Label>
                    <Input
                      id="document"
                      placeholder="000000000LA000"
                      {...register('document')}
                      className={errors.document ? 'border-destructive' : ''}
                    />
                    {errors.document && (
                      <p className="text-sm text-destructive">{errors.document.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Endereço</Label>
                  <Input
                    id="street"
                    placeholder="Rua, número, complemento"
                    {...register('street')}
                    className={errors.street ? 'border-destructive' : ''}
                  />
                  {errors.street && (
                    <p className="text-sm text-destructive">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Bairro"
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="filialId">Filial</Label>
                    <Select 
                      onValueChange={(value) => setValue('filialId', value)}
                      defaultValue={editingClient?.filialId || (user?.role !== 'admin' ? user?.filialId : undefined)}
                    >
                      <SelectTrigger className={errors.filialId ? 'border-destructive' : ''}>
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
                    {errors.filialId && (
                      <p className="text-sm text-destructive">{errors.filialId.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      onValueChange={(value: 'ativo' | 'inativo') => setValue('status', value)}
                      defaultValue={editingClient?.status || 'ativo'}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
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
      </div>

      {/* Status Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">clientes cadastrados</p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Em Dia</CardTitle>
            <CheckCircle className="w-4 h-4 text-success" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-success">{paidCount}</div>
            <p className="text-xs text-muted-foreground">pagamentos ok</p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-0 shadow-primary border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Kilapeiros</CardTitle>
            <AlertCircle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-destructive">{kilapeiroCount}</div>
            <p className="text-xs text-muted-foreground">com atraso</p>
          </CardContent>
        </Card>
        
        <Card className="gradient-card border-0 shadow-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Inativos</CardTitle>
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="text-lg sm:text-2xl font-bold text-muted-foreground">{inativoCount}</div>
            <p className="text-xs text-muted-foreground">desativados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-primary">
        <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
          <CardTitle className="text-base sm:text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pago">Em Dia</SelectItem>
                  <SelectItem value="kilapeiro">Kilapeiros</SelectItem>
                  <SelectItem value="inativo">Inativos</SelectItem>
                </SelectContent>
              </Select>
              {user?.role === 'admin' && (
                <Select value={filialFilter} onValueChange={setFilialFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filial" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Filiais</SelectItem>
                    {filiais.map((filial) => (
                      <SelectItem key={filial.id} value={filial.id}>
                        {filial.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Collapsible open={showAdvancedFilters} onOpenChange={setShowAdvancedFilters}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtros Avançados
                    {activeAdvancedFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeAdvancedFiltersCount}
                      </Badge>
                    )}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Data de Cadastro</Label>
                    <DateRangeFilter
                      startDate={startDate}
                      endDate={endDate}
                      onDateChange={(start, end) => {
                        setStartDate(start);
                        setEndDate(end);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dívida Mínima (AOA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minDebt}
                      onChange={(e) => setMinDebt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dívida Máxima (AOA)</Label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={maxDebt}
                      onChange={(e) => setMaxDebt(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      placeholder="Buscar por endereço..."
                      value={addressSearch}
                      onChange={(e) => setAddressSearch(e.target.value)}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedClients.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedClients.length} cliente(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('remind')}>
                  Enviar Lembretes
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                  Exportar Selecionados
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setSelectedClients([])}>
                  Limpar Seleção
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {filteredClients.length === 0 ? (
        searchTerm || statusFilter !== 'all' || filialFilter !== 'all' ? (
          <NoSearchResults searchTerm={searchTerm} onClear={clearSearch} />
        ) : (
          <NoClients onCreate={() => handleOpenDialog()} />
        )
      ) : (
        <PaginationWrapper data={filteredClients} itemsPerPage={10}>
          {(paginatedClients, paginationInfo, paginationElement) => (
            <div className="space-y-4">
              <Card className="border-0 shadow-primary overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <CardTitle className="text-base sm:text-lg">
                      Clientes ({paginationInfo.totalItems})
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Mostrando {paginationInfo.startIndex + 1}-{Math.min(paginationInfo.endIndex, paginationInfo.totalItems)} de {paginationInfo.totalItems}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {isMobile ? (
                    <div className="divide-y">
                      {paginatedClients.map((client) => (
                        <MobileCard
                          key={client.id}
                          actions={
                            <MobileActionMenu
                              actions={[
                                { label: 'Ver Detalhes', onClick: () => handleViewDetails(client) },
                                { label: 'Registrar Pagamento', onClick: () => handleRegisterPayment(client.id) },
                                { label: 'Editar', onClick: () => handleOpenDialog(client) },
                                { label: 'Excluir', onClick: () => handleDelete(client), variant: 'destructive' },
                              ]}
                            />
                          }
                        >
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{getFilialName(client.filialId)}</div>
                          <div className="mt-2 flex items-center gap-2">
                            <StatusBadge status={getStatusLabel(client.paymentStatus.status)} />
                          </div>
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Telefone:</span> {client.phone}
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Dívida:</span> {formatCurrency(client.paymentStatus.totalDebt)}
                          </div>
                        </MobileCard>
                      ))}
                    </div>
                  ) : (
                    <div ref={tableScrollRef} className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">
                              <Checkbox
                                checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                                onCheckedChange={handleSelectAll}
                              />
                            </TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>Filial</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Dívida</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedClients.map((client) => (
                            <TableRow key={client.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedClients.includes(client.id)}
                                  onCheckedChange={() => handleSelectClient(client.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{client.name}</div>
                                  <div className="text-sm text-muted-foreground">{client.document}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div>{client.phone}</div>
                                  <div className="text-muted-foreground">{client.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{getFilialName(client.filialId)}</TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(client.paymentStatus.status)}>
                                  {getStatusLabel(client.paymentStatus.status)}
                                </Badge>
                                {client.paymentStatus.overdueCount > 0 && (
                                  <span className="ml-2 text-xs text-destructive">
                                    ({client.paymentStatus.overdueCount} meses)
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={client.paymentStatus.totalDebt > 0 ? 'text-destructive font-medium' : ''}>
                                  {formatCurrency(client.paymentStatus.totalDebt)}
                                </span>
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
                                      onClick={() => handleDelete(client)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
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
      {detailsClient && (
        <ClientDetailsModal
          client={detailsClient}
          mensalidades={mensalidades.filter(m => m.clientId === detailsClient.id)}
          paymentStatus={calculateClientPaymentStatus(detailsClient, mensalidades.filter(m => m.clientId === detailsClient.id))}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setDetailsClient(null);
          }}
          onRegisterPayment={() => handleRegisterPayment(detailsClient.id)}
          onDeactivateClient={handleDeactivateClient}
          onReactivateClient={handleReactivateClient}
        />
      )}

      {/* Payment Modal */}
      {paymentClient && (
        <QuickPaymentModal
          client={paymentClient}
          mensalidades={mensalidades.filter(m => m.clientId === paymentClient.id)}
          open={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentClient(null);
          }}
          onPayment={handleConfirmPayment}
        />
      )}
    </div>
  );
}
