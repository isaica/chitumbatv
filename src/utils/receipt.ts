import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Mensalidade, Client, Filial } from '@/types';

export function generateReceipt(m: Mensalidade, client: Client, filial: Filial | undefined) {
  const doc = new jsPDF();
  const title = 'Recibo de Pagamento';
  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(11);
  
  const dueDate = m.dueDate instanceof Date ? m.dueDate : new Date(m.dueDate);
  const paidAt = m.paidAt ? (m.paidAt instanceof Date ? m.paidAt : new Date(m.paidAt)) : null;
  
  const info = [
    ['Cliente', client.name],
    ['Filial', filial?.name || 'N/A'],
    ['Período', `${new Date(m.year, m.month - 1).toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}`],
    ['Valor', `${m.amount.toLocaleString()} AOA`],
    ['Vencimento', dueDate.toLocaleDateString('pt-AO')],
    ['Pago em', paidAt ? paidAt.toLocaleDateString('pt-AO') : 'N/A'],
    ['ID', m.id],
  ];
  autoTable(doc, {
    startY: 24,
    head: [['Campo', 'Valor']],
    body: info,
  });
  doc.save(`recibo_${client.name}_${m.year}-${String(m.month).padStart(2,'0')}.pdf`);
}