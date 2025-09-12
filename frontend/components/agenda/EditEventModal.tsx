import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Edit, Calendar } from 'lucide-react';

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

const editEventSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100, 'Título muito longo'),
  startDate: z.string().min(1, 'Data de início é obrigatória'),
  startTime: z.string().min(1, 'Hora de início é obrigatória'),
  endDate: z.string().min(1, 'Data de fim é obrigatória'),
  endTime: z.string().min(1, 'Hora de fim é obrigatória'),
  description: z.string().optional(),
  location: z.string().optional(),
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
  const endDateTime = new Date(`${data.endDate}T${data.endTime}`);
  return startDateTime < endDateTime;
}, {
  message: 'Data/hora de início deve ser anterior à data/hora de fim',
  path: ['endTime']
});

type EditEventFormData = z.infer<typeof editEventSchema>;

interface EditEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent;
  unitId: string;
  onSuccess: () => void;
}

export default function EditEventModal({
  open,
  onOpenChange,
  event,
  unitId,
  onSuccess
}: EditEventModalProps) {
  const { toast } = useToast();
  
  const form = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
    defaultValues: {
      title: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      description: '',
      location: ''
    }
  });

  // Preencher formulário com dados do evento
  useEffect(() => {
    if (event && open) {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      form.reset({
        title: event.title,
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        description: event.description || '',
        location: event.location || ''
      });
    }
  }, [event, open, form]);

  const updateEventMutation = useMutation({
    mutationFn: async (data: EditEventFormData) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`).toISOString();
      
      const response = await fetch(`/api/calendar/${unitId}/events/${event.eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          startDateTime,
          endDateTime,
          description: data.description || undefined,
          location: data.location || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao atualizar evento');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Evento atualizado",
        description: `Evento "${form.getValues('title')}" foi atualizado com sucesso.`,
      });
      
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar evento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: EditEventFormData) => {
    updateEventMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !updateEventMutation.isPending) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  // Função para sincronizar data de fim com data de início
  const handleStartDateChange = (startDate: string) => {
    const currentEndDate = form.getValues('endDate');
    if (!currentEndDate || currentEndDate < startDate) {
      form.setValue('endDate', startDate);
    }
  };

  // Verificar se o evento pode ser editado (não pode editar eventos passados ou cancelados)
  const canEdit = event.status === 'active' && new Date(event.start) > new Date();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Evento
          </DialogTitle>
          <DialogDescription>
            {canEdit 
              ? "Edite os detalhes do evento. As alterações serão sincronizadas com seu calendário Microsoft Outlook."
              : "Este evento não pode ser editado (evento passado ou cancelado)."
            }
          </DialogDescription>
        </DialogHeader>
        
        {canEdit ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Reunião de planejamento"
                        {...field}
                        disabled={updateEventMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleStartDateChange(e.target.value);
                          }}
                          disabled={updateEventMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Início *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={updateEventMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim *</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={updateEventMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de Fim *</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                          disabled={updateEventMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Local</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Sala de Reuniões, Online, etc."
                        {...field}
                        disabled={updateEventMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione detalhes sobre o evento..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={updateEventMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={updateEventMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={updateEventMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateEventMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="py-6 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {event.status === 'cancelled' 
                ? 'Este evento foi cancelado e não pode ser editado.'
                : 'Eventos passados não podem ser editados.'
              }
            </p>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Fechar
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}