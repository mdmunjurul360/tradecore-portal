'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/wallet.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ASSET_NETWORKS: Record<string, { label: string; networkSymbol: string }[]> = {
  BTC: [{ label: 'Bitcoin Network', networkSymbol: 'BTC' }],
  ETH: [{ label: 'Ethereum (ERC20)', networkSymbol: 'ETH' }],
  BNB: [{ label: 'BNB Smart Chain (BEP20)', networkSymbol: 'BNB' }],
  USDT: [
    { label: 'Ethereum (ERC20)', networkSymbol: 'USDT' },
    { label: 'Tron (TRC20)', networkSymbol: 'TRX' },
    { label: 'BNB Smart Chain (BEP20)', networkSymbol: 'BNB' },
  ],
  TRX: [{ label: 'Tron Network', networkSymbol: 'TRX' }],
};

export function DepositPanel() {
  const [currency, setCurrency] = useState('USDT');
  const [selectedNetwork, setSelectedNetwork] = useState('USDT');
  const [copied, setCopied] = useState(false);

  const networks = ASSET_NETWORKS[currency] || [];

  const { data: addressData, isLoading, error } = useQuery({
    queryKey: ['deposit-address', currency, selectedNetwork],
    queryFn: () => walletService.getAddress(selectedNetwork),
    enabled: !!selectedNetwork,
    retry: 2,
  });

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    const newNetworks = ASSET_NETWORKS[newCurrency] || [];
    if (newNetworks.length > 0) {
      setSelectedNetwork(newNetworks[0].networkSymbol);
    }
  };

  const handleCopy = () => {
    if (addressData?.address) {
      navigator.clipboard.writeText(addressData.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Generate a simple QR code using a public API
  const qrCodeUrl = addressData?.address
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(addressData.address)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Funds</CardTitle>
        <CardDescription>Select a currency and network to view your deposit address.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-md space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Currency</label>
          <select 
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="ETH">ETH (Ethereum)</option>
            <option value="BNB">BNB (Binance Smart Chain)</option>
            <option value="USDT">USDT (Tether)</option>
            <option value="TRX">TRX (Tron)</option>
          </select>
        </div>

        {networks.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Network</label>
            <select
              value={selectedNetwork}
              onChange={(e) => setSelectedNetwork(e.target.value)}
              className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {networks.map((net) => (
                <option key={net.networkSymbol} value={net.networkSymbol}>
                  {net.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4 pt-4 border-t">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-[200px] mx-auto rounded-xl" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-md text-center">
              <p className="text-sm text-red-600 dark:text-red-400">Failed to load deposit address. Please try again.</p>
            </div>
          ) : addressData?.address ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl border flex flex-col items-center">
                  {qrCodeUrl && (
                    <img 
                      src={qrCodeUrl} 
                      alt={`QR Code for ${addressData.address}`} 
                      width={200} 
                      height={200}
                      className="rounded-lg"
                    />
                  )}
                  <span className="text-xs text-black font-medium text-center mt-2">Scan QR Code to deposit</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deposit Address</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={addressData.address} 
                    className="flex-1 h-10 rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground font-mono" 
                  />
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                {copied && <p className="text-xs text-green-500">Copied to clipboard!</p>}
              </div>
              {addressData.network && (
                <div className="text-xs text-muted-foreground">
                  Network: <span className="font-medium">{addressData.network}</span>
                </div>
              )}
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  <strong>Important:</strong> Send only {currency} to this deposit address on the correct network. Sending coin or token other than {currency} to this address may result in the loss of your deposit.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
              <p className="text-sm">Generating deposit address for {currency}...</p>
              <p className="text-xs mt-1">Please wait or try refreshing.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
