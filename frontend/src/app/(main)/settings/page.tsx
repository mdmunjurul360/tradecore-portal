'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileForm } from './components/profile-form';
import { ApiKeysTab } from './components/api-keys-tab';
import { SecurityTab } from './components/security-tab';
import { NotificationsTab } from './components/notifications-tab';
import { SessionsTab } from './components/sessions-tab';
import { PrivacyTab } from './components/privacy-tab';

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h3 className="text-3xl font-bold tracking-tight">Settings</h3>
        <p className="text-muted-foreground mt-1">
          Manage your account settings, security, and trading preferences.
        </p>
      </div>

      <div className="pt-4">
        <Tabs defaultValue="profile" className="flex flex-col md:flex-row gap-8 w-full">
          {/* Sidebar Navigation */}
          <TabsList className="flex flex-col h-auto bg-transparent items-start w-full md:w-64 space-y-1 shrink-0 p-0">
            <TabsTrigger 
              value="profile" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Security & Password
            </TabsTrigger>
            <TabsTrigger 
              value="kyc" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Verification (KYC)
            </TabsTrigger>
            <TabsTrigger 
              value="trading" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Trading Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="appearance" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Appearance
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Logged Devices
            </TabsTrigger>
            <TabsTrigger 
              value="api-keys" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              API Management
            </TabsTrigger>
            <TabsTrigger 
              value="support" 
              className="w-full justify-start text-left px-4 py-3 rounded-md data-[state=active]:bg-yellow-500/10 data-[state=active]:text-yellow-600 data-[state=active]:shadow-none hover:bg-muted transition-colors font-medium"
            >
              Help & Support
            </TabsTrigger>
          </TabsList>

          {/* Content Area */}
          <div className="flex-1 w-full min-w-0">
            <TabsContent value="profile" className="m-0 focus-visible:outline-none">
              <ProfileForm />
            </TabsContent>

            <TabsContent value="security" className="m-0 focus-visible:outline-none">
              <SecurityTab />
            </TabsContent>

            <TabsContent value="kyc" className="m-0 focus-visible:outline-none">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Identity Verification (KYC)</CardTitle>
                  <CardDescription>Upload your documents to unlock higher limits.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-muted-foreground">
                      Verification is handled in a dedicated portal for maximum security.
                    </p>
                    <a href="/kyc" className="inline-flex h-10 items-center justify-center rounded-md bg-yellow-500 px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-yellow-500/90 w-fit text-black">
                      Go to Verification Center
                    </a>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trading" className="m-0 focus-visible:outline-none">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Trading Preferences</CardTitle>
                  <CardDescription>Customize your trading experience and defaults.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic py-8 text-center">
                    No custom preferences configured yet. Defaults are applied.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="m-0 focus-visible:outline-none">
              <NotificationsTab />
            </TabsContent>

            <TabsContent value="appearance" className="m-0 focus-visible:outline-none">
              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl">Appearance</CardTitle>
                  <CardDescription>Manage application theme and layout options.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Language and Theme settings can be quickly toggled directly from the top navigation bar.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sessions" className="m-0 focus-visible:outline-none">
              <SessionsTab />
            </TabsContent>

            <TabsContent value="api-keys" className="m-0 focus-visible:outline-none">
              <ApiKeysTab />
            </TabsContent>

            <TabsContent value="support" className="m-0 focus-visible:outline-none">
              <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                <CardHeader>
                  <CardTitle className="text-xl">Help & Support</CardTitle>
                  <CardDescription>We're here to help you 24/7.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground py-4">
                    If you experience any issues, please contact our support team at <strong className="text-foreground">support@tradecore.com</strong> or use the live chat in the bottom right corner.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
