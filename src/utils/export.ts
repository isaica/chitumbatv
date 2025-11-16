import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface ExportColumn {
  key: string;
  title: string;
  width?: number;
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  title: string;
  subtitle?: string;
  columns: ExportColumn[];
  data: any[];
  author?: string;
  orientation?: 'portrait' | 'landscape';
}

// PDF Export
export const exportToPDF = (options: ExportOptions) => {
  const { filename, title, subtitle, columns, data, author = 'ALF Chitumba', orientation = 'portrait' } = options;

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, 20);

  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, 20, 30);
  }

  // Date and author
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-AO')}`, 20, subtitle ? 40 : 30);
  doc.text(`Por: ${author}`, 20, subtitle ? 45 : 35);

  // Table
  const tableColumns = columns.map(col => col.title);
  const tableData = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      return col.format ? col.format(value) : value?.toString() || '';
    })
  );

  doc.autoTable({
    head: [tableColumns],
    body: tableData,
    startY: subtitle ? 55 : 45,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: columns.reduce((acc, col, index) => {
      if (col.width) {
        acc[index] = { cellWidth: col.width };
      }
      return acc;
    }, {} as any),
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Página ${i} de ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );
  }

  doc.save(`${filename}.pdf`);
};

// Excel Export
export const exportToExcel = (options: ExportOptions) => {
  const { filename, title, columns, data } = options;

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const excelData = data.map(row => {
    const excelRow: any = {};
    columns.forEach(col => {
      const value = row[col.key];
      excelRow[col.title] = col.format ? col.format(value) : value;
    });
    return excelRow;
  });

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Set column widths
  const colWidths = columns.map(col => ({
    wch: col.width ? col.width / 5 : 15 // Convert mm to character width approximation
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, title);

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveAs(blob, `${filename}.xlsx`);
};

// CSV Export
export const exportToCSV = (options: ExportOptions) => {
  const { filename, columns, data } = options;

  // Create CSV content
  const headers = columns.map(col => col.title).join(',');
  const rows = data.map(row =>
    columns.map(col => {
      const value = row[col.key];
      const formattedValue = col.format ? col.format(value) : value?.toString() || '';
      // Escape commas and quotes
      return `"${formattedValue.replace(/"/g, '""')}"`;
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

// Utility functions for common export scenarios
export const exportClients = (clients: any[], format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
  const options: ExportOptions = {
    filename: `clientes_${new Date().toISOString().split('T')[0]}`,
    title: 'Lista de Clientes - ALF Chitumba',
    subtitle: 'Relatório completo de clientes cadastrados',
    columns: [
      { key: 'name', title: 'Nome', width: 40 },
      { key: 'email', title: 'Email', width: 35 },
      { key: 'phone', title: 'Telefone', width: 25 },
      { key: 'status', title: 'Status', width: 20, format: (value) => value === 'ativo' ? 'Ativo' : value === 'inativo' ? 'Inativo' : 'Suspenso' },
      { key: 'createdAt', title: 'Data Cadastro', width: 25, format: (value) => new Date(value).toLocaleDateString('pt-AO') }
    ],
    data: clients
  };

  switch (format) {
    case 'pdf':
      exportToPDF(options);
      break;
    case 'excel':
      exportToExcel(options);
      break;
    case 'csv':
      exportToCSV(options);
      break;
  }
};

export const exportMensalidades = (mensalidades: any[], format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
  const options: ExportOptions = {
    filename: `mensalidades_${new Date().toISOString().split('T')[0]}`,
    title: 'Relatório de Mensalidades - ALF Chitumba',
    subtitle: 'Detalhamento de pagamentos e pendências',
    columns: [
      { key: 'clientName', title: 'Cliente', width: 40 },
      { key: 'month', title: 'Mês/Ano', width: 20, format: (value) => `${String(value).padStart(2, '0')}/2024` },
      { key: 'amount', title: 'Valor', width: 20, format: (value) => `AOA ${value.toLocaleString('pt-AO')}` },
      { key: 'status', title: 'Status', width: 20, format: (value) => value === 'pago' ? 'Pago' : value === 'pendente' ? 'Pendente' : 'Atrasado' },
      { key: 'dueDate', title: 'Vencimento', width: 25, format: (value) => new Date(value).toLocaleDateString('pt-AO') },
      { key: 'paidAt', title: 'Data Pagamento', width: 25, format: (value) => value ? new Date(value).toLocaleDateString('pt-AO') : '-' }
    ],
    data: mensalidades,
    orientation: 'landscape'
  };

  switch (format) {
    case 'pdf':
      exportToPDF(options);
      break;
    case 'excel':
      exportToExcel(options);
      break;
    case 'csv':
      exportToCSV(options);
      break;
  }
};

export const exportFiliais = (filiais: any[], format: 'pdf' | 'excel' | 'csv' = 'pdf') => {
  const options: ExportOptions = {
    filename: `filiais_${new Date().toISOString().split('T')[0]}`,
    title: 'Lista de Filiais - ALF Chitumba',
    subtitle: 'Relatório de filiais cadastradas',
    columns: [
      { key: 'name', title: 'Nome', width: 40 },
      { key: 'address', title: 'Endereço', width: 50 },
      { key: 'phone', title: 'Telefone', width: 25 },
      { key: 'email', title: 'Email', width: 35 },
      { key: 'responsavel', title: 'Responsável', width: 30 },
      { key: 'status', title: 'Status', width: 20, format: (value) => value === 'ativa' ? 'Ativa' : 'Inativa' }
    ],
    data: filiais
  };

  switch (format) {
    case 'pdf':
      exportToPDF(options);
      break;
    case 'excel':
      exportToExcel(options);
      break;
    case 'csv':
      exportToCSV(options);
      break;
  }
};