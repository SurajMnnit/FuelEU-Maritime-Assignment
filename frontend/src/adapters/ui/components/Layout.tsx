import { ReactNode, useState } from "react";
import { BarChart3, Wallet, Users, FileCheck, Route, Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/utils";

interface LayoutProps {
  children?: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigationItems = [
  { id: "routes", label: "Routes", icon: Route },
  { id: "compare", label: "Compare", icon: BarChart3 },
  { id: "ship-compliance", label: "Ship CB", icon: FileCheck },
  { id: "banking", label: "Banking", icon: Wallet },
  { id: "pooling", label: "Pooling", icon: Users },
];

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "gradient-header text-white transition-all duration-300 ease-in-out flex flex-col",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-3">
                <img 
                  src="/varuna-logo.svg" 
                  alt="Varuna Marine Services" 
                  className="h-10 w-auto brightness-0 invert"
                />
                <div>
                  <h1 className="text-lg font-bold">Varuna Marine</h1>
                  <p className="text-xs text-sidebar-foreground/70">Compliance System</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <img 
                src="/varuna-logo.svg" 
                alt="Varuna" 
                className="h-10 w-auto brightness-0 invert mx-auto"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-sidebar-accent ml-auto"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent hover:translate-x-1",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="h-4 w-4" />}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="p-4 border-t border-sidebar-border text-xs text-sidebar-foreground/60 text-center">
            Fuel EU Maritime
            <br />
            Compliance System
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-40">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground capitalize">
                  {navigationItems.find(item => item.id === activeTab)?.label || "Dashboard"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeTab === "routes" && "Manage vessel routes and emissions"}
                  {activeTab === "compare" && "Compare baseline and current emissions"}
                  {activeTab === "ship-compliance" && "View and compute ship compliance balances"}
                  {activeTab === "banking" && "Bank surplus and apply credits"}
                  {activeTab === "pooling" && "Create compliance pools"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">
                  VM
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/60 backdrop-blur-sm border-t border-border py-4">
          <div className="px-8">
            <p className="text-sm text-muted-foreground text-center">
              © 2025 Varuna Marine Services - Fuel EU Maritime Compliance Management System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
