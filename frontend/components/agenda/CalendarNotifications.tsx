import React, { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useNotificationStore } from '@/stores/notificationStore';
import { Calendar, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  subject: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: {
    displayName: string;
  };
  organizer?: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
}

interface CalendarNotification {
  id: string;
  type: 'created' | 'updated' | 'cancelled';
  event: CalendarEvent;
  timestamp: string;
  read: boolean;
}

const notificationConfig = {
  created: {
    title: 'Evento Criado',
    icon: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  updated: {
    title: 'Evento Atualizado',
    icon: '🕒',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  cancelled: {
    title: 'Evento Cancelado',
    icon: '❌',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
};

function formatEventTime(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startFormatted = format(startDate, 'dd/MM HH:mm', { locale: ptBR });
  const endFormatted = format(endDate, 'HH:mm', { locale: ptBR });
  
  return `${startFormatted} - ${endFormatted}`;
}

interface ToastFunction {
  (props: {
    title: string;
    description: React.ReactNode;
    duration?: number;
  }): void;
}

function showCalendarToast(notification: CalendarNotification, toast: ToastFunction) {
  const config = notificationConfig[notification.type];
  const { event } = notification;
  
  const eventTime = formatEventTime(
    event.start.dateTime,
    event.end.dateTime
  );
  
  let description = `${eventTime}`;
  
  if (event.location?.displayName) {
    description += `\n📍 ${event.location.displayName}`;
  }
  
  if (event.organizer?.emailAddress?.name) {
    description += `\n👤 ${event.organizer.emailAddress.name}`;
  }
  
  toast({
    title: `${config.icon} ${config.title}`,
    description: (
      <div>
        <p className="font-medium mb-2">{event.subject}</p>
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{eventTime}</span>
          </div>
          {event.location?.displayName && (
            <div className="flex items-center space-x-1">
              <span>📍</span>
              <span className="truncate">{event.location.displayName}</span>
            </div>
          )}
          {event.organizer?.emailAddress?.name && (
            <div className="flex items-center space-x-1">
              <span>👤</span>
              <span className="truncate">{event.organizer.emailAddress.name}</span>
            </div>
          )}
        </div>
      </div>
    ),
    duration: 6000,
  });
}

export function CalendarNotifications() {
  const { notifications, markAsRead } = useNotificationStore();
  const { toast } = useToast();
  
  useEffect(() => {
    // Processar notificações não lidas
    const unreadNotifications = notifications.filter(n => !n.read);
    
    unreadNotifications.forEach(notification => {
      showCalendarToast(notification, toast);
      markAsRead(notification.id);
    });
  }, [notifications, markAsRead, toast]);
  
  return null; // Este componente não renderiza nada visualmente
}

// Hook para facilitar o uso das notificações
export function useCalendarNotifications() {
  const { addNotification, notifications, unreadCount } = useNotificationStore();
  
  const showNotification = (type: 'created' | 'updated' | 'cancelled', event: CalendarEvent) => {
    addNotification({
      id: `${type}-${event.id}-${Date.now()}`,
      type,
      event,
      timestamp: new Date().toISOString(),
      read: false,
    });
  };
  
  return {
    showNotification,
    notifications,
    unreadCount,
  };
}