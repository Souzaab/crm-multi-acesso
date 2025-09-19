import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Wrench, 
  Activity, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Info,
  RefreshCw,
  Zap,
  Shield
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useBackend } from '../hooks/useBackend';

export default function Tools() {
  const backend = useBackend();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('health');

  const setupMutation = useMutation({
    mutationFn: () => backend.tools.setupTools(),
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Sucesso' : 'Atenção',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao executar configuração automática',
        variant: 'destructive',
      });
    },
  });

  const maintenanceMutation = useMutation({
    mutationFn: () => backend.tools.runMaintenance(),
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Sucesso' : 'Atenção',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao executar manutenção',
        variant: 'destructive',
      });
    },
  });

  const integrationMutation = useMutation({
    mutationFn: () => backend.integration.testSupabaseIntegration(),
    onSuccess: (data) => {
      toast({
        title: data.success ? 'Sucesso' : 'Atenção',
        description: data.message,
        variant: data.success ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao testar integração',
        variant: 'destructive',
      });
    },
  });

  const healthMutation = useMutation({
    mutationFn: () => backend.health.check(),
    onSuccess: (data) => {
      toast({
        title: data.status === 'healthy' ? 'Sistema Saudável' : 'Problemas Detectados',
        description: `${data.services.length} serviços verificados`,
        variant: data.status === 'healthy' ? 'default' : 'destructive',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: 'Falha ao verificar saúde do sistema',
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-400" />
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Ferramentas do Sistema</h1>
            <p className="text-gray-400">
              Configuração, manutenção e diagnósticos avançados para o CRM
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health Check
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Manutenção
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Integração
            </TabsTrigger>
          </TabsList>

          <TabsContent value="health" className="space-y-6">
            <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Activity className="h-5 w-5 text-green-400" />
                  Health Check do Sistema
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Verificação completa da saúde de todos os componentes do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => healthMutation.mutate()}
                  disabled={healthMutation.isPending}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${healthMutation.isPending ? 'animate-spin' : ''}`} />
                  {healthMutation.isPending ? 'Verificando...' : 'Verificar Saúde do Sistema'}
                </Button>

                {healthMutation.data && (
                  <div className="space-y-4">
                    <Alert className={`${healthMutation.data.status === 'healthy' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                      <Activity className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex items-center justify-between">
                          <span>Status Geral: <strong>{healthMutation.data.status === 'healthy' ? 'Saudável' : 'Com Problemas'}</strong></span>
                          <Badge variant="outline" className="text-gray-400">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(healthMutation.data.timestamp).toLocaleString('pt-BR')}
                          </Badge>
                        </div>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Database className="h-4 w-4 text-blue-400" />
                            Banco de Dados
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            {getStatusIcon(healthMutation.data.database.connected)}
                            <span className="text-sm">Latência: {healthMutation.data.database.latency}ms</span>
                          </div>
                          {healthMutation.data.database.error && (
                            <p className="text-xs text-red-400 mt-2">{healthMutation.data.database.error}</p>
                          )}
                        </CardContent>
                      </Card>

                      {healthMutation.data.services.map((service, index) => (
                        <Card key={index} className="bg-gray-900/50 border-gray-700">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span className="capitalize">{service.name}</span>
                              {getStatusIcon(service.status === 'up')}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-xs text-gray-400">{service.details}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Settings className="h-5 w-5 text-blue-400" />
                  Configuração Automática
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure automaticamente o sistema CRM com todas as dependências e dados iniciais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setupMutation.mutate()}
                  disabled={setupMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Zap className={`h-4 w-4 mr-2 ${setupMutation.isPending ? 'animate-spin' : ''}`} />
                  {setupMutation.isPending ? 'Configurando...' : 'Executar Configuração Automática'}
                </Button>

                {setupMutation.data && (
                  <div className="space-y-4">
                    <Alert className={`${setupMutation.data.success ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{setupMutation.data.message}</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      {setupMutation.data.steps.map((step, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(step.success)}
                            <div>
                              <p className="font-medium text-white">{step.description}</p>
                              <p className="text-xs text-gray-400">{step.details}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-gray-400">
                            {step.duration}ms
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {setupMutation.data.recommendations.length > 0 && (
                      <Alert className="bg-blue-900/20 border-blue-500/30">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Recomendações:</strong>
                            {setupMutation.data.recommendations.map((rec, index) => (
                              <div key={index} className="text-blue-200">{rec}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wrench className="h-5 w-5 text-orange-400" />
                  Manutenção do Sistema
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Otimização, limpeza e manutenção preventiva do banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => maintenanceMutation.mutate()}
                  disabled={maintenanceMutation.isPending}
                  className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white"
                >
                  <Wrench className={`h-4 w-4 mr-2 ${maintenanceMutation.isPending ? 'animate-spin' : ''}`} />
                  {maintenanceMutation.isPending ? 'Executando Manutenção...' : 'Executar Manutenção'}
                </Button>

                {maintenanceMutation.data && (
                  <div className="space-y-4">
                    <Alert className={`${maintenanceMutation.data.success ? 'bg-green-900/20 border-green-500/30' : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                      <Wrench className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{maintenanceMutation.data.message}</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Estatísticas Antes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs">
                          <div>Leads: {maintenanceMutation.data.statistics.before.totalLeads}</div>
                          <div>Eventos: {maintenanceMutation.data.statistics.before.totalEvents}</div>
                          <div>Tamanho: {maintenanceMutation.data.statistics.before.databaseSize}</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Estatísticas Depois</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs">
                          <div>Leads: {maintenanceMutation.data.statistics.after.totalLeads}</div>
                          <div>Eventos: {maintenanceMutation.data.statistics.after.totalEvents}</div>
                          <div>Tamanho: {maintenanceMutation.data.statistics.after.databaseSize}</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      {maintenanceMutation.data.tasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(task.success)}
                            <div>
                              <p className="font-medium text-white">{task.description}</p>
                              <p className="text-xs text-gray-400">{task.details}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-gray-400">
                              {task.duration}ms
                            </Badge>
                            {task.recordsAffected !== undefined && (
                              <p className="text-xs text-gray-500 mt-1">{task.recordsAffected} registros</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {maintenanceMutation.data.statistics.improvement && (
                      <Alert className="bg-blue-900/20 border-blue-500/30">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Melhorias:</strong> {maintenanceMutation.data.statistics.improvement}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Database className="h-5 w-5 text-purple-400" />
                  Teste de Integração Supabase
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Verificação completa da integração com Supabase e validação de todas as funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => integrationMutation.mutate()}
                  disabled={integrationMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <Shield className={`h-4 w-4 mr-2 ${integrationMutation.isPending ? 'animate-spin' : ''}`} />
                  {integrationMutation.isPending ? 'Testando Integração...' : 'Testar Integração Supabase'}
                </Button>

                {integrationMutation.data && (
                  <div className="space-y-4">
                    <Alert className={`${integrationMutation.data.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                      <Database className="h-4 w-4" />
                      <AlertDescription>
                        <strong>{integrationMutation.data.message}</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Performance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 text-xs">
                          <div>Query Média: {integrationMutation.data.configuration.performance.averageQueryTime}ms</div>
                          <div>Conexão: {integrationMutation.data.configuration.performance.connectionTime}ms</div>
                          <div>Score: {integrationMutation.data.configuration.performance.throughputScore}/100</div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Tabelas</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          {integrationMutation.data.configuration.tablesFound.length} tabelas encontradas
                          <div className="mt-1 space-y-1">
                            {integrationMutation.data.configuration.tablesFound.slice(0, 5).map(table => (
                              <div key={table} className="text-gray-500">• {table}</div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-900/50 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Permissões</CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs">
                          {integrationMutation.data.configuration.permissions.filter(p => p.allowed).length} de {integrationMutation.data.configuration.permissions.length} permitidas
                          <div className="mt-1 space-y-1">
                            {integrationMutation.data.configuration.permissions.slice(0, 3).map((perm, idx) => (
                              <div key={idx} className="flex items-center gap-1">
                                {perm.allowed ? <CheckCircle className="h-3 w-3 text-green-400" /> : <XCircle className="h-3 w-3 text-red-400" />}
                                <span className="text-gray-500">{perm.operation}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-2">
                      {integrationMutation.data.tests.map((test, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(test.success)}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{test.description}</p>
                                {test.critical && (
                                  <Badge variant="outline" className="text-red-400 border-red-500/30 text-xs">
                                    CRÍTICO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">{test.details}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-gray-400">
                            {test.duration}ms
                          </Badge>
                        </div>
                      ))}
                    </div>

                    {integrationMutation.data.recommendations.length > 0 && (
                      <Alert className="bg-blue-900/20 border-blue-500/30">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            <strong>Recomendações:</strong>
                            {integrationMutation.data.recommendations.map((rec, index) => (
                              <div key={index} className="text-blue-200">{rec}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
