export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-gray-50 to-gray-50">
      <div className="relative w-full max-w-md space-y-8 mx-auto px-4 py-8">
        <div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
          <div className="absolute left-1/2 top-0 ml-[-38rem] h-[25rem] w-[81.25rem] dark:[mask-image:linear-gradient(white,transparent)]">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-100 to-blue-50 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-sky-900/30 dark:to-sky-900/10">
              <div className="absolute inset-0 bg-[image:radial-gradient(circle_at_center,white_0.5px,transparent_0.5px)] bg-[size:2rem_2rem] opacity-10" />
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
} 