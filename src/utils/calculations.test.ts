
import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals, LineItem, CalculationInput } from './calculations';

describe('calculateInvoiceTotals', () => {
  const mockItems: LineItem[] = [
    {
      id: '1',
      item: 'Product A',
      category: 'General',
      hsn: '1234',
      qty: 2,
      unit: 'Pcs',
      rate: 100,
      discount: 10, // 10% discount
      gst: 18,
      warehouse: 'Main',
      batchNo: '',
      expiryDate: ''
    }
  ];

  const baseInput: CalculationInput = {
    items: mockItems,
    isTaxInclusive: false,
    isIntraState: true,
    flatDiscount: 0,
    freightCharges: 0,
    handlingCharges: 0,
    laborCharges: 0,
    previousBalance: 0,
    amountPaidUpfront: 0,
    isSales: true
  };

  it('calculates totals correctly for tax-exclusive intra-state sales', () => {
    // Gross: 2 * 100 = 200
    // Discount: 200 * 0.1 = 20
    // Taxable: 200 - 20 = 180
    // Tax: 180 * 0.18 = 32.4
    // CGST/SGST: 16.2 each
    // Total: 180 + 32.4 = 212.4
    // Rounded: 212
    // RoundOff: -0.4

    const result = calculateInvoiceTotals(baseInput);

    expect(result.subtotal).toBeCloseTo(180);
    expect(result.cgst).toBeCloseTo(16.2);
    expect(result.sgst).toBeCloseTo(16.2);
    expect(result.totalTax).toBeCloseTo(32.4);
    expect(result.invoiceTotal).toBe(212);
    expect(result.roundOffAmount).toBeCloseTo(-0.4);
  });

  it('calculates totals correctly for tax-inclusive inter-state sales', () => {
    const input: CalculationInput = {
      ...baseInput,
      isTaxInclusive: true,
      isIntraState: false
    };

    // Gross: 200
    // After Discount: 180
    // Taxable: 180 / (1 + 0.18) = 152.54237
    // IGST: 180 - 152.54237 = 27.45763
    // Total: 180
    // Rounded: 180
    // RoundOff: 0

    const result = calculateInvoiceTotals(input);

    expect(result.subtotal).toBeCloseTo(152.54237);
    expect(result.igst).toBeCloseTo(27.45763);
    expect(result.invoiceTotal).toBe(180);
    expect(result.roundOffAmount).toBe(0);
  });

  it('handles additional charges and previous balance', () => {
    const input: CalculationInput = {
      ...baseInput,
      freightCharges: 50,
      previousBalance: 1000,
      amountPaidUpfront: 500
    };

    // Invoice Total (from first test): 212.4 + 50 = 262.4
    // Rounded: 262
    // Total Due: 1000 + 262 = 1262
    // Balance Due: 1262 - 500 = 762

    const result = calculateInvoiceTotals(input);

    expect(result.invoiceTotal).toBe(262);
    expect(result.totalDue).toBe(1262);
    expect(result.balanceDue).toBe(762);
  });
});
