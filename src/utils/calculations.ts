
export interface LineItem {
  id: string;
  item: string;
  category: string;
  hsn: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  gst: number;
  warehouse: string;
  batchNo: string;
  expiryDate: string;
  imei?: string;
}

export interface CalculationInput {
  items: LineItem[];
  isTaxInclusive: boolean;
  isIntraState: boolean;
  flatDiscount: number;
  freightCharges: number;
  handlingCharges: number;
  laborCharges: number;
  previousBalance: number;
  amountPaidUpfront: number;
  isSales: boolean;
}

export const calculateInvoiceTotals = (input: CalculationInput) => {
  const {
    items,
    isTaxInclusive,
    isIntraState,
    flatDiscount,
    freightCharges,
    handlingCharges,
    laborCharges,
    previousBalance,
    amountPaidUpfront,
    isSales
  } = input;

  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  items.forEach(item => {
    const grossAmount = item.qty * item.rate;
    const itemDiscount = grossAmount * (item.discount / 100);
    const amountAfterDiscount = grossAmount - itemDiscount;

    let taxableAmount = 0;
    let itemTax = 0;

    if (isTaxInclusive) {
      taxableAmount = amountAfterDiscount / (1 + (item.gst / 100));
      itemTax = amountAfterDiscount - taxableAmount;
    } else {
      taxableAmount = amountAfterDiscount;
      itemTax = taxableAmount * (item.gst / 100);
    }

    subtotal += taxableAmount;
    
    if (isIntraState) {
      cgst += itemTax / 2;
      sgst += itemTax / 2;
    } else {
      igst += itemTax;
    }
  });

  const totalTax = cgst + sgst + igst;
  let invoiceTotal = subtotal + totalTax - flatDiscount + freightCharges + (isSales ? 0 : (handlingCharges + laborCharges));
  
  // Auto-roundoff
  const roundedTotal = Math.round(invoiceTotal);
  const roundOffAmount = roundedTotal - invoiceTotal;
  invoiceTotal = roundedTotal;

  const totalDue = previousBalance + invoiceTotal;
  const balanceDue = totalDue - amountPaidUpfront;

  return { 
    subtotal, 
    cgst, 
    sgst, 
    igst, 
    totalTax, 
    invoiceTotal, 
    totalDue, 
    balanceDue, 
    roundOffAmount 
  };
};
