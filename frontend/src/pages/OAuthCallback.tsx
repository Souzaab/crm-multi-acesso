import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { CONFIG } from '@/config/environment';

interface CallbackState {
  status: 'loading' | 'success' | 'error';
  message: string;
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [callbackState, setCallbackState] = useState<CallbackState>({
    status: 'loading',
    message: 'Processando autenticação...'
  });

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Obter parâmetros da URL
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Verificar se houve erro na autenticação
        if (error) {
          setCallbackState({
            status: 'error',
            message: errorDescription || 'Erro na autenticação Microsoft'
          });
          
          toast({
            title: "Erro na autenticação",
            description: errorDescription || 'Falha ao conectar com Microsoft 365',
            variant: "destructive",
          });
          
          // Redirecionar para integrações após 3 segundos
          setTimeout(() => navigate('/integrations'), 3000);
          return;
        }

        // Verificar se temos o código de autorização
        if (!code || !state) {
          setCallbackState({
            status: 'error',
            message: 'Parâmetros de autenticação inválidos'
          });
          
          setTimeout(() => navigate('/integrations'), 3000);
          return;
        }

        // Processar o callback no backend
        const response = await fetch(`${CONFIG.API_BASE_URL}/oauth/callback/microsoft?code=${code}&state=${state}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const result = await response.json();

        if (result.success) {
          setCallbackState({
            status: 'success',
            message: 'Microsoft 365 conectado com sucesso!'
          });
          
          toast({
            title: "Sucesso!",
            description: "Microsoft 365 foi conectado com sucesso.",
          });
          
          // Redirecionar para integrações após 2 segundos
          setTimeout(() => navigate('/integrations'), 2000);
        } else {
          throw new Error(result.message || 'Falha ao processar callback');
        }
        
      } catch (error) {
        console.error('Erro no callback OAuth:', error);
        
        setCallbackState({
          status: 'error',
          message: 'Erro ao processar autenticação'
        });
        
        toast({
          title: "Erro",
          description: "Falha ao processar a autenticação Microsoft.",
          variant: "destructive",
        });
        
        setTimeout(() => navigate('/integrations'), 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate, toast]);

  const getIcon = () => {
    switch (callbackState.status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-500" />;
    }
  };

  const getTitle = () => {
    switch (callbackState.status) {
      case 'loading':
        return 'Processando...';
      case 'success':
        return 'Sucesso!';
      case 'error':
        return 'Erro';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>
            Autenticação Microsoft 365
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {callbackState.message}
          </p>
          {callbackState.status !== 'loading' && (
            <p className="text-xs text-gray-500 mt-4">
              Redirecionando em alguns segundos...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}