import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as db from '../services/FirebaseService';
import { Invoice } from '../types';

export const generateSalesAndGSTReport = async (userId: string, shopId: string) => {
  try {
    const [salesRaw, settings] = await Promise.all([
      db.getSalesInvoices(userId),
      db.getBusinessSettings(userId)
    ]);
    
    const sales = salesRaw as any[];

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Header
    doc.setFontSize(20);
    doc.text(settings?.businessName || 'Mizan Bill Report', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Sales & GST Report', pageWidth / 2, 30, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 38, { align: 'center' });

    // Sales Summary Table
    const tableData = sales.map(s => [
      s.invoiceNumber || '-',
      s.date || '-',
      s.partyName || s.customerName || 'Cash Sale',
      (s.totalTax || 0).toFixed(2),
      (s.totalAmount || 0).toFixed(2)
    ]);

    let totalSales = 0;
    let totalTax = 0;
    sales.forEach(s => {
      totalSales += (s.totalAmount || 0);
      totalTax += (s.totalTax || 0);
    });

    tableData.push([
      'TOTAL',
      '',
      '',
      totalTax.toFixed(2),
      totalSales.toFixed(2)
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Inv No', 'Date', 'Customer', 'GST Amount (₹)', 'Total (₹)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
      foot: [],
      willDrawCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          doc.setFont('helvetica', 'bold');
          if (data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246]; // gray-100
          }
        }
      }
    });

    doc.save('Sales_GST_Report.pdf');
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  }
};
