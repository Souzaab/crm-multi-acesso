import React from 'react';
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
import { Loader2, Calendar, Clock } from 'lucide-react';

const createEventSchema = z.object({
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
}).refine((data) => {
  const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
  const now = new Date();
  return startDateTime > now;
}, {
  message: 'Data/hora de início deve ser no futuro',
  path: ['startTime']
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  onSuccess: () => void;
}

export default function CreateEventModal({
  open,
  onOpenChange,
  unitId,
  onSuccess
}: CreateEventModalProps) {
  const { toast } = useToast();
  
  const form = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: '',
      startDate: new Date().toISOString().split('T')[0],
      startTime: new Date(Date.now() + 60 * 60 * 1000).toTimeString().slice(0, 5), // +1 hora
      endDate: new Date().toISOString().split('T')[0],
      endTime: new Date(Date.now() + 90 * 60 * 1000).toTimeString().slice(0, 5), // +1.5 horas
      description: '',
      location: ''
    }
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventFormData) => {
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`).toISOString();
      const endDateTime = new Date(`${data.endDate}T${data.endTime}`).toISOString();
      
      const response = await fetch(`/api/calendar/${unitId}/create`, {
        method: 'POST',
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
        throw new Error(errorData.message || 'Falha ao criar evento');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Evento criado",
        description: `Evento "${form.getValues('title')}" foi criado com sucesso.`,
      });
      
      if (data.joinUrl) {
        toast({
          title: "Link da reunião",
          description: "Link do Teams foi gerado automaticamente.",
        });
      }
      
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar evento",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreateEventFormData) => {
    createEventMutation.mutate(data);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !createEventMutation.isPending) {
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Novo Evento
          </DialogTitle>
          <DialogDescription>
            Crie um novo evento que será sincronizado com seu calendário Microsoft Outlook.
          </DialogDescription>
        </DialogHeader>
        
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
                      disabled={createEventMutation.isPending}
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
                        disabled={createEventMutation.isPending}
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
                        disabled={createEventMutation.isPending}
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
                        disabled={createEventMutation.isPending}
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
                        disabled={createEventMutation.isPending}
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
                      disabled={createEventMutation.isPending}
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
                      disabled={createEventMutation.isPending}
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
                disabled={createEventMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createEventMutation.isPending}
                className="flex items-center gap-2"
              >
                {createEventMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Criar Evento
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}