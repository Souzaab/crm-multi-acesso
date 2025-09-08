import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { CreateLeadRequest } from '~backend/leads/create';
import type { Unit } from '~backend/units/create';

interface CreateLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  selectedTenantId: string;
}

interface FormData {
  name: string;
  whatsapp_number: string;
  discipline: string;
  age_group: string;
  who_searched: string;
  origin_channel: string;
  interest_level: 'frio' | 'morno' | 'quente';
  observations?: string;
  unit_id?: string;
}

export default function CreateLeadDialog({ open, onOpenChange, units, selectedTenantId }: CreateLeadDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormData>({
    defaultValues: {
      name: '',
      whatsapp_number: '',
      discipline: '',
      age_group: '',
      who_searched: '',
      origin_channel: '',
      interest_level: 'morno',
      observations: '',
      unit_id: '',
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: CreateLeadRequest) => backend.leads.create(data),
    onSuccess: (newLead) => {
      // Invalidate and refetch leads data
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      
      // Optimistically update the cache
      queryClient.setQueryData(['leads', selectedTenantId], (oldData: any) => {
        if (!oldData?.leads) return { leads: [newLead] };
        return {
          ...oldData,
          leads: [newLead, ...oldData.leads]
        };
      });
      
      toast({
        title: 'Sucesso',
        description: `Lead "${newLead.name}" criado com sucesso`,
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      
      let errorMessage = 'Erro ao criar lead';
      
      if (error?.detail) {
        errorMessage = error.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (!selectedTenantId) {
      toast({
        title: 'Erro',
        description: 'Nenhuma unidade selecionada',
        variant: 'destructive',
      });
      return;
    }

    createLeadMutation.mutate({
      ...data,
      tenant_id: selectedTenantId,
    });
  };

  const formatWhatsApp = (value: string) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 11) {
      cleaned = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length >= 7) {
      cleaned = cleaned.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    } else if (cleaned.length >= 3) {
      cleaned = cleaned.replace(/(\d{2})(\d+)/, '($1) $2');
    }
    return cleaned;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gray-900 border-blue-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Novo Lead</DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha as informações obrigatórias do novo lead. Os dados serão sincronizados automaticamente.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ 
                required: 'Nome é obrigatório',
                minLength: { value: 2, message: 'Nome deve ter pelo menos 2 caracteres' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Nome *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome completo do lead" 
                      {...field} 
                      className="bg-black/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="whatsapp_number"
              rules={{ 
                required: 'WhatsApp é obrigatório',
                pattern: {
                  value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                  message: 'Formato: (11) 99999-9999'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">WhatsApp *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 99999-9999" 
                      {...field}
                      className="bg-black/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                      onChange={(e) => {
                        const formatted = formatWhatsApp(e.target.value);
                        field.onChange(formatted);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="discipline"
              rules={{ required: 'Disciplina é obrigatória' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Disciplina *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="Português" className="text-white hover:bg-gray-800">Português</SelectItem>
                      <SelectItem value="Matemática" className="text-white hover:bg-gray-800">Matemática</SelectItem>
                      <SelectItem value="Japonês" className="text-white hover:bg-gray-800">Japonês</SelectItem>
                      <SelectItem value="Inglês" className="text-white hover:bg-gray-800">Inglês</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="age_group"
              rules={{ required: 'Faixa etária é obrigatória' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Faixa Etária *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-gray-700 text-white">
                        <SelectValue placeholder="Selecione a faixa etária" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="Infantil (0-12 anos)" className="text-white hover:bg-gray-800">Infantil (0-12 anos)</SelectItem>
                      <SelectItem value="Adolescente (13-17 anos)" className="text-white hover:bg-gray-800">Adolescente (13-17 anos)</SelectItem>
                      <SelectItem value="Adulto (18-59 anos)" className="text-white hover:bg-gray-800">Adulto (18-59 anos)</SelectItem>
                      <SelectItem value="Idoso (60+ anos)" className="text-white hover:bg-gray-800">Idoso (60+ anos)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="who_searched"
              rules={{ required: 'Quem procurou é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Quem Procurou *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-gray-700 text-white">
                        <SelectValue placeholder="Quem fez o contato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="Própria pessoa" className="text-white hover:bg-gray-800">Própria pessoa</SelectItem>
                      <SelectItem value="Responsável" className="text-white hover:bg-gray-800">Responsável</SelectItem>
                      <SelectItem value="Familiar" className="text-white hover:bg-gray-800">Familiar</SelectItem>
                      <SelectItem value="Amigo" className="text-white hover:bg-gray-800">Amigo</SelectItem>
                      <SelectItem value="Outros" className="text-white hover:bg-gray-800">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="origin_channel"
              rules={{ required: 'Canal de origem é obrigatório' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Canal de Origem *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-gray-700 text-white">
                        <SelectValue placeholder="Como nos conheceu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="WhatsApp" className="text-white hover:bg-gray-800">WhatsApp</SelectItem>
                      <SelectItem value="Instagram" className="text-white hover:bg-gray-800">Instagram</SelectItem>
                      <SelectItem value="Facebook" className="text-white hover:bg-gray-800">Facebook</SelectItem>
                      <SelectItem value="Google" className="text-white hover:bg-gray-800">Google</SelectItem>
                      <SelectItem value="Site" className="text-white hover:bg-gray-800">Site</SelectItem>
                      <SelectItem value="Indicação" className="text-white hover:bg-gray-800">Indicação</SelectItem>
                      <SelectItem value="Passando na rua" className="text-white hover:bg-gray-800">Passando na rua</SelectItem>
                      <SelectItem value="Outros" className="text-white hover:bg-gray-800">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="interest_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Nível de Interesse</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="frio" className="text-white hover:bg-gray-800">🟦 Frio - Apenas pesquisando</SelectItem>
                      <SelectItem value="morno" className="text-white hover:bg-gray-800">🟨 Morno - Interessado</SelectItem>
                      <SelectItem value="quente" className="text-white hover:bg-gray-800">🟥 Quente - Muito interessado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {units.length > 0 && (
              <FormField
                control={form.control}
                name="unit_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Unidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-black/50 border-gray-700 text-white">
                          <SelectValue placeholder="Selecione a unidade (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-white hover:bg-gray-800">
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o lead..."
                      className="min-h-[80px] bg-black/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createLeadMutation.isPending}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createLeadMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {createLeadMutation.isPending ? 'Criando...' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
