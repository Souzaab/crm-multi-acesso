import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface CalendarNotification {
  id: string;
  type: 'created' | 'updated' | 'cancelled';
  eventId: string;
  eventTitle: string;
  timestamp: string;
  unitId: string;
  read: boolean;
}

export interface CalendarEvent {
  eventId: string;
  title: string;
  start: string;
  end: string;
  status: 'active' | 'cancelled' | 'completed';
  joinUrl?: string;
  location?: string;
  description?: string;
  webLink?: string;
}

interface NotificationState {
  // Notificações
  notifications: CalendarNotification[];
  unreadCount: number;
  
  // Eventos em tempo real
  realtimeEvents: CalendarEvent[];
  todayEventsCount: number;
  
  // Estado de sincronização
  isPolling: boolean;
  lastSync: string | null;
  
  // Actions
  addNotification: (notification: Omit<CalendarNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  
  // Eventos
  updateRealtimeEvents: (events: CalendarEvent[]) => void;
  updateTodayEventsCount: (count: number) => void;
  
  // Sincronização
  setPolling: (isPolling: boolean) => void;
  updateLastSync: () => void;
}

export const useNotificationStore = create<NotificationState>()(subscribeWithSelector((set, get) => ({
  // Estado inicial
  notifications: [],
  unreadCount: 0,
  realtimeEvents: [],
  todayEventsCount: 0,
  isPolling: false,
  lastSync: null,
  
  // Actions para notificações
  addNotification: (notification) => {
    const newNotification: CalendarNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Manter apenas 50 notificações
      unreadCount: state.unreadCount + 1,
    }));
  },
  
  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },
  
  // Actions para eventos
  updateRealtimeEvents: (events) => {
    set({ realtimeEvents: events });
  },
  
  updateTodayEventsCount: (count) => {
    set({ todayEventsCount: count });
  },
  
  // Actions para sincronização
  setPolling: (isPolling) => {
    set({ isPolling });
  },
  
  updateLastSync: () => {
    set({ lastSync: new Date().toISOString() });
  },
})));

// Seletores úteis
export const useUnreadNotifications = () => 
  useNotificationStore((state) => state.notifications.filter(n => !n.read));

export const useTodayEventsCount = () => 
  useNotificationStore((state) => state.todayEventsCount);

export const useIsPolling = () => 
  useNotificationStore((state) => state.isPolling);