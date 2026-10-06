'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function WithdrawPanel() {
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: balanceData } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: () => walletService.getBalance(),
  });

  const balances = Array.isArray(balanceData?.data) ? balanceData.data : (Array.isArray(balanceData) ? balanceData : []);
  const currentAsset = balances.find((b: { currency: string; balance: string | number }) => b.currency === currency);
  const availableBalance = currentAsset ? parseFloat(currentAsset.balance.toString()) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !address) return;
    
    if (parseFloat(amount) > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    setIsSubmitting(true);
    try {
      await walletService.createWithdrawal({
        amount: parseFloat(amount),
        currency,
        symbol: currency,
        destination: address,
      });
      alert('Withdrawal request submitted successfully');
      setAmount('');
      setAddress('');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to submit withdrawal request';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdraw Funds</CardTitle>
        <CardDescription>Withdraw funds to an external address.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Currency</label>
            <select 
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="BTC">BTC (Bitcoin)</option>
              <option value="ETH">ETH (Ethereum)</option>
              <option value="BNB">BNB (Binance Smart Chain)</option>
              <option value="USDT">USDT (Tether)</option>
              <option value="TRX">TRX (Tron)</option>
            </select>
            <p className="text-xs text-muted-foreground text-right">
              Available: {availableBalance.toFixed(4)} {currency}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Withdrawal Address</label>
            <input 
              type="text" 
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter destination address"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.00000001" 
                min="0"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="text-sm font-semibold text-muted-foreground">{currency}</span>
                <button 
                  type="button" 
                  onClick={() => setAmount(availableBalance.toString())}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  MAX
                </button>
              </div>
            </div>
          </div>

          <div className="bg-muted/50 p-3 rounded-md space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Network Fee</span>
              <span>Calculated on next step</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>You will receive</span>
              <span>{amount ? parseFloat(amount).toFixed(4) : '0.0000'} {currency}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !amount || parseFloat(amount) <= 0}>
            {isSubmitting ? 'Processing...' : 'Withdraw'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
