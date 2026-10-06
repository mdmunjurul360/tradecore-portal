'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiKeysService } from '@/services/api-keys.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export function ApiKeysTab() {
  const [name, setName] = useState('');
  const [newKey, setNewKey] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['api-keys'],
    queryFn: apiKeysService.getApiKeys,
  });

  let keys = [];
  if (Array.isArray(data)) keys = data;
  else if (Array.isArray(data?.data)) keys = data.data;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiKeysService.createApiKey({ name });
      setNewKey(res.apiKey);
      setName('');
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to create API Key');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiKeysService.deleteApiKey(id);
      refetch();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete API Key');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create API Key</CardTitle>
          <CardDescription>Generate keys for algorithmic trading. Store your secret safely.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex gap-4 items-end max-w-sm mb-4">
            <div className="space-y-2 flex-1">
              <label className="text-sm font-medium">Key Label</label>
              <Input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Trading Bot 1" />
            </div>
            <Button type="submit">Generate</Button>
          </form>

          {newKey && (
            <div className="p-4 bg-muted/50 rounded-lg border space-y-2 mt-4">
              <h4 className="font-bold text-green-500">Key Created Successfully!</h4>
              <p className="text-sm text-muted-foreground">Please save this secret key. It will not be shown again.</p>
              <div className="space-y-1">
                <div className="text-xs font-semibold">API Key</div>
                <code className="text-xs bg-muted p-1 rounded block">{newKey.key}</code>
                <div className="text-xs font-semibold mt-2">API Secret</div>
                <code className="text-xs bg-muted p-1 rounded block text-red-400">{newKey.secret}</code>
              </div>
              <Button size="sm" variant="outline" onClick={() => setNewKey(null)}>I have saved it</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No API keys found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keys.map((k: any) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted p-1 rounded">{k.key.substring(0, 8)}...</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(k.id)} className="text-red-500 hover:text-red-600">Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
