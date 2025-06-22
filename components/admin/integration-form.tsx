'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createExternalSystem, updateExternalSystem } from '@/utils/integrations/integration-service'
import { ExternalSystem, ExternalSystemType } from '@/utils/integrations/types'
import { toast } from 'sonner'
import { Loader2, Plus } from 'lucide-react'

interface IntegrationFormProps {
  system?: ExternalSystem
  onSuccess?: () => void
  onCancel?: () => void
}

export function IntegrationForm({ system, onSuccess, onCancel }: IntegrationFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(event.currentTarget)
      
      const result = system
        ? await updateExternalSystem(system.id, formData)
        : await createExternalSystem(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success(system ? 'Integration updated successfully' : 'Integration created successfully')
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{system ? 'Edit Integration' : 'New Integration'}</CardTitle>
          <CardDescription>
            Configure external system integration settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Integration Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Integration Type</Label>
            <Select name="type" defaultValue={system?.type || 'other'}>
              <SelectTrigger>
                <SelectValue placeholder="Select integration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="moodle">Moodle LMS</SelectItem>
                <SelectItem value="jstor">JSTOR</SelectItem>
                <SelectItem value="proquest">ProQuest</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Integration Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Enter integration name"
              defaultValue={system?.name}
              required
            />
          </div>

          {/* Integration URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="Enter integration URL"
              defaultValue={system?.url}
              required
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              name="api_key"
              type="password"
              placeholder="Enter API key"
              defaultValue={system?.api_key || ''}
            />
          </div>

          {/* Client ID */}
          <div className="space-y-2">
            <Label htmlFor="client_id">Client ID</Label>
            <Input
              id="client_id"
              name="client_id"
              placeholder="Enter client ID"
              defaultValue={system?.client_id || ''}
            />
          </div>

          {/* Client Secret */}
          <div className="space-y-2">
            <Label htmlFor="client_secret">Client Secret</Label>
            <Input
              id="client_secret"
              name="client_secret"
              type="password"
              placeholder="Enter client secret"
              defaultValue={system?.client_secret || ''}
            />
          </div>

          {/* Enabled Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Enable Integration</Label>
            <Switch
              id="enabled"
              name="enabled"
              defaultChecked={system?.enabled}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : (system ? 'Update' : 'Create')}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}

interface QuickConnectButtonProps {
  type: ExternalSystemType
  onSuccess?: () => void
}

export function QuickConnectButton({ type, onSuccess }: QuickConnectButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    setIsLoading(true)

    try {
      // Create form data with default values for quick connect
      const formData = new FormData()
      formData.append('name', `${type.charAt(0).toUpperCase() + type.slice(1)} Integration`)
      formData.append('type', type)
      formData.append('url', 'https://placeholder-url.com')  // Default URL to pass validation
      formData.append('enabled', 'true')

      const result = await createExternalSystem(formData)

      if (!result.success) {
        throw new Error(result.error)
      }

      toast.success('Integration created successfully')
      router.refresh()
      onSuccess?.()
    } catch (error) {
      console.error('Error connecting:', error)
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button 
      variant="outline" 
      className="w-full" 
      onClick={handleConnect}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <Plus className="mr-2 h-4 w-4" />
          Connect to {type.charAt(0).toUpperCase() + type.slice(1)}
        </>
      )}
    </Button>
  )
} 