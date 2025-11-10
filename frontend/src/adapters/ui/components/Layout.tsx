import { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, Wallet, Users, FileCheck } from "lucide-react";

interface LayoutProps {
  children?: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-center">
            <img 
              src="/varuna-logo.svg" 
              alt="Varuna Marine Services" 
              className="h-16 w-auto"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={onTabChange} className="space-y-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
            <TabsTrigger value="routes" className="gap-2">
              <span className="hidden sm:inline">Routes</span>
            </TabsTrigger>
            <TabsTrigger value="compare" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Compare</span>
            </TabsTrigger>
            <TabsTrigger value="ship-compliance" className="gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Ship CB</span>
            </TabsTrigger>
            <TabsTrigger value="banking" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Banking</span>
            </TabsTrigger>
            <TabsTrigger value="pooling" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Pooling</span>
            </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="space-y-6">
            {children}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-12 bg-card/30">
        <div className="container mx-auto px-6 py-6">
          <p className="text-sm text-muted-foreground text-center">
            Varuna Marine Services - Fuel EU Maritime Compliance Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
