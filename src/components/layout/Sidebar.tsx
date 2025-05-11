
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, 
  BarChart3, 
  FileText, 
  Settings, 
  Users, 
  LogOut,
  HelpCircle,
  MessageCircle,
  AppWindow
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) => {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-background shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:border-r",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">TeleBot Admin</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1 overflow-auto py-4">
          <nav className="grid gap-1 px-2">
            <NavLink to="/" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
              end
            >
              <Home className="h-5 w-5" />
              Dashboard
            </NavLink>
            <NavLink to="/collections" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
            >
              <FileText className="h-5 w-5" />
              Collections
            </NavLink>
            <NavLink to="/users" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
            >
              <Users className="h-5 w-5" />
              Users
            </NavLink>
            <NavLink to="/analytics" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
            >
              <BarChart3 className="h-5 w-5" />
              Analytics
            </NavLink>
            <NavLink to="/miniapp" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
            >
              <AppWindow className="h-5 w-5" />
              Mini App
            </NavLink>
            <NavLink to="/settings" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
            >
              <Settings className="h-5 w-5" />
              Settings
            </NavLink>
            <NavLink to="/help" 
              className={({isActive}) => 
                cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "transparent")
              }
            >
              <HelpCircle className="h-5 w-5" />
              Help
            </NavLink>
          </nav>
        </ScrollArea>
        
        <div className="border-t p-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <LogOut className="h-5 w-5" />
            Log out
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
