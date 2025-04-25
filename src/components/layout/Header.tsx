
import { Bell, Menu, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = ({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:px-6">
      <Button
        variant="outline"
        size="icon"
        className="lg:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
      
      <div className="flex flex-1 items-center justify-end gap-x-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          
          <Button variant="outline" size="icon" className="relative">
            <MessageSquare className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          
          <Avatar>
            <AvatarImage src="/placeholder.svg" alt="Admin" />
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
