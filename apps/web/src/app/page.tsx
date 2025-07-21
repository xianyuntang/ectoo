'use client'

import useStore from '@/store/useStore'
import CredentialsForm from '@/components/credentials-form'
import InstancesView from '@/components/instances-view'
import Header from '@/components/header'
import { Toaster } from '@/components/ui/sonner'

export default function Home() {
  const { credentials } = useStore()
  
  return (
    <div className="min-h-screen bg-background">
      {credentials && <Header />}
      
      {!credentials ? (
        <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 tracking-tight">
                Ectoo
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Monitor and control your AWS EC2 instances across different regions with a modern, intuitive interface
              </p>
            </div>
            <CredentialsForm />
          </div>
        </div>
      ) : (
        <main className="container mx-auto py-8 px-4">
          <InstancesView />
        </main>
      )}
      
      <Toaster />
    </div>
  )
}