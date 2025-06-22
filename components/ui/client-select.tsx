'use client'

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ClientSelectProps {
  name: string
  defaultValue: string
  options: {
    value: string
    label: string
  }[]
  placeholder: string
  showIcon?: boolean
}

export function ClientSelect({ 
  name, 
  defaultValue, 
  options, 
  placeholder,
  showIcon = true
}: ClientSelectProps) {
  const router = useRouter()
  
  const handleValueChange = (value: string) => {
    const url = new URL(window.location.href)
    if (value) {
      url.searchParams.set(name, value)
    } else {
      url.searchParams.delete(name)
    }
    router.push(url.toString())
  }
  
  return (
    <Select name={name} defaultValue={defaultValue} onValueChange={handleValueChange}>
      <SelectTrigger>
        {showIcon && <Filter className="h-4 w-4 mr-2" />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
} 