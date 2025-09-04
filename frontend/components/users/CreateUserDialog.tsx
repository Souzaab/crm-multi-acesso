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
import { useToast } from '@/components/ui/use-toast';
import type { CreateUserRequest } from '~backend/users/create';
import type { Unit } from '~backend/units/create';

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: Unit[];
  selectedTenantId: string;
}

export default function CreateUserDialog({ open, onOpenChange, units, selectedTenantId }: CreateUserDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateUserRequest>({
    defaultValues: {
      name: '',
      email: '',
      password_hash: '',
      role: 'user',
      unit_id: '',
      tenant_id: selectedTenantId,
      is_master: false,
      is_admin: false,
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => backend.users.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', selectedTenantId] });
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso',
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar usuário',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreateUserRequest) => {
    // In a real app, you would hash the password on the backend
    createUserMutation.mutate({
      ...data,
      password_hash: `hash_${data.password_hash}`, // Temporary solution
      tenant_id: selectedTenantId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-blue-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Criar Novo Usuário</DialogTitle>
          <DialogDescription className="text-gray-400">
            Preencha as informações do novo usuário.
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
                      placeholder="Nome do usuário" 
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
              name="email"
              rules={{ 
                required: 'Email é obrigatório',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Email inválido'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="email@exemplo.com" 
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
              name="password_hash"
              rules={{ 
                required: 'Senha é obrigatória',
                minLength: { value: 6, message: 'Senha deve ter pelo menos 6 caracteres' }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Senha *</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Senha do usuário" 
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
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-black/50 border-blue-500/30 text-white">
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gray-900 border-gray-700">
                      <SelectItem value="user" className="text-white hover:bg-gray-800">Usuário</SelectItem>
                      <SelectItem value="admin" className="text-white hover:bg-gray-800">Administrador</SelectItem>
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
                        <SelectTrigger className="bg-black/50 border-blue-500/30 text-white">
                          <SelectValue placeholder="Selecione a unidade" />
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
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createUserMutation.isPending}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {createUserMutation.isPending ? 'Criando...' : 'Criar Usuário'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
