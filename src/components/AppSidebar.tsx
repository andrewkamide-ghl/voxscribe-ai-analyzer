import { NavLink, useLocation } from "react-router-dom"
import { Home, PhoneCall, Folder, Settings, LogOut, User2, PanelLeft } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const items = [
  { title: "Home", url: "/", icon: Home },
  { title: "Calls", url: "/calls", icon: PhoneCall },
  { title: "Assets", url: "/assets", icon: Folder },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  return (
    <Sidebar style={{ "--sidebar-width": "14rem", "--sidebar-width-icon": "4rem" } as any} collapsible="icon">
      <SidebarHeader>
        <div className={collapsed ? "flex flex-col items-center gap-2 px-2 py-2" : "flex items-center justify-between gap-2 px-2 py-1.5"}>
          <div className="flex items-center gap-2">
            <img
              src="/placeholder.svg"
              alt="DebateMate logo"
              className="h-6 w-6 rounded"
              loading="lazy"
            />
            {!collapsed && <span className="text-base font-semibold">DebateMate</span>}
          </div>
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined} className="group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className={collapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
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
        <div className={collapsed ? "p-2 space-y-2 flex items-center justify-center" : "p-2 space-y-2"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={collapsed ? "inline-flex p-0 bg-transparent hover:bg-transparent" : "w-full flex items-center gap-3 rounded-md border bg-background p-2"}
                aria-label="User menu"
              >
                <Avatar>
                  <AvatarImage src="/placeholder.svg" alt="User avatar" />
                  <AvatarFallback>
                    <User2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                {!collapsed && (
                  <div className="grid text-left">
                    <span className="text-sm font-medium leading-none">John Doe</span>
                    <span className="text-xs text-muted-foreground">john@example.com</span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-56">
              <DropdownMenuItem onClick={() => toast.message("Edit Profile", { description: "Profile editor coming soon." })}>
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success("Logged out")}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
