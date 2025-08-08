import { NavLink, useLocation } from "react-router-dom"
import { Home, PhoneCall, Folder, Settings, LogOut, User2 } from "lucide-react"
import { toast } from "sonner"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Calls", url: "/calls", icon: PhoneCall },
  { title: "Assets", url: "/assets", icon: Folder },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <img
            src="/placeholder.svg"
            alt="DebateMate logo"
            className="h-6 w-6 rounded"
            loading="lazy"
          />
          {!collapsed && <span className="text-base font-semibold">DebateMate</span>}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2 space-y-2">
          <div className="flex items-center gap-3 rounded-md border bg-background p-2">
            <Avatar>
              <AvatarImage src="/placeholder.svg" alt="User avatar" />
              <AvatarFallback>
                <User2 className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="grid">
                <span className="text-sm font-medium leading-none">John Doe</span>
                <span className="text-xs text-muted-foreground">john@example.com</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => toast.success("Logged out")}
          >
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
