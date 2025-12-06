import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, User, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { Client, Filial, Mensalidade } from '@/types';

interface ClientSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
  clients: Client[];
  filiais: Filial[];
  mensalidades: Mensalidade[];
}

export function ClientSelectModal({
  open,
  onClose,
  onSelectClient,
  clients,
  filiais,
  mensalidades
}: ClientSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const getClientStatus = (client: Client): 'pago' | 'kilapeiro' | 'inativo' => {
    if (client.status === 'inativo') return 'inativo';
    const clientMensalidades = mensalidades.filter(m => m.clientId === client.id);
    const unpaidCount = clientMensalidades.filter(m => m.status === 'pendente' || m.status === 'atrasado').length;
    return unpaidCount >= 2 ? 'kilapeiro' : 'pago';
  };

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients.filter(c => c.status === 'ativo');
    
    const term = searchTerm.toLowerCase();
    return clients.filter(client => {
      if (client.status !== 'ativo') return false;
      const filial = filiais.find(f => f.id === client.filialId);
      return (
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term) ||
        client.phone.includes(term) ||
        filial?.name.toLowerCase().includes(term)
      );
    });
  }, [clients, filiais, searchTerm]);

  const handleSelect = (client: Client) => {
    onSelectClient(client);
    setSearchTerm('');
  };

  const handleClose = () => {
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Selecionar Cliente para Pagamento
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, email, telefone ou filial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Client List */}
          <ScrollArea className="h-[350px] pr-4">
            <div className="space-y-2">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum cliente encontrado</p>
                </div>
              ) : (
                filteredClients.map(client => {
                  const filial = filiais.find(f => f.id === client.filialId);
                  const status = getClientStatus(client);
                  const unpaidMensalidades = mensalidades.filter(
                    m => m.clientId === client.id && (m.status === 'pendente' || m.status === 'atrasado')
                  );

                  return (
                    <Button
                      key={client.id}
                      variant="outline"
                      className="w-full h-auto p-3 justify-start text-left hover:bg-accent"
                      onClick={() => handleSelect(client)}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{client.name}</span>
                            {status === 'kilapeiro' ? (
                              <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Kilapeiro
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Em dia
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{filial?.name || 'Sem filial'}</span>
                          </div>
                          {unpaidMensalidades.length > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              {unpaidMensalidades.length} mensalidade(s) pendente(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </Button>
                  );
                })
              )}
            </div>
          </ScrollArea>

          <div className="text-xs text-muted-foreground text-center">
            {filteredClients.length} cliente(s) encontrado(s)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
