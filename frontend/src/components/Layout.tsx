import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, 
  Kanban, 
  Users, 
  Building, 
  UserPlus,
  Menu,
  FileText,
  LogOut,
  Shield,
  Link as LinkIcon,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { useTodayEventsCount } from '../hooks/useCalendar';
import { DialogTitle } from '@radix-ui/react-dialog';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: BarChart3, roles: ['admin', 'user'] },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban, roles: ['admin', 'user'] },
  { name: 'Leads', href: '/leads', icon: Users, roles: ['admin', 'user'] },
  { name: 'Agenda', href: '/integracoes/agenda', icon: Calendar, roles: ['admin', 'user'], showBadge: true },
  { name: 'Integrações', href: '/integrations', icon: LinkIcon, roles: ['admin', 'user'] },
  { name: 'Relatórios', href: '/reports', icon: FileText, roles: ['admin'], requireAdmin: true },
  { name: 'Unidades', href: '/units', icon: Building, roles: ['admin'], requireMaster: true },
  { name: 'Usuários', href: '/users', icon: UserPlus, roles: ['admin'], requireAdmin: true },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout, hasRole, isMaster, isAdmin } = useAuth();
  const { data: todayEventsCount = 0 } = useTodayEventsCount();

  const isNavItemVisible = (item: any) => {
    // If requires master, check master
    if (item.requireMaster) {
      return isMaster();
    }
    // If requires admin, check admin
    if (item.requireAdmin) {
      return isAdmin();
    }
    // Otherwise check roles
    return hasRole(item.roles);
  };

  const visibleNavItems = navigation.filter(isNavItemVisible);

  const NavigationItems = () => (
    <>
      {visibleNavItems.map((item) => {
        const isActive = location.pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-blue-900/50 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
            {item.showBadge && todayEventsCount > 0 && (
              <Badge variant="secondary" className="ml-auto bg-blue-600 text-white text-xs">
                {todayEventsCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-background border-r border-gray-800">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-white">CRM Multi-Acesso</h1>
          </div>
          
          {/* User Info */}
          {user && (
            <div className="px-4 mt-4">
              <div className="p-3 bg-gray-900/50 border border-blue-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {user.is_master && (
                      <Badge className="bg-purple-900/50 text-purple-300 border-purple-500/30 text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        Master
                      </Badge>
                    )}
                    {user.is_admin && !user.is_master && (
                      <Badge className="bg-red-900/50 text-red-300 border-red-500/30 text-xs">
                        Admin
                      </Badge>
                    )}
                    {!user.is_admin && !user.is_master && (
                      <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/30 text-xs">
                        Usuário
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 flex-grow flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              <NavigationItems />
            </nav>
            
            {/* Logout Button */}
            <div className="px-2 pb-4">
              <Button
                onClick={logout}
                variant="ghost"
                className="w-full flex items-center justify-start gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
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
          <SheetContent side="left" className="w-64 bg-background border-r border-gray-800">
            <DialogTitle className="sr-only">Menu de Navegação</DialogTitle>
            <SheetHeader>
              <SheetTitle className="text-xl font-bold text-white">CRM Multi-Acesso</SheetTitle>
            </SheetHeader>
            
            {/* User Info Mobile */}
            {user && (
              <div className="mb-6">
                <div className="p-3 bg-gray-900/50 border border-blue-500/30 rounded-lg">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                  <div className="flex gap-1 mt-2">
                    {user.is_master && (
                      <Badge className="bg-purple-900/50 text-purple-300 border-purple-500/30 text-xs">
                        Master
                      </Badge>
                    )}
                    {user.is_admin && !user.is_master && (
                      <Badge className="bg-red-900/50 text-red-300 border-red-500/30 text-xs">
                        Admin
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <nav className="space-y-1 flex-1">
              <NavigationItems />
            </nav>
            
            <div className="mt-8">
              <Button
                onClick={logout}
                variant="ghost"
                className="w-full flex items-center justify-start gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
