'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function PrivacyTab() {
  const handleSave = () => {
    toast.success('Privacy settings updated');
  };

  const handleDataRequest = () => {
    toast.success('Your data archive is being generated. You will receive an email shortly.');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Sharing & Analytics</CardTitle>
          <CardDescription>Manage how we use your data to improve our services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Anonymous Usage Data</Label>
                <p className="text-sm text-muted-foreground">Help us improve by automatically sending anonymous usage data.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Personalized Ads</Label>
                <p className="text-sm text-muted-foreground">Allow us to show you personalized advertisements based on your activity.</p>
              </div>
              <Switch />
            </div>
          </div>
          <Button onClick={handleSave}>Save Preferences</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Download or request deletion of your account data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <p className="font-medium">Download Your Data</p>
              <p className="text-sm text-muted-foreground">Get a copy of all data associated with your account.</p>
            </div>
            <Button variant="outline" onClick={handleDataRequest}>Request Archive</Button>
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data.</p>
            </div>
            <Button variant="destructive" onClick={() => toast.error('Please contact support to delete your account.')}>Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
