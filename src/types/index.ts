export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'gerente' | 'funcionario';
  filialId?: string;
  avatar?: string;
  isActive: boolean;
  password?: string;
  createdAt: Date;
}

export interface Filial {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  responsavel: string;
  status: 'ativa' | 'inativa';
  monthlyPrice: number;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    neighborhood: string;
    city: string;
    province: string;
  };
  document: string;
  filialId: string;
  status: 'ativo' | 'inativo';
  createdAt: Date;
}

export interface Mensalidade {
  id: string;
  clientId: string;
  month: number;
  year: number;
  amount: number;
  status: 'pago' | 'pendente' | 'atrasado';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface DashboardMetrics {
  totalClients: number;
  activeClients: number;
  monthlyPaid: number;
  defaultRate: number;
}

export interface Activity {
  id: string;
  type: 'payment' | 'client_added' | 'client_status_changed';
  description: string;
  timestamp: Date;
  userId: string;
}