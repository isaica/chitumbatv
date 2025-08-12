import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { mockClients, mockFiliais, mockPlans } from '@/data/mock';
import { Client } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const clientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  street: z.string().min(1, 'Endereço é obrigatório'),
  neighborhood: z.string().min(1, 'Bairro é obrigatório'),
  city: z.string().min(1, 'Cidade é obrigatória'),
  province: z.string().min(1, 'Província é obrigatória'),
  document: z.string().min(1, 'Documento é obrigatório'),
  planId: z.string().min(1, 'Plano é obrigatório'),
  filialId: z.string().min(1, 'Filial é obrigatória'),
  status: z.enum(['ativo', 'inativo', 'suspenso']),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function Clientes() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo' | 'suspenso'>('all');
  const [filialFilter, setFilialFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
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
    ? mockFiliais 
    : mockFiliais.filter(f => f.id === user?.filialId);

  const filteredClients = clients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesFilial = filialFilter === 'all' || client.filialId === filialFilter;
    const matchesPlan = planFilter === 'all' || client.planId === planFilter;
    
    // Non-admin users can only see their filial's clients
    const hasAccess = user?.role === 'admin' || client.filialId === user?.filialId;
    
    return matchesSearch && matchesStatus && matchesFilial && matchesPlan && hasAccess;
  });

  const getFilialName = (filialId: string) => {
    return mockFiliais.find(f => f.id === filialId)?.name || 'N/A';
  };

  const getPlanName = (planId: string) => {
    return mockPlans.find(p => p.id === planId)?.name || 'N/A';
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
      setValue('planId', client.planId);
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
              planId: data.planId,
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
        planId: data.planId,
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os clientes da Chitumba TV
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="gradient-primary shadow-primary"
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
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planId">Plano</Label>
                  <Select onValueChange={(value) => setValue('planId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {plan.price.toLocaleString()} AOA
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Select onValueChange={(value: 'ativo' | 'inativo' | 'suspenso') => setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="suspenso">Suspenso</SelectItem>
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
                placeholder="Buscar por nome, email ou telefone..."
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
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
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
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                {mockPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="border-0 shadow-primary">
        <CardHeader>
          <CardTitle>
            Clientes ({filteredClients.length})
          </CardTitle>
          <CardDescription>
            Lista de clientes da Chitumba TV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Plano</TableHead>
                {user?.role === 'admin' && <TableHead>Filial</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-sm text-muted-foreground">{client.document}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{client.phone}</div>
                      <div className="text-muted-foreground">{client.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getPlanName(client.planId)}
                    </Badge>
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell>{getFilialName(client.filialId)}</TableCell>
                  )}
                  <TableCell>
                    <Badge 
                      variant={
                        client.status === 'ativo' ? 'default' :
                        client.status === 'suspenso' ? 'destructive' :
                        'secondary'
                      }
                    >
                      {client.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}