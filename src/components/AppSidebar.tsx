import { NavLink, useLocation } from "react-router-dom"
import { Home, PhoneCall, Microscope, Settings, LogOut, User2, PanelLeft, Users } from "lucide-react"
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
  { title: "Research", url: "/research", icon: Microscope },
  { title: "Contacts", url: "/contacts", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname
  const { t } = useI18n()

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50"

  const getItemLabel = (url: string) => {
    switch (url) {
      case "/":
        return t("nav.home")
      case "/calls":
        return t("nav.calls")
      case "/research":
        return t("nav.research")
      case "/contacts":
        return t("nav.contacts")
      case "/settings":
        return t("nav.settings")
      default:
        return url
    }
  }

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
          <SidebarGroupLabel>{t("nav.group")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={collapsed ? getItemLabel(item.url) : undefined} className="group-data-[collapsible=icon]:!size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className={collapsed ? "h-5 w-5" : "mr-2 h-4 w-4"} />
                      {!collapsed && <span>{getItemLabel(item.url)}</span>}
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
              <DropdownMenuItem onClick={() => toast.message(t("profile.edit"), { description: t("profile.editorComingSoon") })}>
                {t("profile.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.success(t("actions.loggedOut"))}>
                <LogOut className="mr-2 h-4 w-4" /> {t("actions.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
