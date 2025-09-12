import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, Settings, CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useIntegrationStatus, useConnectIntegration } from '@/hooks/useIntegrations';
import IntegrationConfigModal from '@/components/IntegrationConfigModal';
import { useNavigate } from 'react-router-dom';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  provider: string;
  timezone?: string;
}

const baseIntegrations = [
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Sincronize sua agenda e eventos diretamente com o Microsoft Outlook e Teams.',
    icon: '🏢', // Placeholder - será substituído por logo real
    provider: 'Microsoft'
  }
];

export default function Integrations() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  
  // Mock unitId - em produção, isso viria do contexto/store da aplicação
  const unitId = 'unit-1';
  
  // Hooks para gerenciar estado da integração Microsoft 365
  const { data: integrationStatus, isLoading, error } = useIntegrationStatus(unitId, 'microsoft');
  const connectMutation = useConnectIntegration();

  const handleConnectOutlook = () => {
    toast({
      title: "Conectando ao Outlook",
      description: "Redirecionando para autenticação Microsoft...",
    });
    
    connectMutation.mutate(unitId);
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigModalOpen(true);
  };

  // Mapear dados da API para o formato da integração
  const integrations: Integration[] = baseIntegrations.map(base => {
    if (base.id === 'microsoft-365') {
      let status: Integration['status'] = 'disconnected';
      
      if (isLoading) {
        status = 'loading';
      } else if (error) {
        status = 'error';
      } else if (integrationStatus?.connected) {
        status = 'connected';
      }
      
      return {
        ...base,
        status,
        timezone: integrationStatus?.timezone,
      };
    }
    return { ...base, status: 'disconnected' as const };
  });

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-900/50 text-green-300 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-900/50 text-red-300 border-red-500/30">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      case 'loading':
        return (
          <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/30">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Verificando...
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-900/50 text-gray-300 border-gray-500/30">
            Desconectado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Integrações</h1>
        <p className="text-gray-400">
          Conecte ferramentas externas ao seu CRM de forma simples e segura.
        </p>
      </div>

      {/* Integrações Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="bg-gray-900/50 border-gray-700 hover:border-blue-500/50 transition-colors">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <CardTitle className="text-white text-lg">{integration.name}</CardTitle>
                    <p className="text-sm text-gray-400">{integration.provider}</p>
                  </div>
                </div>
                {getStatusBadge(integration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="text-gray-300 text-sm leading-relaxed">
                {integration.description}
              </CardDescription>
              
              <div className="flex flex-col sm:flex-row gap-2">
                {integration.id === 'microsoft-365' && integration.status === 'connected' && (
                  <Button 
                    onClick={() => navigate('/integracoes/agenda')}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Acessar Agenda
                  </Button>
                )}
                
                {integration.id === 'microsoft-365' && integration.status !== 'connected' && (
                  <Button 
                    onClick={handleConnectOutlook}
                    disabled={integration.status === 'loading' || connectMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1 disabled:opacity-50"
                  >
                    {integration.status === 'loading' || connectMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link className="h-4 w-4 mr-2" />
                    )}
                    {integration.status === 'loading' ? 'Verificando...' : 'Conectar Outlook'}
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={() => handleConfigure(integration)}
                  disabled={integration.status === 'loading'}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white flex-1 sm:flex-none disabled:opacity-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder quando não há integrações */}
      {integrations.length === 0 && (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🔗</div>
            <h3 className="text-xl font-semibold text-white mb-2">Nenhuma integração configurada ainda</h3>
            <p className="text-gray-400 text-center max-w-md">
              Conecte ferramentas externas para automatizar processos e melhorar a produtividade do seu CRM.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Modal de Configuração */}
      <IntegrationConfigModal
        integration={selectedIntegration}
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        unitId={unitId}
      />
    </div>
  );
}