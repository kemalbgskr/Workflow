import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function Settings() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system" data-testid="tab-system">System</TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" className="mt-1.5" data-testid="input-first-name" />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" className="mt-1.5" data-testid="input-last-name" />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="john.doe@bni.co.id" className="mt-1.5" data-testid="input-email-settings" />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue="IT - PMO" className="mt-1.5" data-testid="input-department" />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" data-testid="button-cancel-profile">Cancel</Button>
                <Button data-testid="button-save-profile">Save Changes</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Email Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Approval Requests</p>
                  <p className="text-sm text-muted-foreground">Receive emails when documents need your approval</p>
                </div>
                <Switch defaultChecked data-testid="switch-approval-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Document Status Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when document status changes</p>
                </div>
                <Switch defaultChecked data-testid="switch-status-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Comments & Mentions</p>
                  <p className="text-sm text-muted-foreground">Notifications for comments and mentions</p>
                </div>
                <Switch defaultChecked data-testid="switch-comment-notifications" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Digest</p>
                  <p className="text-sm text-muted-foreground">Weekly summary of your activities</p>
                </div>
                <Switch data-testid="switch-digest-notifications" />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">System Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="docusealKey">Docuseal API Key</Label>
                <Input 
                  id="docusealKey" 
                  type="password" 
                  placeholder="••••••••••••••••" 
                  className="mt-1.5" 
                  data-testid="input-docuseal-key"
                />
                <p className="text-xs text-muted-foreground mt-1">Server-side only, not exposed to client</p>
              </div>
              <div>
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input 
                  id="smtpHost" 
                  defaultValue="smtp.bni.co.id" 
                  className="mt-1.5" 
                  data-testid="input-smtp-host"
                />
              </div>
              <div>
                <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
                <Input 
                  id="maxFileSize" 
                  type="number" 
                  defaultValue="50" 
                  className="mt-1.5" 
                  data-testid="input-max-file-size"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" data-testid="button-cancel-system">Cancel</Button>
                <Button data-testid="button-save-system">Save Changes</Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  className="mt-1.5" 
                  data-testid="input-current-password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  className="mt-1.5" 
                  data-testid="input-new-password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  className="mt-1.5" 
                  data-testid="input-confirm-password"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" data-testid="button-cancel-password">Cancel</Button>
                <Button data-testid="button-change-password">Change Password</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Two-Factor Authentication</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable 2FA</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Switch data-testid="switch-2fa" />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
