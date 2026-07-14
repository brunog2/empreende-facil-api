import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PDFDocument = require('pdfkit');
import { ReportExportData } from './reports.service';

@Injectable()
export class ReportExportService {
  async toExcel(data: ReportExportData): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Gestão Pro';
    workbook.created = new Date();

    const summary = workbook.addWorksheet('Resumo');
    summary.columns = [
      { header: 'Indicador', key: 'label', width: 28 },
      { header: 'Valor', key: 'value', width: 22 },
    ];
    summary.addRows([
      { label: 'Período', value: `${data.period.startDate} a ${data.period.endDate}` },
      { label: 'Receita', value: Number(data.summary.revenue) },
      { label: 'Despesas', value: Number(data.summary.expenses) },
      { label: 'Lucro', value: Number(data.summary.profit) },
      { label: 'Quantidade de vendas', value: data.summary.salesCount },
      { label: 'Ticket médio', value: Number(data.summary.averageTicket) },
      { label: 'Produtos', value: data.summary.products },
      { label: 'Clientes', value: data.summary.customers },
      { label: 'Produtos com estoque baixo', value: data.summary.lowStockProducts },
      { label: 'Valor do estoque', value: Number(data.summary.stockValue) },
    ]);
    this.styleWorksheet(summary);

    const sales = workbook.addWorksheet('Vendas');
    sales.columns = [
      { header: 'Data', key: 'date', width: 20 },
      { header: 'Cliente', key: 'customer', width: 30 },
      { header: 'Pagamento', key: 'paymentMethod', width: 20 },
      { header: 'Total', key: 'total', width: 16 },
    ];
    sales.addRows(data.sales.map((item) => ({ ...item, total: Number(item.total) })));
    sales.getColumn('date').numFmt = 'dd/mm/yyyy hh:mm';
    sales.getColumn('total').numFmt = 'R$ #,##0.00';
    this.styleWorksheet(sales);

    const products = workbook.addWorksheet('Produtos');
    products.columns = [
      { header: 'Produto', key: 'name', width: 34 },
      { header: 'Categoria', key: 'category', width: 24 },
      { header: 'Custo', key: 'costPrice', width: 16 },
      { header: 'Venda', key: 'salePrice', width: 16 },
      { header: 'Estoque', key: 'stockQuantity', width: 16 },
    ];
    products.addRows(
      data.products.map((item) => ({
        ...item,
        costPrice: Number(item.costPrice),
        salePrice: Number(item.salePrice),
        stockQuantity: Number(item.stockQuantity),
      })),
    );
    products.getColumn('costPrice').numFmt = 'R$ #,##0.00';
    products.getColumn('salePrice').numFmt = 'R$ #,##0.00';
    this.styleWorksheet(products);

    const customers = workbook.addWorksheet('Clientes');
    customers.columns = [
      { header: 'Nome', key: 'name', width: 34 },
      { header: 'E-mail', key: 'email', width: 34 },
      { header: 'Telefone', key: 'phone', width: 22 },
      { header: 'Cadastro', key: 'createdAt', width: 18 },
    ];
    customers.addRows(data.customers);
    customers.getColumn('createdAt').numFmt = 'dd/mm/yyyy';
    this.styleWorksheet(customers);

    const expenses = workbook.addWorksheet('Despesas');
    expenses.columns = [
      { header: 'Data', key: 'date', width: 18 },
      { header: 'Descrição', key: 'description', width: 38 },
      { header: 'Categoria', key: 'category', width: 24 },
      { header: 'Valor', key: 'amount', width: 16 },
    ];
    expenses.addRows(data.expenses.map((item) => ({ ...item, amount: Number(item.amount) })));
    expenses.getColumn('date').numFmt = 'dd/mm/yyyy';
    expenses.getColumn('amount').numFmt = 'R$ #,##0.00';
    this.styleWorksheet(expenses);

    const content = await workbook.xlsx.writeBuffer();
    return Buffer.from(content);
  }

  toPdf(data: ReportExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ margin: 48, size: 'A4' });
      const chunks: Buffer[] = [];
      document.on('data', (chunk: Buffer) => chunks.push(chunk));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      document.fontSize(22).fillColor('#111827').text('Gestão Pro');
      document.fontSize(16).text('Relatório gerencial', { align: 'left' });
      document
        .moveDown(0.3)
        .fontSize(10)
        .fillColor('#6b7280')
        .text(`Período: ${data.period.startDate} a ${data.period.endDate}`);
      document.moveDown();

      const money = (value: string) =>
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Number(value));
      const indicators: Array<[string, string]> = [
        ['Receita', money(data.summary.revenue)],
        ['Despesas', money(data.summary.expenses)],
        ['Lucro', money(data.summary.profit)],
        ['Ticket médio', money(data.summary.averageTicket)],
        ['Vendas', String(data.summary.salesCount)],
        ['Clientes', String(data.summary.customers)],
        ['Produtos', String(data.summary.products)],
        ['Valor do estoque', money(data.summary.stockValue)],
      ];
      document.fontSize(14).fillColor('#111827').text('Resumo');
      document.moveDown(0.4);
      for (const [label, value] of indicators) {
        document.fontSize(10).fillColor('#374151').text(`${label}: `, { continued: true });
        document.fillColor('#111827').text(value);
      }

      this.addTableTitle(document, 'Vendas recentes');
      for (const sale of data.sales.slice(0, 30)) {
        this.ensureSpace(document);
        document
          .fontSize(9)
          .fillColor('#374151')
          .text(
            `${new Date(sale.date).toLocaleDateString('pt-BR')} · ${sale.customer ?? 'Consumidor'} · ${sale.paymentMethod ?? 'Não informado'} · ${money(sale.total)}`,
          );
      }

      this.addTableTitle(document, 'Despesas');
      for (const expense of data.expenses.slice(0, 30)) {
        this.ensureSpace(document);
        document
          .fontSize(9)
          .fillColor('#374151')
          .text(
            `${new Date(expense.date).toLocaleDateString('pt-BR')} · ${expense.description} · ${expense.category} · ${money(expense.amount)}`,
          );
      }
      document.end();
    });
  }

  private styleWorksheet(worksheet: ExcelJS.Worksheet): void {
    const header = worksheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    header.alignment = { vertical: 'middle' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columnCount },
    };
  }

  private addTableTitle(document: PDFKit.PDFDocument, title: string): void {
    document.moveDown(1.2).fontSize(14).fillColor('#111827').text(title);
    document.moveDown(0.4);
  }

  private ensureSpace(document: PDFKit.PDFDocument): void {
    if (document.y > 750) document.addPage();
  }
}
