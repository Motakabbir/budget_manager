import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface Transaction {
    id: string;
    amount: number;
    description: string | null;
    date: string;
    type: 'income' | 'expense';
    category?: {
        name: string;
        color: string;
    };
}

export const exportToPDF = (
    transactions: Transaction[],
    type: 'income' | 'expense' | 'all',
    title: string
) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text(title, 14, 20);

    // Add date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

    // Filter transactions based on type
    const filteredTransactions = type === 'all'
        ? transactions
        : transactions.filter(t => t.type === type);

    // Calculate totals
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Prepare table data
    const tableData = filteredTransactions.map(t => [
        format(new Date(t.date), 'MMM dd, yyyy'),
        t.category?.name || 'Unknown',
        t.description || '-',
        `$${t.amount.toFixed(2)}`,
        t.type.charAt(0).toUpperCase() + t.type.slice(1),
    ]);

    // Add table
    autoTable(doc, {
        startY: 40,
        head: [['Date', 'Category', 'Description', 'Amount', 'Type']],
        body: tableData,
        foot: [['', '', 'Total:', `$${totalAmount.toFixed(2)}`, '']],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    // Save the PDF
    doc.save(`${type}_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const exportMonthlyReport = (
    transactions: Transaction[],
    categories: Array<{ id: string; name: string; type: string; color: string }>
) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text('Monthly Financial Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30);

    // Summary section
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    doc.setFontSize(12);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Income: $${totalIncome.toFixed(2)}`, 14, 52);
    doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`, 14, 59);
    doc.text(`Balance: $${balance.toFixed(2)}`, 14, 66);

    // Category breakdown
    doc.setFontSize(12);
    doc.text('Category Breakdown', 14, 80);

    const categoryData = categories.map(category => {
        const categoryTotal = transactions
            .filter(t => t.category?.name === category.name)
            .reduce((sum, t) => sum + t.amount, 0);

        return [
            category.name,
            category.type.charAt(0).toUpperCase() + category.type.slice(1),
            `$${categoryTotal.toFixed(2)}`,
        ];
    }).filter(row => parseFloat(row[2].replace('$', '')) > 0);

    autoTable(doc, {
        startY: 85,
        head: [['Category', 'Type', 'Total']],
        body: categoryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
    });

    // Transactions
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    doc.setFontSize(12);
    doc.text('Recent Transactions', 14, finalY + 15);

    const recentTransactions = transactions
        .slice(0, 20)
        .map(t => [
            format(new Date(t.date), 'MMM dd, yyyy'),
            t.category?.name || 'Unknown',
            t.description || '-',
            `$${t.amount.toFixed(2)}`,
            t.type.charAt(0).toUpperCase() + t.type.slice(1),
        ]);

    autoTable(doc, {
        startY: finalY + 20,
        head: [['Date', 'Category', 'Description', 'Amount', 'Type']],
        body: recentTransactions,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`monthly_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};
