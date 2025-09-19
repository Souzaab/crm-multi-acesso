import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '../../../client.ts';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { CreateUnitRequest } from '../../../client.ts';

interface CreateUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateUnitDialog({ open, onOpenChange }: CreateUnitDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateUnitRequest>({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: CreateUnitRequest) => backend.units.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: 'Sucesso',
        description: 'Unidade criada com sucesso',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating unit:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar unidade',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateUnitRequest) => {
    createUnitMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-blue-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Nova Unidade</DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha as informações da nova unidade.
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
                      placeholder="Nome da unidade" 
                      {...field} 
                      className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Endereço</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Endereço completo da unidade" 
                      {...field} 
                      className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(11) 99999-9999" 
                      {...field}
                      className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500"
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createUnitMutation.isPending}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createUnitMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {createUnitMutation.isPending ? 'Criando...' : 'Criar Unidade'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
