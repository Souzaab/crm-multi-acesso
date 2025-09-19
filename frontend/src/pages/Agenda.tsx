import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ExternalLink, Edit, Trash2, AlertTriangle, History, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBackend } from '../hooks/useBackend';
import { useTenant } from '../contexts/TenantContext';
import { useRealtimeCalendar, useSyncCalendar, useIntegrationStatus } from '../hooks/useCalendar';
import CreateEventModal from '../components/agenda/CreateEventModal';
import EditEventModal from '../components/agenda/EditEventModal';
import { CalendarHistoryModal } from '../components/agenda/CalendarHistoryModal';
import { CalendarNotifications } from '../components/agenda/CalendarNotifications';

interface CalendarEvent {
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

interface AgendaFilters {
  startDate: string;
  endDate: string;
  status: string;
  type: string;
}

const initialFilters: AgendaFilters = {
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 dias
  status: 'all',
  type: 'all'
};

// Mock data para demonstração
const mockEvents: CalendarEvent[] = [
  {
    eventId: 'mock-1',
    title: 'Reunião de Planejamento',
    start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
    end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // +3 horas
    status: 'active',
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock',
    location: 'Sala de Reuniões',
    description: 'Discussão sobre metas do trimestre'
  },
  {
    eventId: 'mock-2',
    title: 'Aula de Matemática - Turma A',
    start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // +1 dia
    end: new Date(Date.now() + 25.5 * 60 * 60 * 1000).toISOString(), // +1 dia + 1.5h
    status: 'active',
    joinUrl: 'https://teams.microsoft.com/l/meetup-join/mock2',
    description: 'Revisão de álgebra linear'
  },
  {
    eventId: 'mock-3',
    title: 'Atendimento Individual - João',
    start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // -2 horas (passado)
    end: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // -1 hora (passado)
    status: 'completed',
    location: 'Sala 101'
  }
];

export default function Agenda() {
  const backend = useBackend();
  const { selectedTenantId } = useTenant();
  const [filters, setFilters] = useState<AgendaFilters>(initialFilters);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const { toast } = useToast();

  // Mock unitId - em produção, isso viria do contexto/store da aplicação
  const unitId = selectedTenantId || 'unit-1';

  // Hooks para funcionalidades em tempo real
  const realtimeCalendar = useRealtimeCalendar();
  const realtimeEvents: CalendarEvent[] = [];
  const isRealtimeLoading = false;
  const syncMutation = useSyncCalendar();
  const { data: integrationStatus } = useIntegrationStatus();

  // Query para buscar eventos (fallback se tempo real não estiver disponível)
  const { data: eventsData, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', unitId, filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          startDate: filters.startDate,
          endDate: filters.endDate,
          ...(filters.status !== 'all' && { status: filters.status }),
          ...(filters.type !== 'all' && { type: filters.type })
        });
        
        const response = await fetch(`/api/calendar/${unitId}/list?${params}`);
        if (!response.ok) throw new Error('Falha ao carregar eventos');
        
        const data = await response.json();
        return data.events || [];
      } catch (error) {
        // Usando dados mock devido ao erro
        return mockEvents;
      }
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    enabled: !realtimeEvents || realtimeEvents.length === 0 // Só executa se não tiver dados em tempo real
  });

  // Prioriza eventos em tempo real, senão usa os dados da query tradicional
  const events = realtimeEvents && realtimeEvents.length > 0 ? realtimeEvents : (eventsData || []);
  const isLoadingEvents = isRealtimeLoading || isLoading;

  const handleCreateEvent = () => {
    setIsCreateModalOpen(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };

  const handleSyncCalendar = async () => {
    try {
      await syncMutation.mutateAsync();
      await refetch();
      toast({
        title: "Sincronização concluída",
        description: "A agenda foi sincronizada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar a agenda.",
        variant: "destructive"
      });
    }
  };

  const handleOpenHistory = () => {
    setIsHistoryModalOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este evento?')) return;

    try {
      const response = await fetch(`/api/calendar/${unitId}/events/${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Falha ao cancelar evento');

      toast({
        title: "Evento cancelado",
        description: "O evento foi cancelado com sucesso.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o evento.",
        variant: "destructive"
      });
    }
  };

  const handleOpenOutlook = (webLink?: string) => {
    if (webLink) {
      window.open(webLink, '_blank');
    } else {
      toast({
        title: "Link indisponível",
        description: "Link do Outlook não disponível para este evento.",
        variant: "destructive"
      });
    }
  };

  const handleJoinMeeting = (joinUrl?: string) => {
    if (joinUrl) {
      window.open(joinUrl, '_blank');
    } else {
      toast({
        title: "Link indisponível",
        description: "Link da reunião não disponível para este evento.",
        variant: "destructive"
      });
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}min`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: 'default' as const, color: 'bg-green-500', label: 'Ativo' },
      completed: { variant: 'secondary' as const, color: 'bg-gray-500', label: 'Concluído' },
      cancelled: { variant: 'destructive' as const, color: 'bg-red-500', label: 'Cancelado' }
    };
    
    const config = variants[status as keyof typeof variants] || variants.active;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">
            Gerencie seus eventos e reuniões sincronizados com Microsoft Outlook
          </p>
        </div>
        <Button onClick={handleCreateEvent} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>
            Filtre os eventos por período, status e tipo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Início</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type-filter">Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="meeting">Reunião</SelectItem>
                  <SelectItem value="class">Aula</SelectItem>
                  <SelectItem value="appointment">Atendimento</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Eventos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Eventos ({events.length})
              {integrationStatus?.connected && (
                <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                  ✅ Conectado
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncCalendar}
                disabled={syncMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenHistory}
                className="flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                Histórico
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-muted-foreground">Carregando eventos...</p>
              </div>
            </div>
          ) : error ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar eventos. Exibindo dados de demonstração.
              </AlertDescription>
            </Alert>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não há eventos para o período selecionado.
              </p>
              <Button onClick={handleCreateEvent} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro evento
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Link/Reunião</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const { date, time } = formatDateTime(event.start);
                    const duration = getDuration(event.start, event.end);
                    
                    return (
                      <TableRow key={event.eventId}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{event.title}</div>
                            {event.location && (
                              <div className="text-sm text-muted-foreground">{event.location}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{date}</div>
                            <div className="text-sm text-muted-foreground">{time}</div>
                          </div>
                        </TableCell>
                        <TableCell>{duration}</TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell>
                          {event.joinUrl ? (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Teams
                            </Badge>
                          ) : event.location ? (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Presencial
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                              Não definido
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {event.webLink && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenOutlook(event.webLink)}
                                className="h-8 px-2"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                            {event.joinUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleJoinMeeting(event.joinUrl)}
                                className="h-8 px-2 text-blue-600 hover:text-blue-700"
                              >
                                Entrar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {event.status === 'active' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditEvent(event)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEvent(event.eventId)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <CreateEventModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        unitId={unitId}
        onSuccess={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
      />
      
      {selectedEvent && (
        <EditEventModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          event={selectedEvent}
          unitId={unitId}
          onSuccess={() => {
            refetch();
            setIsEditModalOpen(false);
            setSelectedEvent(null);
          }}
        />
      )}

      <CalendarHistoryModal
        open={isHistoryModalOpen}
        onOpenChange={setIsHistoryModalOpen}
      />

      {/* Componente de notificações em tempo real */}
      <CalendarNotifications />
    </div>
  );
}