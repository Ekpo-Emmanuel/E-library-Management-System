'use client'

import { createServerClient } from '@/utils/supabase/supabase-server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Settings, Trash2 } from 'lucide-react'
import { getExternalSystems } from '@/utils/integrations/integration-service'
import { QuickConnectButton } from '@/components/admin/integration-form'
import { useEffect, useState } from 'react'
import { ExternalSystem } from '@/utils/integrations/types'


export default function IntegrationsPage() {
  const [systems, setSystems] = useState<ExternalSystem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSystems() {
      const { success, systems, error } = await getExternalSystems()
      if (success && systems) {
        setSystems(systems)
      } else {
        setError(error || 'Failed to load external systems')
      }
    }

    loadSystems()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">External Integrations</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Moodle Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Moodle Integration</CardTitle>
            <CardDescription>
              Connect with your Moodle Learning Management System
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systems?.find(s => s.type === 'moodle') ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Connected</Badge>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {new Date(systems.find(s => s.type === 'moodle')?.last_sync_at || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <QuickConnectButton 
                  type="moodle" 
                  onSuccess={() => {
                    // Refresh the systems list
                    getExternalSystems().then(({ success, systems }) => {
                      if (success && systems) {
                        setSystems(systems)
                      }
                    })
                  }} 
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* JSTOR Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle>JSTOR Integration</CardTitle>
            <CardDescription>
              Access JSTOR's digital library of academic content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systems?.find(s => s.type === 'jstor') ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Connected</Badge>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {new Date(systems.find(s => s.type === 'jstor')?.last_sync_at || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <QuickConnectButton 
                  type="jstor" 
                  onSuccess={() => {
                    getExternalSystems().then(({ success, systems }) => {
                      if (success && systems) {
                        setSystems(systems)
                      }
                    })
                  }} 
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* ProQuest Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle>ProQuest Integration</CardTitle>
            <CardDescription>
              Access ProQuest's collection of dissertations and theses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systems?.find(s => s.type === 'proquest') ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Connected</Badge>
                    <p className="text-sm text-muted-foreground">
                      Last synced: {new Date(systems.find(s => s.type === 'proquest')?.last_sync_at || '').toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="mr-2 h-4 w-4" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </>
              ) : (
                <QuickConnectButton 
                  type="proquest" 
                  onSuccess={() => {
                    getExternalSystems().then(({ success, systems }) => {
                      if (success && systems) {
                        setSystems(systems)
                      }
                    })
                  }} 
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Other Integrations */}
        {systems?.filter(s => s.type === 'other').map(system => (
          <Card key={system.id}>
            <CardHeader>
              <CardTitle>{system.name}</CardTitle>
              <CardDescription>
                Custom integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">Connected</Badge>
                  <p className="text-sm text-muted-foreground">
                    Last synced: {new Date(system.last_sync_at || '').toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync Now
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 