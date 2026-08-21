/**
 * Financial and general formatters for TradeCore Client Portal
 */

export function formatCurrency(
  amount: number | undefined | null,
  currency: string = 'USD',
  minimumFractionDigits: number = 2,
  maximumFractionDigits: number = 2
): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }

  const sign = amount < 0 ? '-' : '';
  const absVal = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(absVal);

  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF ',
    USDT: '₮',
    BTC: '₿',
    ETH: 'Ξ',
  };

  const symbol = symbols[currency] || `${currency} `;
  return `${sign}${symbol}${formatted}`;
}

export function formatNumber(
  num: number | undefined | null,
  decimals: number = 2
): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatPercent(
  value: number | undefined | null,
  includeSign: boolean = true,
  decimals: number = 2
): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  const prefix = includeSign && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(decimals)}%`;
}

export const formatPercentage = formatPercent;

export function formatLots(lots: number): string {
  return `${lots.toFixed(2)} lots`;
}

export function formatDate(
  dateString: string | Date | undefined,
  format: 'short' | 'long' | 'time' | 'datetime' | 'medium' | 'full' = 'datetime'
): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);

  if (format === 'time') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  if (format === 'short') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (format === 'long' || format === 'full') {
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  if (format === 'medium') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

export function truncateAddress(address: string, startLen = 6, endLen = 4): string {
  if (!address || address.length <= startLen + endLen) return address;
  return `${address.slice(0, startLen)}...${address.slice(-endLen)}`;
}
