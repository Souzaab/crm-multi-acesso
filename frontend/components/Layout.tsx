import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Kanban, 
  Users, 
  Building, 
  UserPlus,
  Menu,
  FileText,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Leads', href: '/leads', icon: Users },
  { name: 'Relatórios', href: '/reports', icon: FileText },
  { name: 'Unidades', href: '/units', icon: Building },
  { name: 'Usuários', href: '/users', icon: UserPlus },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const NavigationItems = () => (
    <>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-card border-r">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-foreground">CRM Multi-Acesso</h1>
          </div>
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              <NavigationItems />
            </nav>
            <div className="p-2">
              <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-5 w-5 mr-3" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="m-4">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
            <div className="flex items-center mb-8">
              <h1 className="text-xl font-bold text-foreground">CRM Multi-Acesso</h1>
            </div>
            <nav className="space-y-1">
              <NavigationItems />
            </nav>
            <div className="absolute bottom-4 left-2 right-2">
              <Button variant="ghost" className="w-full justify-start" onClick={logout}>
                <LogOut className="h-5 w-5 mr-3" />
                Sair
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
