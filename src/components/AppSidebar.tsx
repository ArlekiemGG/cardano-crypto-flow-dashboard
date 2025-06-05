
import { NavLink, useLocation } from "react-router-dom"
import { 
  BarChart3, 
  TrendingUp, 
  Bot, 
  Layers, 
  PieChart, 
  Settings 
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const navigationItems = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: BarChart3,
    description: "Overview & Analytics"
  },
  { 
    title: "Arbitrage", 
    url: "/arbitrage", 
    icon: TrendingUp,
    description: "Profit Opportunities"
  },
  { 
    title: "Trading Strategies", 
    url: "/strategies", 
    icon: Bot,
    description: "Automated Bots"
  },
  { 
    title: "Market Making", 
    url: "/market-making", 
    icon: Layers,
    description: "Liquidity Tools"
  },
  { 
    title: "Portfolio", 
    url: "/portfolio", 
    icon: PieChart,
    description: "Performance Analysis"
  },
  { 
    title: "Settings", 
    url: "/settings", 
    icon: Settings,
    description: "Configuration"
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true
    if (path !== "/" && currentPath.startsWith(path)) return true
    return false
  }

  const getNavClass = (path: string) => {
    const active = isActive(path)
    return `relative group transition-all duration-300 ${
      active 
        ? "bg-gradient-to-r from-crypto-primary/20 to-crypto-secondary/20 border-crypto-primary/50 text-white shadow-lg" 
        : "hover:bg-white/5 hover:border-white/20 text-gray-300 hover:text-white"
    } border border-transparent rounded-lg`
  }

  return (
    <Sidebar className="border-r border-white/10 bg-black/40 backdrop-blur-xl">
      <SidebarContent className="px-3 py-6">
        {/* Logo/Brand */}
        <div className="mb-8 px-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crypto-primary to-crypto-secondary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            {state === "expanded" && (
              <div>
                <h1 className="text-white font-bold text-lg">Cardano Pro</h1>
                <p className="text-gray-400 text-xs">Trading Suite</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider mb-4">
            Trading Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-auto p-0">
                    <NavLink to={item.url} className={getNavClass(item.url)}>
                      <div className="flex items-center p-3 w-full">
                        <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-crypto-primary' : 'text-gray-400'} group-hover:text-crypto-primary transition-colors`} />
                        {state === "expanded" && (
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {item.description}
                            </p>
                          </div>
                        )}
                        {isActive(item.url) && (
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-crypto-primary rounded-l-lg" />
                        )}
                      </div>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Connection Status */}
        {state === "expanded" && (
          <div className="mt-auto px-3">
            <div className="glass rounded-lg p-3 border border-green-500/30">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Cardano Connected</span>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
