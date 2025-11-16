import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Mensalidade, Client } from '@/types';
import { mockClients, mockFiliais } from '@/data/mock';

export function generateReceipt(m: Mensalidade) {
  const client = mockClients.find(c => c.id === m.clientId);
  const filial = client ? mockFiliais.find(f => f.id === client.filialId) : undefined;
  const doc = new jsPDF();
  const title = 'Recibo de Pagamento';
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(11);
  const info = [
    ['Cliente', client?.name || 'N/A'],
    ['Filial', filial?.name || 'N/A'],
    ['Período', `${new Date(m.year, m.month - 1).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`],
    ['Valor', `${m.amount.toLocaleString()} AOA`],
    ['Vencimento', m.dueDate.toLocaleDateString('pt-AO')],
    ['Pago em', m.paidAt ? m.paidAt.toLocaleDateString('pt-AO') : 'N/A'],
    ['ID', m.id],
  ];
  autoTable(doc, {
    startY: 24,
    head: [['Campo', 'Valor']],
    body: info,
  });
  doc.save(`recibo_${client?.name || 'cliente'}_${m.year}-${String(m.month).padStart(2,'0')}.pdf`);
}