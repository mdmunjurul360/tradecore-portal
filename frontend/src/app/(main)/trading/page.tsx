import { redirect } from 'next/navigation';

export default function TradingIndexPage() {
  // Redirect to a default trading pair (XAUUSD) when navigating to /trading
  redirect('/trading/XAUUSD');
}
