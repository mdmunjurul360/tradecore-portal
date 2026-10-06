'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, CheckCircle2 } from 'lucide-react';

export function TransferPanel() {
  const [currency, setCurrency] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [fromWallet, setFromWallet] = useState('FUNDING');
  const [toWallet, setToWallet] = useState('TRADING');
  const [isTransferring, setIsTransferring] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: walletsData } = useQuery({
    queryKey: ['wallets'],
    queryFn: walletService.getWallets,
  });

  const wallets = Array.isArray(walletsData) ? walletsData : [];
  const selectedWallet = wallets.find(w => w.currency === currency);
  const availableBalance = selectedWallet ? parseFloat(selectedWallet.balance) : 0;

  const handleSwap = () => {
    setFromWallet(toWallet);
    setToWallet(fromWallet);
  };

  const handleTransfer = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (Number(amount) > availableBalance) {
      alert('Insufficient balance');
      return;
    }

    setIsTransferring(true);
    setSuccessMessage('');
    try {
      const result = await walletService.transfer({
        currency,
        amount: Number(amount),
        from: fromWallet,
        to: toWallet,
      });
      setSuccessMessage(result?.data?.message || result?.message || `Successfully transferred ${amount} ${currency}`);
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error
        ? err.message
        : (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error
          || (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message
          || 'Transfer failed. Please try again.';
      alert(errorMsg);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Internal Transfer</CardTitle>
        <CardDescription>Transfer assets between your Funding and Trading wallets instantly.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-md space-y-6">
        {successMessage && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 p-3 rounded-md">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">From</label>
            <select 
              value={fromWallet}
              onChange={(e) => setFromWallet(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="FUNDING">Funding Wallet</option>
              <option value="TRADING">Trading Wallet</option>
            </select>
          </div>
          
          <div className="pt-6">
            <Button variant="ghost" size="icon" onClick={handleSwap} className="rounded-full">
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium">To</label>
            <select 
              value={toWallet}
              onChange={(e) => setToWallet(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="FUNDING" disabled={fromWallet === 'FUNDING'}>Funding Wallet</option>
              <option value="TRADING" disabled={fromWallet === 'TRADING'}>Trading Wallet</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Asset</label>
          <select 
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="BNB">BNB</option>
            <option value="USDT">USDT</option>
            <option value="TRX">TRX</option>
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Amount</label>
            <span className="text-xs text-muted-foreground">
              Available: {availableBalance.toFixed(6)} {currency}
            </span>
          </div>
          <div className="flex gap-2">
            <input 
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" 
            />
            <Button variant="outline" onClick={() => setAmount(availableBalance.toString())}>
              Max
            </Button>
          </div>
        </div>

        <Button className="w-full" onClick={handleTransfer} disabled={isTransferring}>
          {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
        </Button>
      </CardContent>
    </Card>
  );
}
