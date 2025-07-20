'use client'

import { useState, useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import Sidebar from './Sidebar'
import Header from './Header'
import InstancesView from './InstancesView'
import useStore from '@/store/useStore'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      {/* Main content */}
      <div className={cn(
        "transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-72"
      )}>
        <Header />
        
        <main className="p-8">
          <InstancesView />
        </main>
      </div>
      
      <Toaster />
    </div>
  )
}