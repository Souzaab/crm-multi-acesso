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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        title: 'Sucesso',
        description: 'Lead criado com sucesso',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error);
      const message = error?.message || 'Erro ao criar lead';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createLeadMutation.mutate({
      ...data,
      tenant_id: selectedTenantId,
      status: 'novo_lead',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Lead</DialogTitle>
          <DialogDescription>
            Preencha as informações obrigatórias do novo lead.
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
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do lead" {...field} />
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
                  <FormLabel>WhatsApp *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 99999-9999" 
                      {...field}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 11) {
                          value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
                        } else if (value.length >= 7) {
                          value = value.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
                        } else if (value.length >= 3) {
                          value = value.replace(/(\d{2})(\d+)/, '($1) $2');
                        }
                        field.onChange(value);
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
                  <FormLabel>Disciplina *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a disciplina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Natação">Natação</SelectItem>
                      <SelectItem value="Musculação">Musculação</SelectItem>
                      <SelectItem value="Pilates">Pilates</SelectItem>
                      <SelectItem value="Yoga">Yoga</SelectItem>
                      <SelectItem value="CrossFit">CrossFit</SelectItem>
                      <SelectItem value="Dança">Dança</SelectItem>
                      <SelectItem value="Funcional">Funcional</SelectItem>
                      <SelectItem value="Lutas">Lutas</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
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
                  <FormLabel>Faixa Etária *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a faixa etária" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Infantil (0-12 anos)">Infantil (0-12 anos)</SelectItem>
                      <SelectItem value="Adolescente (13-17 anos)">Adolescente (13-17 anos)</SelectItem>
                      <SelectItem value="Adulto (18-59 anos)">Adulto (18-59 anos)</SelectItem>
                      <SelectItem value="Idoso (60+ anos)">Idoso (60+ anos)</SelectItem>
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
                  <FormLabel>Quem Procurou *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Quem fez o contato" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Própria pessoa">Própria pessoa</SelectItem>
                      <SelectItem value="Responsável">Responsável</SelectItem>
                      <SelectItem value="Familiar">Familiar</SelectItem>
                      <SelectItem value="Amigo">Amigo</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
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
                  <FormLabel>Canal de Origem *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Como nos conheceu" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Instagram">Instagram</SelectItem>
                      <SelectItem value="Facebook">Facebook</SelectItem>
                      <SelectItem value="Google">Google</SelectItem>
                      <SelectItem value="Site">Site</SelectItem>
                      <SelectItem value="Indicação">Indicação</SelectItem>
                      <SelectItem value="Passando na rua">Passando na rua</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
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
                  <FormLabel>Nível de Interesse</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="frio">🟦 Frio - Apenas pesquisando</SelectItem>
                      <SelectItem value="morno">🟨 Morno - Interessado</SelectItem>
                      <SelectItem value="quente">🟥 Quente - Muito interessado</SelectItem>
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
                    <FormLabel>Unidade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id}>
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
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Informações adicionais sobre o lead..."
                      className="min-h-[80px]"
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
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createLeadMutation.isPending}>
                {createLeadMutation.isPending ? 'Criando...' : 'Criar Lead'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
