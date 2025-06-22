import { createServerClient } from '@/utils/supabase/supabase-server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  UserCog, 
  BookOpen, 
  Clock, 
  Bell, 
  Shield,
  Database
} from 'lucide-react'

export const metadata = {
  title: 'Settings | Admin Dashboard',
  description: 'Configure system settings',
}

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Configure system settings and preferences
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="content">
            <BookOpen className="h-4 w-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="borrowing">
            <Clock className="h-4 w-4 mr-2" />
            Borrowing
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                View and update basic system information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="system_name">System Name</Label>
                  <Input
                    id="system_name"
                    name="system_name"
                    defaultValue="Library Management System"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="institution">Institution</Label>
                  <Input
                    id="institution"
                    name="institution"
                    defaultValue="Your Institution"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    defaultValue="library@example.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select name="timezone" defaultValue="UTC">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure system security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    name="session_timeout"
                    type="number"
                    defaultValue="60"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="failed_login_attempts">Max Failed Login Attempts</Label>
                  <Input
                    id="failed_login_attempts"
                    name="failed_login_attempts"
                    type="number"
                    defaultValue="5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password_policy">Password Policy</Label>
                  <Select name="password_policy" defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue placeholder="Select password policy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basic (6+ characters)</SelectItem>
                      <SelectItem value="medium">Medium (8+ chars, mixed case)</SelectItem>
                      <SelectItem value="high">Strong (10+ chars, mixed case, numbers, symbols)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="require_email_verification">Email Verification</Label>
                  <Select name="require_email_verification" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue placeholder="Email verification requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Required</SelectItem>
                      <SelectItem value="false">Optional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* User Settings */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Registration</CardTitle>
              <CardDescription>
                Configure user registration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allow_self_registration">Allow Self Registration</Label>
                  <Select name="allow_self_registration" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue placeholder="Allow users to register" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled (Admin only)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_role">Default User Role</Label>
                  <Select name="default_role" defaultValue="student">
                    <SelectTrigger>
                      <SelectValue placeholder="Select default role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="guest">Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="require_admin_approval">Require Admin Approval</Label>
                  <Select name="require_admin_approval" defaultValue="false">
                    <SelectTrigger>
                      <SelectValue placeholder="Require admin approval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Required</SelectItem>
                      <SelectItem value="false">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>
                Configure permissions for each user role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-primary" />
                    Admin Role
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Administrators have full access to all system features
                  </p>
                  <div className="text-sm">
                    <p>• Full system access</p>
                    <p>• User management</p>
                    <p>• Content management</p>
                    <p>• Settings configuration</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-secondary" />
                    Librarian Role
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Librarians manage content and borrowing
                  </p>
                  <div className="text-sm">
                    <p>• Content management</p>
                    <p>• Borrowing management</p>
                    <p>• Limited user management</p>
                    <p>• Report generation</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Student Role
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Standard user role with borrowing privileges
                  </p>
                  <div className="text-sm">
                    <p>• Browse and search content</p>
                    <p>• Borrow and return items</p>
                    <p>• Manage personal profile</p>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Guest Role
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Limited access role for visitors
                  </p>
                  <div className="text-sm">
                    <p>• Browse and search content</p>
                    <p>• View content details</p>
                    <p>• Limited borrowing privileges</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Edit Role Permissions</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Content Settings */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Management</CardTitle>
              <CardDescription>
                Configure content settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="allowed_file_types">Allowed File Types</Label>
                  <Input
                    id="allowed_file_types"
                    name="allowed_file_types"
                    defaultValue="pdf,epub,doc,docx,mp3,mp4"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list of file extensions</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_file_size">Maximum File Size (MB)</Label>
                  <Input
                    id="max_file_size"
                    name="max_file_size"
                    type="number"
                    defaultValue="50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content_approval">Content Approval</Label>
                  <Select name="content_approval" defaultValue="librarian">
                    <SelectTrigger>
                      <SelectValue placeholder="Content approval process" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Automatic (No Approval)</SelectItem>
                      <SelectItem value="librarian">Librarian Approval</SelectItem>
                      <SelectItem value="admin">Admin Approval</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_content_status">Default Content Status</Label>
                  <Select name="default_content_status" defaultValue="available">
                    <SelectTrigger>
                      <SelectValue placeholder="Default status for new content" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Borrowing Settings */}
        <TabsContent value="borrowing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Borrowing Rules</CardTitle>
              <CardDescription>
                Configure borrowing limits and durations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_borrow_period">Default Borrowing Period (days)</Label>
                  <Input
                    id="default_borrow_period"
                    name="default_borrow_period"
                    type="number"
                    defaultValue="14"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_items_student">Maximum Items (Student)</Label>
                  <Input
                    id="max_items_student"
                    name="max_items_student"
                    type="number"
                    defaultValue="5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_items_guest">Maximum Items (Guest)</Label>
                  <Input
                    id="max_items_guest"
                    name="max_items_guest"
                    type="number"
                    defaultValue="2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="allow_renewals">Allow Renewals</Label>
                  <Select name="allow_renewals" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue placeholder="Allow item renewals" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_renewals">Maximum Renewals</Label>
                  <Input
                    id="max_renewals"
                    name="max_renewals"
                    type="number"
                    defaultValue="2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overdue_grace_period">Overdue Grace Period (days)</Label>
                  <Input
                    id="overdue_grace_period"
                    name="overdue_grace_period"
                    type="number"
                    defaultValue="3"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date_reminder">Due Date Reminder (days before)</Label>
                  <Input
                    id="due_date_reminder"
                    name="due_date_reminder"
                    type="number"
                    defaultValue="2"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overdue_notification_frequency">Overdue Notification Frequency (days)</Label>
                  <Input
                    id="overdue_notification_frequency"
                    name="overdue_notification_frequency"
                    type="number"
                    defaultValue="3"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <Select name="email_notifications" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue placeholder="Send email notifications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="in_app_notifications">In-App Notifications</Label>
                  <Select name="in_app_notifications" defaultValue="true">
                    <SelectTrigger>
                      <SelectValue placeholder="Show in-app notifications" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Enabled</SelectItem>
                      <SelectItem value="false">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                Configure email notification templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date_template">Due Date Reminder Template</Label>
                  <textarea
                    id="due_date_template"
                    name="due_date_template"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    defaultValue="Dear {user_name},\n\nThis is a reminder that your borrowed item '{item_title}' is due on {due_date}.\n\nThank you,\n{system_name}"
                  ></textarea>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overdue_template">Overdue Notification Template</Label>
                  <textarea
                    id="overdue_template"
                    name="overdue_template"
                    className="w-full min-h-[100px] p-2 border rounded-md"
                    defaultValue="Dear {user_name},\n\nThe item '{item_title}' that you borrowed is now overdue. It was due on {due_date}. Please return it as soon as possible.\n\nThank you,\n{system_name}"
                  ></textarea>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button>Save Templates</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>System Maintenance</CardTitle>
          <CardDescription>
            Perform system maintenance tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
              <Database className="h-6 w-6 mb-2" />
              <span className="font-medium">Backup Database</span>
              <span className="text-xs text-muted-foreground mt-1">Create a full system backup</span>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
              <Database className="h-6 w-6 mb-2" />
              <span className="font-medium">Restore Database</span>
              <span className="text-xs text-muted-foreground mt-1">Restore from a backup file</span>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
              <Clock className="h-6 w-6 mb-2" />
              <span className="font-medium">Clear Old Records</span>
              <span className="text-xs text-muted-foreground mt-1">Remove old borrowing records</span>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center">
              <BookOpen className="h-6 w-6 mb-2" />
              <span className="font-medium">Rebuild Content Index</span>
              <span className="text-xs text-muted-foreground mt-1">Optimize content search index</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
