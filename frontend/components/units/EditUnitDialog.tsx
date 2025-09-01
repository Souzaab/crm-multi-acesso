import React, { useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import type { Unit } from '~backend/units/create';
import type { UpdateUnitRequest } from '~backend/units/update';

interface EditUnitDialogProps {
  unit: Unit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditUnitDialog({ unit, open, onOpenChange }: EditUnitDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<UpdateUnitRequest>({
    defaultValues: {
      id: '',
      name: '',
      address: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (unit) {
      form.reset({
        id: unit.id,
        name: unit.name,
        address: unit.address || '',
        phone: unit.phone || '',
      });
    }
  }, [unit, form]);

  const updateUnitMutation = useMutation({
    mutationFn: (data: UpdateUnitRequest) => backend.units.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: 'Sucesso',
        description: 'Unidade atualizada com sucesso',
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error updating unit:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar unidade',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: UpdateUnitRequest) => {
    updateUnitMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Unidade</DialogTitle>
          <DialogDescription>
            Atualize as informações da unidade.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da unidade" {...field} />
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
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Endereço completo da unidade" {...field} />
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
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="(11) 99999-9999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateUnitMutation.isPending}>
                {updateUnitMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
