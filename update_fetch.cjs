const fs = require('fs');
let code = fs.readFileSync('src/views/DailyCash.tsx', 'utf8');

const regex = /const fetchMetrics = async \(\) => \{[\s\S]*?setIsRefreshing\(false\);\n    \}\n  \};/;
const replacement = `const fetchMetrics = async () => {
    setIsRefreshing(true);
    try {
      const user = auth.currentUser;
      if (!user) return;

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      let cashSales = 0;
      let upiSales = 0;
      let creditSales = 0;
      let cashCollected = 0;
      let cashPaid = 0;

      const salesInvoices = await db.getSalesInvoices(user.uid);
      const customerPayments = await db.getCustomerPayments(user.uid);
      const supplierPayments = await db.getSupplierPayments(user.uid);
      const shopExpenses = await db.getShopExpenses(user.uid);

      salesInvoices.forEach(inv => {
        const invDate = new Date(inv.date);
        if (invDate >= start && invDate <= end) {
          const totalDue = inv.totals?.totalDue || 0;
          const balanceDue = inv.totals?.balanceDue || 0;
          const amountPaid = totalDue - balanceDue;
          const invoiceTotal = inv.totals?.invoiceTotal || 0;

          if (balanceDue > 0 && balanceDue <= invoiceTotal) {
             creditSales += balanceDue;
          } else if (balanceDue > invoiceTotal) {
             creditSales += invoiceTotal;
          }

          if (amountPaid > 0) {
            if (inv.payment_mode === 'Cash') cashSales += amountPaid;
            else upiSales += amountPaid;
          }
        }
      });

      customerPayments.forEach(p => {
        const pDate = new Date(p.date);
        if (pDate >= start && pDate <= end) {
          if (p.mode === 'Cash' && p.paymentType === 'Payment') cashCollected += p.amount;
        }
      });

      supplierPayments.forEach(p => {
        const pDate = new Date(p.date);
        if (pDate >= start && pDate <= end) {
          if (p.mode === 'Cash' && p.paymentType === 'Payment') cashPaid += p.amount;
        }
      });

      shopExpenses.forEach(p => {
        const pDate = new Date(p.date);
        if (pDate >= start && pDate <= end) {
          if (p.payment_mode === 'Cash') cashPaid += p.amount;
        }
      });

      setMetrics({
        cashSales,
        upiSales,
        creditSales,
        cashCollected,
        cashPaid,
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };`;

fs.writeFileSync('src/views/DailyCash.tsx', code.replace(regex, replacement));
