import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import backend from '~backend/client';
import { useAuth } from '../../hooks/useAuth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const sampleCredentials = [
  {
    email: 'admin@escola.com',
    password: '123456',
    role: 'Master',
    description: 'Acesso completo ao sistema'
  },
  {
    email: 'professor@escola.com', 
    password: '123456',
    role: 'Usuário',
    description: 'Acesso operacional (Dashboard, Pipeline, Leads)'
  }
];

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      // Hash the password the same way the backend expects
      const hashedPassword = `hash_${data.password}`;
      return backend.users.login({
        email: data.email,
        password_hash: hashedPassword,
      });
    },
    onSuccess: async (response) => {
      // Get user details from token payload
      try {
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        
        // Mock user data based on the token payload
        // In a real app, you'd get this from a separate endpoint
        const userData = {
          id: payload.sub,
          name: payload.email === 'admin@escola.com' ? 'Administrador' : 'Professor Demo',
          email: payload.email || 'unknown',
          role: payload.is_master ? 'admin' : 'user',
          tenant_id: payload.tenant_id,
          is_master: payload.is_master,
          is_admin: payload.is_admin,
        };
        
        login(response.token, userData);
        
        toast({
          title: 'Login realizado com sucesso',
          description: `Bem-vindo, ${userData.name}!`,
        });
        
        navigate('/');
      } catch (error) {
        console.error('Error parsing token:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao processar token de autenticação',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      toast({
        title: 'Erro no login',
        description: error?.message || 'Email ou senha incorretos',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  const fillCredentials = (email: string, password: string) => {
    form.setValue('email', email);
    form.setValue('password', password);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">CRM Multi-Acesso</h1>
          <p className="text-gray-400">Faça login para acessar o sistema</p>
        </div>

        <Card className="bg-gray-900 border-blue-500/30 text-white">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <LogIn className="h-5 w-5 text-blue-400" />
              Entrar no Sistema
            </CardTitle>
            <CardDescription className="text-gray-400">
              Use suas credenciais para acessar o CRM
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
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
                  name="password"
                  rules={{
                    required: 'Senha é obrigatória',
                    minLength: {
                      value: 6,
                      message: 'Senha deve ter pelo menos 6 caracteres'
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            {...field}
                            className="bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-yellow-500/30">
          <CardHeader>
            <CardTitle className="text-yellow-400 text-sm">Credenciais de Demonstração</CardTitle>
            <CardDescription className="text-gray-400 text-xs">
              Clique em uma das opções abaixo para preencher automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sampleCredentials.map((cred, index) => (
              <div
                key={index}
                className="p-3 bg-black/30 border border-gray-700 rounded-lg cursor-pointer hover:bg-black/50 transition-colors"
                onClick={() => fillCredentials(cred.email, cred.password)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white text-sm font-medium">{cred.role}</p>
                    <p className="text-gray-400 text-xs">{cred.email}</p>
                    <p className="text-gray-500 text-xs mt-1">{cred.description}</p>
                  </div>
                  <div className="text-xs text-blue-400 font-mono">
                    {cred.password}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
