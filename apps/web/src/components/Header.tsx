'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut } from 'lucide-react'
import RegionSelector from './region-selector'
import { ThemeToggle } from './theme-toggle'
import useStore from '@/store/useStore'

export default function Header() {
  const { clearCredentials } = useStore()
  
  const handleLogout = () => {
    clearCredentials()
    window.location.reload()
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Ectoo</h1>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Region:</span>
              <RegionSelector />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="md:hidden">
              <RegionSelector />
            </div>
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Clear Credentials
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}