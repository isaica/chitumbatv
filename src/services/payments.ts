import { Client, Mensalidade } from '@/types';
import { mockFiliais } from '@/data/mock';

export function confirmPayments(
  mensalidadeIds: string[],
  clients: Client[],
  mensalidades: Mensalidade[]
): Mensalidade[] {
  const now = new Date();
  const existingIds = mensalidadeIds.filter(id => !id.startsWith('virtual-'));
  const virtualIds = mensalidadeIds.filter(id => id.startsWith('virtual-'));

  const newMensalidades: Mensalidade[] = virtualIds.map(id => {
    const parts = id.split('-');
    const clientId = parts.slice(1, -2).join('-');
    const year = parseInt(parts[parts.length - 2]);
    const month = parseInt(parts[parts.length - 1]);
    const client = clients.find(c => c.id === clientId);
    const filial = client ? mockFiliais.find(f => f.id === client.filialId) : null;
    return {
      id: `${clientId}-${year}-${month}-${Date.now()}`,
      clientId,
      month,
      year,
      amount: filial?.monthlyPrice || 0,
      status: 'pago' as const,
      dueDate: new Date(year, month - 1, 15),
      paidAt: now,
      createdAt: now,
    };
  });

  const updated = mensalidades.map(m => (
    existingIds.includes(m.id) ? { ...m, status: 'pago' as const, paidAt: now } : m
  ));

  return [...updated, ...newMensalidades];
}