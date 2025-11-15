import { User, Filial, Client, Mensalidade, Activity, DashboardMetrics } from '@/types';

export const mockFiliais: Filial[] = [
  {
    id: '1',
    name: 'Filial Centro',
    address: 'Rua da Missão, 123, Centro, Luanda',
    phone: '+244 923 456 789',
    email: 'centro@chitumba.ao',
    responsavel: 'João Silva',
    status: 'ativa',
    monthlyPrice: 2500,
    createdAt: new Date('2023-01-15')
  },
  {
    id: '2',
    name: 'Filial Maianga',
    address: 'Av. 4 de Fevereiro, 456, Maianga, Luanda',
    phone: '+244 924 567 890',
    email: 'maianga@chitumba.ao',
    responsavel: 'Maria Santos',
    status: 'ativa',
    monthlyPrice: 4000,
    createdAt: new Date('2023-02-20')
  },
  {
    id: '3',
    name: 'Filial Viana',
    address: 'Rua da Paz, 789, Viana, Luanda',
    phone: '+244 925 678 901',
    email: 'viana@chitumba.ao',
    responsavel: 'Carlos Mendes',
    status: 'ativa',
    monthlyPrice: 3000,
    createdAt: new Date('2023-03-10')
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Chitumba',
    email: 'admin@chitumba.ao',
    role: 'admin',
    isActive: true,
    createdAt: new Date('2023-01-01')
  },
  {
    id: '2',
    name: 'João Silva',
    email: 'joao@chitumba.ao',
    role: 'gerente',
    filialId: '1',
    isActive: true,
    createdAt: new Date('2023-01-15')
  },
  {
    id: '3',
    name: 'Maria Santos',
    email: 'maria@chitumba.ao',
    role: 'gerente',
    filialId: '2',
    isActive: true,
    createdAt: new Date('2023-02-20')
  },
  {
    id: '4',
    name: 'Carlos Mendes',
    email: 'carlos@chitumba.ao',
    role: 'funcionario',
    filialId: '3',
    isActive: true,
    createdAt: new Date('2023-03-10')
  }
];

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'António Fernandes',
    phone: '+244 923 111 222',
    email: 'antonio@email.com',
    address: {
      street: 'Rua da Liberdade, 45',
      neighborhood: 'Alvalade',
      city: 'Luanda',
      province: 'Luanda'
    },
    document: '004567891LA045',
    filialId: '1',
    status: 'ativo',
    createdAt: new Date('2023-06-15')
  },
  {
    id: '2',
    name: 'Isabel Costa',
    phone: '+244 924 222 333',
    email: 'isabel@email.com',
    address: {
      street: 'Av. Marginal, 123',
      neighborhood: 'Ilha do Cabo',
      city: 'Luanda',
      province: 'Luanda'
    },
    document: '005678902LA046',
    filialId: '1',
    status: 'ativo',
    createdAt: new Date('2023-07-20')
  },
  {
    id: '3',
    name: 'Manuel Baptista',
    phone: '+244 925 333 444',
    email: 'manuel@email.com',
    address: {
      street: 'Rua dos Coqueiros, 78',
      neighborhood: 'Maianga',
      city: 'Luanda',
      province: 'Luanda'
    },
    document: '006789013LA047',
    filialId: '2',
    status: 'ativo',
    createdAt: new Date('2023-08-10')
  },
  {
    id: '4',
    name: 'Rosa Domingos',
    phone: '+244 926 444 555',
    email: 'rosa@email.com',
    address: {
      street: 'Travessa da Paz, 234',
      neighborhood: 'Viana',
      city: 'Luanda',
      province: 'Luanda'
    },
    document: '007890124LA048',
    filialId: '3',
    status: 'suspenso',
    createdAt: new Date('2023-09-05')
  },
  {
    id: '5',
    name: 'Pedro Neto',
    phone: '+244 927 555 666',
    email: 'pedro@email.com',
    address: {
      street: 'Rua da Vitória, 567',
      neighborhood: 'Rangel',
      city: 'Luanda',
      province: 'Luanda'
    },
    document: '008901235LA049',
    filialId: '1',
    status: 'ativo',
    createdAt: new Date('2023-10-12')
  }
];

// Generate mock mensalidades for the last 3 months
export const mockMensalidades: Mensalidade[] = [];
const currentDate = new Date();
const months = [
  { month: currentDate.getMonth() - 2, year: currentDate.getFullYear() },
  { month: currentDate.getMonth() - 1, year: currentDate.getFullYear() },
  { month: currentDate.getMonth(), year: currentDate.getFullYear() }
];

mockClients.forEach(client => {
  const filial = mockFiliais.find(f => f.id === client.filialId);
  if (!filial) return;

  months.forEach(({ month, year }, index) => {
    const adjustedMonth = month < 0 ? 12 + month : month;
    const adjustedYear = month < 0 ? year - 1 : year;
    
    const dueDate = new Date(adjustedYear, adjustedMonth, 15);
    const isPaid = Math.random() > 0.3; // 70% paid rate
    
    mockMensalidades.push({
      id: `${client.id}-${adjustedYear}-${adjustedMonth}`,
      clientId: client.id,
      month: adjustedMonth + 1,
      year: adjustedYear,
      amount: filial.monthlyPrice,
      status: isPaid ? 'pago' : (index === 2 ? 'pendente' : 'atrasado'),
      dueDate,
      paidAt: isPaid ? new Date(dueDate.getTime() + Math.random() * 10 * 24 * 60 * 60 * 1000) : undefined,
      createdAt: new Date(adjustedYear, adjustedMonth, 1)
    });
  });
});

export const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'payment',
    description: 'António Fernandes pagou mensalidade de Dezembro/2024',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    userId: '2'
  },
  {
    id: '2',
    type: 'client_added',
    description: 'Novo cliente Pedro Neto foi adicionado',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    userId: '3'
  },
  {
    id: '3',
    type: 'client_status_changed',
    description: 'Cliente Rosa Domingos foi suspenso',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    userId: '4'
  },
  {
    id: '4',
    type: 'payment',
    description: 'Isabel Costa pagou mensalidade de Dezembro/2024',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    userId: '2'
  }
];

export const mockDashboardMetrics: DashboardMetrics = {
  totalClients: mockClients.length,
  activeClients: mockClients.filter(c => c.status === 'ativo').length,
  monthlyPaid: mockMensalidades.filter(m => 
    m.month === currentDate.getMonth() + 1 && 
    m.year === currentDate.getFullYear() && 
    m.status === 'pago'
  ).length,
  defaultRate: 25.5
};