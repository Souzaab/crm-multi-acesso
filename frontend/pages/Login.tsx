import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBackend } from '../hooks/useBackend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const { register: registerForm, handleSubmit: handleLoginSubmit } = useForm();
  const { register: registerRegForm, handleSubmit: handleRegisterSubmit } = useForm();
  const { login } = useAuth();
  const backend = useBackend();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');

  const from = location.state?.from?.pathname || "/";

  const loginMutation = useMutation({
    mutationFn: (data: any) => backend.users.login(data),
    onSuccess: (data) => {
      login(data.token);
      navigate(from, { replace: true });
      toast({
        title: 'Bem-vindo!',
        description: 'Login realizado com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast({
        title: 'Erro de Login',
        description: error.message || 'Email ou senha inválidos.',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: (data: any) => backend.users.register(data),
    onSuccess: (data) => {
      login(data.token);
      navigate(from, { replace: true });
      toast({
        title: 'Conta criada!',
        description: 'Sua conta foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast({
        title: 'Erro no Cadastro',
        description: error.message || 'Erro ao criar conta.',
        variant: 'destructive',
      });
    },
  });

  const onLoginSubmit = (data: any) => {
    loginMutation.mutate({
      email: data.email,
      password_hash: `hash_${data.password}`,
    });
  };

  const onRegisterSubmit = (data: any) => {
    if (data.password !== data.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    registerMutation.mutate({
      name: data.name,
      email: data.email,
      password: data.password,
      unit_name: data.unit_name,
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md bg-card border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">CRM Multi-Acesso</CardTitle>
          <CardDescription className="text-gray-400">
            Gerencie seus leads e conversões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-900/50">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm">
                <p className="font-medium text-blue-300 mb-2">Dados para teste:</p>
                <p className="text-blue-300">Email: <span className="font-mono">admin@escola.com</span></p>
                <p className="text-blue-300">Senha: <span className="font-mono">123456</span></p>
              </div>
              
              <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-400">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    required 
                    {...registerForm('email')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-400">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Sua senha"
                    required 
                    {...registerForm('password')} 
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4 mt-6">
              <form onSubmit={handleRegisterSubmit(onRegisterSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-name" className="text-gray-400">Nome Completo *</Label>
                  <Input 
                    id="reg-name" 
                    type="text" 
                    placeholder="Seu nome completo" 
                    required 
                    {...registerRegForm('name')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email" className="text-gray-400">Email *</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    placeholder="seu@email.com" 
                    required 
                    {...registerRegForm('email')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password" className="text-gray-400">Senha *</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    required 
                    minLength={6}
                    {...registerRegForm('password')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-gray-400">Confirmar Senha *</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    placeholder="Digite a senha novamente"
                    required 
                    minLength={6}
                    {...registerRegForm('confirmPassword')} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-name" className="text-gray-400">Nome da Escola (opcional)</Label>
                  <Input 
                    id="unit-name" 
                    type="text" 
                    placeholder="Ex: Escola Aprender Mais" 
                    {...registerRegForm('unit_name')} 
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Criando conta...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
