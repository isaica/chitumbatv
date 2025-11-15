import { useState, useEffect, useRef } from 'react';
import { Search, Users, Building2, CreditCard, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockClients, mockFiliais, mockMensalidades, mockUsers } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'client' | 'filial' | 'mensalidade' | 'user';
  href: string;
  icon: React.ReactNode;
}

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter data based on user permissions
  const availableClients = user?.role === 'admin' 
    ? mockClients 
    : mockClients.filter(c => c.filialId === user?.filialId);
  
  const availableUsers = user?.role === 'admin' 
    ? mockUsers 
    : user?.role === 'gerente' 
    ? mockUsers.filter(u => u.filialId === user.filialId || u.role === 'admin')
    : [user].filter(Boolean);

  const calculateClientPaymentStatus = (clientId: string) => {
    const clientMensalidades = mockMensalidades.filter(m => m.clientId === clientId);
    const overdue = clientMensalidades.filter(m => m.status === 'atrasado').length;
    const client = mockClients.find(c => c.id === clientId);
    
    if (client?.status === 'suspenso') return '🔴 Suspenso';
    if (overdue >= 3) return '🔴 Crítico';
    if (overdue >= 1) return '⚠️ Atrasado';
    return '✅ Em dia';
  };

  const search = (searchQuery: string): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Check for special search commands
    const isStatusSearch = query.startsWith('status:');
    const isPaymentSearch = query.startsWith('atraso') || query.startsWith('suspenso') || query.startsWith('critico');

    // Search clients with enhanced payment status
    availableClients.forEach(client => {
      const paymentStatus = calculateClientPaymentStatus(client.id);
      const matchesText = 
        client.name.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        client.phone.includes(query) ||
        client.document.includes(query);

      const matchesStatus = isPaymentSearch && (
        (query.includes('suspenso') && client.status === 'suspenso') ||
        (query.includes('critico') && paymentStatus.includes('Crítico')) ||
        (query.includes('atraso') && paymentStatus.includes('Atrasado'))
      );

      if (matchesText || matchesStatus || (isStatusSearch && client.status.includes(query.replace('status:', '').trim()))) {
        const filial = mockFiliais.find(f => f.id === client.filialId);
        results.push({
          id: client.id,
          title: `${client.name} ${paymentStatus}`,
          subtitle: `${client.email} • ${filial?.name || 'N/A'}`,
          type: 'client',
          href: '/clientes',
          icon: <Users className="w-4 h-4" />
        });
      }
    });

    // Search filiais (admin only)
    if (user?.role === 'admin') {
      mockFiliais.forEach(filial => {
        if (
          filial.name.toLowerCase().includes(query) ||
          filial.responsavel.toLowerCase().includes(query)
        ) {
          const clientCount = mockClients.filter(c => c.filialId === filial.id).length;
          results.push({
            id: filial.id,
            title: filial.name,
            subtitle: `${filial.responsavel} • ${clientCount} clientes`,
            type: 'filial',
            href: '/filiais',
            icon: <Building2 className="w-4 h-4" />
          });
        }
      });
    }

    // Search mensalidades with enhanced filtering
    const relevantMensalidades = mockMensalidades.filter(m => 
      availableClients.some(c => c.id === m.clientId)
    );
    
    relevantMensalidades.forEach(mensalidade => {
      const client = availableClients.find(c => c.id === mensalidade.clientId);
      const monthYear = new Date(mensalidade.year, mensalidade.month - 1).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });
      const amount = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(mensalidade.amount);
      
      const matchesText = client && (
        client.name.toLowerCase().includes(query) ||
        monthYear.toLowerCase().includes(query)
      );
      
      const matchesStatus = 
        (query.includes('pago') && mensalidade.status === 'pago') ||
        (query.includes('pendente') && mensalidade.status === 'pendente') ||
        (query.includes('atrasado') && mensalidade.status === 'atrasado');
      
      if ((matchesText || matchesStatus) && client) {
        results.push({
          id: mensalidade.id,
          title: `${client.name} - ${amount}`,
          subtitle: `${monthYear} • ${mensalidade.status.toUpperCase()}`,
          type: 'mensalidade',
          href: '/mensalidades',
          icon: <CreditCard className="w-4 h-4" />
        });
      }
    });

    // Search users (with permissions)
    if (user?.role === 'admin' || user?.role === 'gerente') {
      availableUsers.forEach(searchUser => {
        if (
          searchUser.name.toLowerCase().includes(query) ||
          searchUser.email.toLowerCase().includes(query)
        ) {
          const filial = searchUser.filialId ? mockFiliais.find(f => f.id === searchUser.filialId) : null;
          results.push({
            id: searchUser.id,
            title: searchUser.name,
            subtitle: `${searchUser.email} • ${searchUser.role} ${filial ? `• ${filial.name}` : ''}`,
            type: 'user',
            href: '/usuarios',
            icon: <User className="w-4 h-4" />
          });
        }
      });
    }

    // Limit results
    return results.slice(0, 8);
  };

  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = search(query);
      setResults(searchResults);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setSelectedIndex(-1);
    }
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
      
      if (event.key === '/' && event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (isOpen && results.length > 0) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
        }
        
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        }
        
        if (event.key === 'Enter' && selectedIndex >= 0) {
          event.preventDefault();
          handleSelectResult(results[selectedIndex]);
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, results, selectedIndex]);

  const handleSelectResult = (result: SearchResult) => {
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'filial':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'mensalidade':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'user':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'client':
        return 'Cliente';
      case 'filial':
        return 'Filial';
      case 'mensalidade':
        return 'Mensalidade';
      case 'user':
        return 'Usuário';
      default:
        return type;
    }
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Buscar no sistema... (Ctrl + /)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4 w-full md:w-80"
        />
        {query.length >= 2 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setQuery('');
              setResults([]);
              setIsOpen(false);
            }}
          >
            ×
          </Button>
        )}
      </div>

      {isOpen && (query.length >= 2 || results.length > 0) && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 border shadow-lg">
          <CardContent className="p-0">
            {results.length === 0 && query.length >= 2 ? (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum resultado encontrado para "{query}"</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={result.id}
                    className={`p-3 cursor-pointer border-b last:border-b-0 hover:bg-muted/50 ${
                      selectedIndex === index ? 'bg-muted' : ''
                    }`}
                    onClick={() => handleSelectResult(result)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge variant="secondary" className={`text-xs ${getTypeColor(result.type)}`}>
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {results.length > 0 && (
              <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground text-center">
                Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}