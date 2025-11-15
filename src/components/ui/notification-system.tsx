import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification
    const icons = {
      success: CheckCircle,
      error: AlertCircle,
      info: Info,
      warning: AlertTriangle,
    };

    const Icon = icons[notification.type];

    toast({
      title: notification.title,
      description: notification.message,
      variant: notification.type === 'error' ? 'destructive' : 'default',
      action: notification.action ? (
        <button
          onClick={notification.action.onClick}
          className="text-sm font-medium hover:underline"
        >
          {notification.action.label}
        </button>
      ) : undefined,
    });
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
      unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification helper functions
export const notifySuccess = (title: string, message: string, action?: { label: string; onClick: () => void }) => {
  const { addNotification } = useNotifications();
  addNotification({ type: 'success', title, message, action });
};

export const notifyError = (title: string, message: string, action?: { label: string; onClick: () => void }) => {
  const { addNotification } = useNotifications();
  addNotification({ type: 'error', title, message, action });
};

export const notifyInfo = (title: string, message: string, action?: { label: string; onClick: () => void }) => {
  const { addNotification } = useNotifications();
  addNotification({ type: 'info', title, message, action });
};

export const notifyWarning = (title: string, message: string, action?: { label: string; onClick: () => void }) => {
  const { addNotification } = useNotifications();
  addNotification({ type: 'warning', title, message, action });
};