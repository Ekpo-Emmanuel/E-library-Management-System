'use client'

import { Button } from '@/components/ui/button'
import { Download, FileJson, FileText } from 'lucide-react'
import { downloadSystemReport } from '@/app/actions/admin'

export function ReportDownloadButtons() {
  const handleDownload = async () => {
    const { success, formats, error } = await downloadSystemReport()
    if (!success || !formats) {
      console.error('Failed to download report:', error)
      return
    }

    // Download CSV
    const csvBlob = new Blob([formats.csv.content], { type: 'text/csv;charset=utf-8;' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.setAttribute('download', formats.csv.fileName)
    document.body.appendChild(csvLink)
    csvLink.click()
    document.body.removeChild(csvLink)
    URL.revokeObjectURL(csvUrl)

    // Download JSON
    const jsonBlob = new Blob([formats.json.content], { type: 'application/json' })
    const jsonUrl = URL.createObjectURL(jsonBlob)
    const jsonLink = document.createElement('a')
    jsonLink.href = jsonUrl
    jsonLink.setAttribute('download', formats.json.fileName)
    document.body.appendChild(jsonLink)
    jsonLink.click()
    document.body.removeChild(jsonLink)
    URL.revokeObjectURL(jsonUrl)
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleDownload}>
        <Download className="h-4 w-4 mr-2" />
        Export Report
      </Button>
      <Button variant="outline" size="icon" title="Download as CSV" onClick={handleDownload}>
        <FileText className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" title="Download as JSON" onClick={handleDownload}>
        <FileJson className="h-4 w-4" />
      </Button>
    </div>
  )
} 