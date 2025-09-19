import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCalendarLogs, useSyncCalendar } from '@/hooks/useCalendar';
import { Clock, User, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/components/ui/use-toast';

interface CalendarHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CalendarLog {
  id: string;
  eventId: string;
  action: 'created' | 'updated' | 'cancelled';
  timestamp: string;
  userEmail?: string;
  eventData?: any;
  createdAt: string;
}

const actionConfig = {
  created: {
    label: 'Criado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: '✅',
  },
  updated: {
    label: 'Atualizado',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '🕒',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '❌',
  },
};

function LogItem({ log }: { log: CalendarLog }) {
  const config = actionConfig[log.action];
  const eventData = log.eventData ? JSON.parse(log.eventData) : {};
  const eventTitle = eventData.subject || eventData.title || `Evento ${log.eventId.slice(-8)}`;
  
  return (
    <div className="flex items-start space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        <span className="text-lg">{config.icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-foreground truncate">
            {eventTitle}
          </h4>
          <Badge className={`text-xs ${config.color}`}>
            {config.label}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </span>
          </div>
          
          {log.userEmail && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span className="truncate max-w-[120px]">{log.userEmail}</span>
            </div>
          )}
          
          {eventData.syncType && (
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3" />
              <span className="capitalize">{eventData.syncType}</span>
            </div>
          )}
        </div>
        
        {eventData.start && eventData.end && (
          <div className="flex items-center space-x-1 mt-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(eventData.start.dateTime || eventData.start), 'dd/MM HH:mm', { locale: ptBR })}
              {' - '}
              {format(new Date(eventData.end.dateTime || eventData.end), 'HH:mm', { locale: ptBR })}
            </span>
          </div>
        )}
        
        {eventData.location?.displayName && (
          <div className="text-xs text-muted-foreground mt-1 truncate">
            📍 {eventData.location.displayName}
          </div>
        )}
      </div>
    </div>
  );
}

export function CalendarHistoryModal({ open, onOpenChange }: CalendarHistoryModalProps) {
  const { data: logsData, isLoading, error, refetch } = useCalendarLogs(50, 0);
  const syncMutation = useSyncCalendar();
  const { toast } = useToast();
  
  const logs: CalendarLog[] = logsData?.logs || [];
  
  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      await refetch();
      toast({
        title: 'Sucesso',
        description: 'Sincronização concluída com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro na sincronização',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Histórico da Agenda</span>
          </DialogTitle>
          <DialogDescription>
            Visualize todas as atividades e alterações nos eventos da sua agenda.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-muted-foreground">
            {logs.length > 0 ? `${logs.length} registros encontrados` : 'Nenhum registro encontrado'}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncMutation.isPending}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </Button>
        </div>
        
        <Separator />
        
        <div className="flex-1 pr-4 overflow-y-auto max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Carregando histórico...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span>Erro ao carregar histórico</span>
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum registro encontrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quando eventos forem criados, atualizados ou cancelados,
                eles aparecerão aqui.
              </p>
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                <span>Sincronizar Agora</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <LogItem key={log.id} log={log} />
              ))}
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}