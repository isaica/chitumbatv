import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Trash2, Building2, MoreHorizontal } from 'lucide-react';
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
import { mockFiliais, mockClients } from '@/data/mock';
import { Filial } from '@/types';
import { PaginationWrapper } from '@/components/ui/pagination-wrapper';
import { NoFiliais, NoSearchResults } from '@/components/ui/empty-states';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

const filialSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido'),
  responsavel: z.string().min(1, 'Responsável é obrigatório'),
  monthlyPrice: z.number().min(0, 'Preço deve ser maior que zero'),
  status: z.enum(['ativa', 'inativa']),
});

type FilialFormData = z.infer<typeof filialSchema>;

export default function Filiais() {
  const [filiais, setFiliais] = useState<Filial[]>(mockFiliais);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativa' | 'inativa'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFilial, setEditingFilial] = useState<Filial | null>(null);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FilialFormData>({
    resolver: zodResolver(filialSchema),
    defaultValues: {
      status: 'ativa',
    },
  });

  const filteredFiliais = filiais.filter((filial) => {
    const matchesSearch = filial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         filial.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || filial.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getClientCount = (filialId: string) => {
    return mockClients.filter(client => client.filialId === filialId).length;
  };

  const handleOpenDialog = (filial?: Filial) => {
    if (filial) {
      setEditingFilial(filial);
      Object.keys(filial).forEach((key) => {
        if (key !== 'id' && key !== 'createdAt') {
          setValue(key as keyof FilialFormData, filial[key as keyof Filial] as any);
        }
      });
    } else {
      setEditingFilial(null);
      reset();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFilial(null);
    reset();
  };

  const onSubmit = (data: FilialFormData) => {
    if (editingFilial) {
      // Update existing filial
      setFiliais(prev => prev.map(f => 
        f.id === editingFilial.id 
          ? { ...f, ...data }
          : f
      ));
      toast({
        title: 'Filial atualizada',
        description: 'Os dados da filial foram atualizados com sucesso.',
      });
    } else {
      // Create new filial
      const newFilial: Filial = {
        id: Date.now().toString(),
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        responsavel: data.responsavel,
        monthlyPrice: data.monthlyPrice,
        status: data.status,
        createdAt: new Date(),
      };
      setFiliais(prev => [...prev, newFilial]);
      toast({
        title: 'Filial criada',
        description: 'Nova filial foi adicionada com sucesso.',
      });
    }
    handleCloseDialog();
  };

  const handleDelete = (filial: Filial) => {
    const clientCount = getClientCount(filial.id);
    if (clientCount > 0) {
      toast({
        title: 'Não é possível excluir',
        description: `Esta filial possui ${clientCount} cliente(s) associado(s).`,
        variant: 'destructive',
      });
      return;
    }

    setFiliais(prev => prev.filter(f => f.id !== filial.id));
    toast({
      title: 'Filial excluída',
      description: 'A filial foi removida com sucesso.',
    });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Gestão de Filiais</h1>
          <p className="text-muted-foreground">
            Gerencie as filiais da ALF Chitumba
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => handleOpenDialog()}
              className="gradient-primary shadow-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Filial
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingFilial ? 'Editar Filial' : 'Nova Filial'}
              </DialogTitle>
              <DialogDescription>
                {editingFilial 
                  ? 'Atualize as informações da filial.' 
                  : 'Adicione uma nova filial ao sistema.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Filial</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Filial Centro"
                    {...register('name')}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <Input
                    id="responsavel"
                    placeholder="Nome do responsável"
                    {...register('responsavel')}
                    className={errors.responsavel ? 'border-destructive' : ''}
                  />
                  {errors.responsavel && (
                    <p className="text-sm text-destructive">{errors.responsavel.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço Completo</Label>
                <Input
                  id="address"
                  placeholder="Rua, número, bairro, cidade"
                  {...register('address')}
                  className={errors.address ? 'border-destructive' : ''}
                />
                {errors.address && (
                  <p className="text-sm text-destructive">{errors.address.message}</p>
                )}
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
                    placeholder="email@chitumba.ao"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPrice">Preço Mensal (AOA)</Label>
                  <Input
                    id="monthlyPrice"
                    type="number"
                    placeholder="2500"
                    {...register('monthlyPrice', { valueAsNumber: true })}
                    className={errors.monthlyPrice ? 'border-destructive' : ''}
                  />
                  {errors.monthlyPrice && (
                    <p className="text-sm text-destructive">{errors.monthlyPrice.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select onValueChange={(value: 'ativa' | 'inativa') => setValue('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="inativa">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingFilial ? 'Atualizar' : 'Criar'} Filial
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
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativa">Ativas</SelectItem>
                <SelectItem value="inativa">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredFiliais.length === 0 ? (
        searchTerm || statusFilter !== 'all' ? (
          <NoSearchResults searchTerm={searchTerm} onClear={clearSearch} />
        ) : (
          <NoFiliais onCreate={() => handleOpenDialog()} />
        )
      ) : (
        <PaginationWrapper data={filteredFiliais} itemsPerPage={10}>
          {(paginatedFiliais, paginationInfo, paginationElement) => (
            <div className="space-y-4">
              <Card className="border-0 shadow-primary">
                <CardHeader>
                  <CardTitle>
                    Filiais ({paginationInfo.totalItems})
                  </CardTitle>
                <CardDescription>
                  Lista de todas as filiais da ALF Chitumba
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Clientes</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedFiliais.map((filial) => (
                      <TableRow key={filial.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{filial.name}</div>
                            <div className="text-sm text-muted-foreground">{filial.address}</div>
                          </div>
                        </TableCell>
                        <TableCell>{filial.responsavel}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{filial.phone}</div>
                            <div className="text-muted-foreground">{filial.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getClientCount(filial.id)} clientes
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={filial.status === 'ativa' ? 'default' : 'secondary'}>
                            {filial.status}
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
                              <DropdownMenuItem onClick={() => handleOpenDialog(filial)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(filial)}
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
            {paginationElement}
            </div>
          )}
        </PaginationWrapper>
      )}
    </div>
  );
}