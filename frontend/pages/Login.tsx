import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBackend } from '../hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const backend = useBackend();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = location.state?.from?.pathname || "/";

  const mutation = useMutation({
    mutationFn: (data: any) => backend.users.login(data),
    onSuccess: (data) => {
      login(data.token);
      navigate(from, { replace: true });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro de Login',
        description: error.message || 'Email ou senha inválidos.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: any) => {
    // In a real app, the password would not be hashed on the client.
    // This is just for demonstration purposes to match the backend expectation.
    mutation.mutate({
      email: data.email,
      password_hash: `hash_${data.password}`,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para acessar o CRM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required {...register('email')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required {...register('password')} />
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
