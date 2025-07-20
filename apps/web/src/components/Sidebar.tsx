'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Cloud, 
  Server, 
  Activity, 
  Shield, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  BarChart3
} from 'lucide-react'
import useStore from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { clearCredentials } = useStore()
  const [activeItem, setActiveItem] = useState('instances')
  
  const handleLogout = () => {
    clearCredentials()
    window.location.reload()
  }
  
  const menuItems = [
    { id: 'instances', label: 'EC2 實例', icon: Server },
    { id: 'monitoring', label: '監控指標', icon: Activity },
    { id: 'security', label: '安全群組', icon: Shield },
    { id: 'billing', label: '費用分析', icon: CreditCard },
    { id: 'analytics', label: '使用統計', icon: BarChart3 },
  ]
  
  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-card border-r border-border transition-all duration-300 z-50",
      collapsed ? "w-20" : "w-72"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          <div className={cn(
            "flex items-center gap-3 transition-opacity",
            collapsed && "opacity-0"
          )}>
            <div className="p-2 rounded-xl bg-primary/10">
              <Cloud className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">EC2 Monitor</h2>
              <p className="text-xs text-muted-foreground">AWS 管理平台</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn(
              "hover:bg-muted",
              collapsed && "mx-auto"
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        
        <Separator />
        
        {/* Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveItem(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                    "hover:bg-muted",
                    activeItem === item.id && "bg-primary text-primary-foreground hover:bg-primary/90",
                    collapsed && "justify-center"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <Separator />
        
        {/* User section */}
        <div className="p-4 space-y-2">
          <button
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              "hover:bg-muted",
              collapsed && "justify-center"
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">設定</span>}
          </button>
          
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
              "hover:bg-muted text-destructive",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">登出</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}