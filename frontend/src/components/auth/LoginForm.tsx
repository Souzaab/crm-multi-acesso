import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
// import backend from '../../client.ts'; // Removido - não está sendo usado no código
import { useAuth } from '../../hooks/useAuth';
import { loginMock, shouldUseMockAuth, getMockCredentials } from '../../lib/auth-mock';
import { CONFIG } from '@/config/environment';
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

// Get sample credentials from mock system
const sampleCredentials = getMockCredentials();

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isAuthenticated, checkTokenExpiry } = useAuth();

  const form = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Check if user is already authenticated
  useEffect(() => {
    checkTokenExpiry(); // Validate current token
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, checkTokenExpiry]);

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      // Check if we should use mock authentication
      if (shouldUseMockAuth()) {
        console.log('🔧 Usando autenticação mock (desenvolvimento)');
        return await loginMock(data.email, data.password);
      }
      
      // Use fetch directly to call the real backend
      const apiBase = CONFIG.API.CLIENT_TARGET;
      
      try {
        console.log('🔗 Fazendo login para:', `${apiBase}/api/users/login`);
        
        const response = await fetch(`${apiBase}/api/users/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password, // Send plain password as expected by simple backend
          }),
        });
        
        console.log('📡 Resposta recebida:', response.status, response.statusText);
        
        // Safe JSON parsing with better error handling
        let responseData = null;
        try {
          const text = await response.text();
          console.log('📄 Texto da resposta:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
          
          if (!text || text.trim() === '') {
            throw new Error('Servidor retornou resposta vazia');
          }
          
          responseData = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ Erro ao parsear JSON:', parseError);
          console.error('📄 Texto recebido:', typeof text === 'string' ? text : 'Não é uma string');
          throw new Error('Servidor retornou resposta inválida. Verifique se o backend está funcionando corretamente.');
        }
        
        if (!response.ok) {
          const errorMessage = responseData?.message || responseData?.error || `Erro HTTP ${response.status}: ${response.statusText}`;
          throw new Error(errorMessage);
        }
        
        if (!responseData) {
          throw new Error('Resposta do servidor está vazia');
        }
        
        console.log('✅ Login bem-sucedido:', responseData);
        return responseData;
      } catch (networkError) {
        // Handle network errors (server offline, etc.)
        console.error('❌ Erro de rede:', networkError);
        
        if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
          throw new Error('🔌 Servidor indisponível. Verifique se o backend está rodando na porta 4000 ou ative o modo mock.');
        }
        
        if (networkError.name === 'AbortError') {
          throw new Error('⏱️ Timeout na conexão. Tente novamente.');
        }
        
        throw networkError;
      }
    },
    onSuccess: async (response) => {
      // Process response from simple backend
      try {
        const userData = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          role: response.user.role,
          tenant_id: response.user.tenant_id || response.user.unit_id, // Support both formats
          is_master: response.user.is_master,
          is_admin: response.user.is_admin,
        };
        
        console.log('Setting auth state with user data:', userData);
        
        // Set auth state
        login(response.token, userData);
        
        toast({
          title: 'Login realizado com sucesso',
          description: `Bem-vindo, ${userData.name}!`,
        });
        
        // Navigate to home page
        navigate('/');
      } catch (error) {
        console.error('❌ Erro ao processar resposta do login:', error);
        throw new Error('Erro ao processar dados do usuário');
      }
    },
    onError: (error: any) => {
      console.error('❌ Erro no login:', error);
      
      let errorMessage = 'Erro desconhecido ao fazer login';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: 'Erro no login',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <LogIn className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              CRM Multi-Acesso
            </CardTitle>
            <CardDescription className="text-slate-300">
              Faça login para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="seu@email.com"
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 pr-10"
                            disabled={loginMutation.isPending}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                            disabled={loginMutation.isPending}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="w-4 h-4" />
                      Entrar
                    </div>
                  )}
                </Button>
              </form>
            </Form>
            
            {/* Sample credentials info */}
            {shouldUseMockAuth() && (
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <h3 className="text-sm font-medium text-slate-200 mb-2">🔧 Modo Desenvolvimento</h3>
                <p className="text-xs text-slate-300 mb-3">Credenciais de teste disponíveis:</p>
                <div className="space-y-2">
                  {sampleCredentials.map((cred, index) => (
                    <div key={index} className="text-xs text-slate-400">
                      <strong className="text-slate-300">{cred.role}:</strong> {cred.email} / {cred.password}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
        
        console.log('Setting auth state with user data:', userData);
        
        // Set auth state
        login(response.token, userData);
        
        toast({
          title: 'Login realizado com sucesso',
          description: `Bem-vindo, ${userData.name}!`,
        });
        
        // Navigate to home page
        navigate('/');
        
      } catch (error) {
        console.error('Error processing login response:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao processar resposta do login',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      
<<<<<<< HEAD:frontend/src/components/auth/LoginForm.tsx
      // Determine user-friendly error message
      let errorTitle = 'Erro no login';
      let errorDescription = 'Email ou senha incorretos';
      
      if (error?.message) {
        if (error.message.includes('Servidor indisponível')) {
          errorTitle = 'Servidor Offline';
          errorDescription = error.message;
        } else if (error.message.includes('resposta inválida')) {
          errorTitle = 'Erro de Comunicação';
          errorDescription = error.message;
        } else if (error.message.includes('Credenciais inválidas') || error.message.includes('Email ou senha')) {
          errorTitle = 'Credenciais Incorretas';
          errorDescription = 'Verifique seu email e senha e tente novamente.';
        } else if (error.message.includes('Timeout')) {
          errorTitle = 'Conexão Lenta';
          errorDescription = error.message;
        } else if (error.message.includes('Email e senha são obrigatórios')) {
          errorTitle = 'Campos Obrigatórios';
          errorDescription = 'Por favor, preencha email e senha.';
        } else {
          errorDescription = error.message;
=======
      let errorMessage = 'Email ou senha incorretos';
      
      if (error?.message) {
        if (error.message.includes('token')) {
          errorMessage = 'Erro de autenticação. Tente novamente.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Erro de conexão. Verifique sua internet.';
        } else {
          errorMessage = error.message;
>>>>>>> 03442db88f22541e78d2a7c7ef558e3a5c471863:frontend/components/auth/LoginForm.tsx
        }
      }
      
      toast({
<<<<<<< HEAD:frontend/src/components/auth/LoginForm.tsx
        title: errorTitle,
        description: errorDescription,
=======
        title: 'Erro no login',
        description: errorMessage,
>>>>>>> 03442db88f22541e78d2a7c7ef558e3a5c471863:frontend/components/auth/LoginForm.tsx
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if (!data.email || !data.password) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }
    
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
