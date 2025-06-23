'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { uploadContent } from '@/app/actions/content'
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/utils/supabase/database.types'
import { Loader2, Plus, X } from 'lucide-react'

interface Author {
  author_id: number
  name: string
}

interface Genre {
  genre_id: number
  name: string
}

const contentFileTypes = ["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook", "audio/mpeg", "video/mp4", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const coverImageFileTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ContentUploadForm({ authors, genres }: { authors: Author[], genres: Genre[] }) {
  const router = useRouter()
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAuthors, setSelectedAuthors] = useState<number[]>([])
  const [newAuthors, setNewAuthors] = useState<string[]>([])
  const [newAuthorInput, setNewAuthorInput] = useState('')
  const [contentFile, setContentFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<string>('')

  const {
    getRootProps: getContentRootProps,
    getInputProps: getContentInputProps,
    isDragActive: isContentDragActive
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setContentFile(file);
      setFilePreview(file.name);
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/epub+zip': ['.epub'],
      'application/x-mobipocket-ebook': ['.mobi'],
      'audio/mpeg': ['.mp3'],
      'video/mp4': ['.mp4'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: false
  });

  const {
    getRootProps: getCoverRootProps,
    getInputProps: getCoverInputProps,
    isDragActive: isCoverDragActive
  } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleAuthorChange = (authorId: number) => {
    setSelectedAuthors(prev => 
      prev.includes(authorId)
        ? prev.filter(id => id !== authorId)
        : [...prev, authorId]
    )
  }

  const handleAddNewAuthor = () => {
    if (newAuthorInput.trim() && !newAuthors.includes(newAuthorInput.trim())) {
      setNewAuthors(prev => [...prev, newAuthorInput.trim()]);
      setNewAuthorInput('');
    }
  };

  const handleRemoveNewAuthor = (authorName: string) => {
    setNewAuthors(prev => prev.filter(name => name !== authorName));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!contentFile) {
      setError('Content file is required');
      return;
    }
    
    if (selectedAuthors.length === 0 && newAuthors.length === 0) {
      setError('At least one author must be provided');
      return;
    }
    
    setIsLoading(true)
    setError(null)
    setUploadProgress(0)
    setIsUploading(true)
    setUploadStage('Preparing files')

    try {
      const formData = new FormData(e.currentTarget)
      
      // Add files to FormData
      if (contentFile) {
        formData.set('file', contentFile);
        setUploadStage(`Processing ${contentFile.name} (${(contentFile.size / (1024 * 1024)).toFixed(2)} MB)`)
      }
      
      if (coverImage) {
        formData.set('coverImage', coverImage);
      }
      
      // Add both existing and new authors
      formData.append('authorIds', JSON.stringify(selectedAuthors))
      formData.append('newAuthors', JSON.stringify(newAuthors))

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 5;
          if (newProgress >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          
          // Update stage based on progress
          if (newProgress > 75) {
            setUploadStage('Processing metadata');
          } else if (newProgress > 50) {
            setUploadStage('Uploading content');
          } else if (newProgress > 25) {
            setUploadStage('Preparing storage');
          }
          
          return newProgress;
        });
      }, 500);

      setUploadStage('Uploading content file')
      const result = await uploadContent(formData)

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStage('Upload complete')
      
      if (result.success) {
        toast.success('Content uploaded successfully')
        router.push('/dashboard/content')
        router.refresh()
      } else {
        setError(result.error || 'Failed to upload content')
        setIsUploading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsUploading(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Digital Content</CardTitle>
        <CardDescription>
          Add new digital content to the library. All fields marked with * are required.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              required
              placeholder="Enter content title"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Enter content description"
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Content File *</Label>
            <div
              {...getContentRootProps()}
              className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-gray-50 transition-colors cursor-pointer ${
                isContentDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              <input {...getContentInputProps()} />
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, EPUB, MOBI, MP3, MP4, DOC, DOCX (MAX. 100MB)
                </p>
              </div>
              {filePreview && (
                <p className="text-sm text-gray-700 mt-2">
                  Selected: {filePreview}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            <div
              {...getCoverRootProps()}
              className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center bg-gray-50 transition-colors cursor-pointer ${
                isCoverDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:bg-gray-100'
              }`}
            >
              <input {...getCoverInputProps()} />
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  JPG, PNG, GIF, WEBP (MAX. 10MB)
                </p>
              </div>
              {coverPreview && (
                <div className="mt-2">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="w-32 h-32 object-cover rounded"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fileType">File Type *</Label>
            <Select name="fileType" required>
              <SelectTrigger>
                <SelectValue placeholder="Select file type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="epub">EPUB</SelectItem>
                <SelectItem value="mobi">MOBI</SelectItem>
                <SelectItem value="mp3">MP3</SelectItem>
                <SelectItem value="mp4">MP4</SelectItem>
                <SelectItem value="doc">DOC</SelectItem>
                <SelectItem value="docx">DOCX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="genreId">Genre</Label>
            <Select name="genreId">
              <SelectTrigger>
                <SelectValue placeholder="Select genre" />
              </SelectTrigger>
              <SelectContent>
                {genres.map(genre => (
                  <SelectItem key={genre.genre_id} value={genre.genre_id.toString()}>
                    {genre.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label>Authors *</Label>
            
            {/* Existing Authors */}
            {authors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Select from existing authors:</Label>
                <div className="grid grid-cols-2 gap-2">
                  {authors.map(author => (
                    <div key={author.author_id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`author-${author.author_id}`}
                        checked={selectedAuthors.includes(author.author_id)}
                        onChange={() => handleAuthorChange(author.author_id)}
                        className="h-4 w-4 rounded border-gray-300"
                        disabled={isLoading}
                      />
                      <Label htmlFor={`author-${author.author_id}`}>{author.name}</Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* New Author Input */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-500">Add new authors:</Label>
              <div className="flex space-x-2">
                <Input
                  value={newAuthorInput}
                  onChange={(e) => setNewAuthorInput(e.target.value)}
                  placeholder="Enter new author name"
                  disabled={isLoading}
                />
                <Button 
                  type="button"
                  onClick={handleAddNewAuthor}
                  disabled={!newAuthorInput.trim() || isLoading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* New Authors List */}
            {newAuthors.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">New authors to be added:</Label>
                <div className="flex flex-wrap gap-2">
                  {newAuthors.map((author, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1"
                    >
                      <span className="text-sm">{author}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewAuthor(author)}
                        className="text-gray-500 hover:text-gray-700"
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              name="publisher"
              placeholder="Enter publisher name"
              disabled={isLoading}
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{uploadStage}</Label>
                <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </span>
            ) : 'Upload Content'}
          </Button>
        </form>
      </CardContent>
      
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Uploading Content</h3>
              <p className="text-sm text-gray-500">{uploadStage}</p>
              <Progress value={uploadProgress} className="h-2" />
              <div className="flex justify-between text-sm">
                <span>Please don't close this window</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
} 