import { Client, Mensalidade } from '@/types';

export interface ClientPaymentStatus {
  status: 'pago' | 'atrasado' | 'inadimplente' | 'suspenso' | 'inativo';
  overdueMonths: string[];
  totalDebt: number;
  currentMonthPaid: boolean;
  overdueCount: number;
}

export function calculateClientPaymentStatus(
  client: Client, 
  mensalidades: Mensalidade[]
): ClientPaymentStatus {
  // Se cliente está inativo ou suspenso, retorna status direto
  if (client.status === 'inativo') {
    return {
      status: 'inativo',
      overdueMonths: [],
      totalDebt: 0,
      currentMonthPaid: false,
      overdueCount: 0
    };
  }

  if (client.status === 'suspenso') {
    return {
      status: 'suspenso',
      overdueMonths: [],
      totalDebt: 0,
      currentMonthPaid: false,
      overdueCount: 0
    };
  }

  const clientMensalidades = mensalidades.filter(m => m.clientId === client.id);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Verifica se pagou o mês atual
  const currentMonthPayment = clientMensalidades.find(
    m => m.month === currentMonth && m.year === currentYear
  );
  const currentMonthPaid = currentMonthPayment?.status === 'pago';

  // Calcula mensalidades em atraso
  const overdueMensalidades = clientMensalidades.filter(m => 
    m.status === 'atrasado' || (m.status === 'pendente' && m.dueDate < currentDate)
  );

  const overdueMonths = overdueMensalidades.map(m => 
    `${getMonthName(m.month)}/${m.year}`
  );

  const totalDebt = overdueMensalidades.reduce((total, m) => total + m.amount, 0);
  const overdueCount = overdueMensalidades.length;

  // Determina o status
  let status: ClientPaymentStatus['status'];
  
  if (!currentMonthPaid) {
    status = 'inadimplente';
  } else if (overdueCount > 0) {
    status = 'atrasado';
  } else {
    status = 'pago';
  }

  return {
    status,
    overdueMonths,
    totalDebt,
    currentMonthPaid,
    overdueCount
  };
}

function getMonthName(month: number): string {
  const months = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  return months[month - 1];
}

export function getStatusColor(status: ClientPaymentStatus['status']): string {
  switch (status) {
    case 'pago':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'atrasado':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'inadimplente':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'suspenso':
    case 'inativo':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getStatusLabel(status: ClientPaymentStatus['status']): string {
  switch (status) {
    case 'pago':
      return 'Em Dia';
    case 'atrasado':
      return 'Atrasado';
    case 'inadimplente':
      return 'Inadimplente';
    case 'suspenso':
      return 'Suspenso';
    case 'inativo':
      return 'Inativo';
    default:
      return 'N/A';
  }
}