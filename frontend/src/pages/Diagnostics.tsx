import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Shield, 
  Database, 
  Activity,
  AlertTriangle,
  Info,
  AlertCircle
} from 'lucide-react';
import { useBackend } from '../hooks/useBackend';

export default function Diagnostics() {
  const backend = useBackend();
  const [activeTab, setActiveTab] = useState('connectivity');

  const { data: connectivityData, isLoading: loadingConnectivity, refetch: refetchConnectivity } = useQuery({
    queryKey: ['diagnostics-connectivity'],
    queryFn: () => backend.diagnostics.testConnectivity(),
    refetchInterval: false,
  });

  const { data: performanceData, isLoading: loadingPerformance, refetch: refetchPerformance } = useQuery({
    queryKey: ['diagnostics-performance'],
    queryFn: () => backend.diagnostics.testPerformance(),
    refetchInterval: false,
    enabled: activeTab === 'performance',
  });

  const { data: securityData, isLoading: loadingSecurity, refetch: refetchSecurity } = useQuery({
    queryKey: ['diagnostics-security'],
    queryFn: () => backend.diagnostics.testSecurity(),
    refetchInterval: false,
    enabled: activeTab === 'security',
  });

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-400" />
    ) : (
      <XCircle className="h-5 w-5 text-red-400" />
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/50 text-red-300 border-red-500/30';
      case 'high':
        return 'bg-orange-900/50 text-orange-300 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30';
      case 'low':
        return 'bg-blue-900/50 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-700 text-gray-300 border-gray-500/30';
    }
  };

  const handleRefresh = () => {
    switch (activeTab) {
      case 'connectivity':
        refetchConnectivity();
        break;
      case 'performance':
        refetchPerformance();
        break;
      case 'security':
        refetchSecurity();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Diagnósticos Supabase</h1>
            <p className="text-gray-400">
              Verifique a conectividade, performance e segurança da conexão com o banco de dados
            </p>
          </div>
          <Button 
            onClick={handleRefresh}
            disabled={loadingConnectivity || loadingPerformance || loadingSecurity}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loadingConnectivity || loadingPerformance || loadingSecurity) ? 'animate-spin' : ''}`} />
            Atualizar Testes
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="connectivity" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Conectividade
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connectivity" className="space-y-6">
            {connectivityData && (
              <>
                <Card className={`${connectivityData.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      {getStatusIcon(connectivityData.success)}
                      Status Geral da Conectividade
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      {connectivityData.summary.passed} de {connectivityData.summary.total} testes passaram
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">{connectivityData.summary.passed}</div>
                        <div className="text-sm text-gray-400">Testes Passaram</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{connectivityData.summary.failed}</div>
                        <div className="text-sm text-gray-400">Testes Falharam</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400">{connectivityData.summary.total}</div>
                        <div className="text-sm text-gray-400">Total de Testes</div>
                      </div>
                    </div>
                    
                    {connectivityData.recommendations.length > 0 && (
                      <Alert className="bg-blue-900/20 border-blue-500/30">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {connectivityData.recommendations.map((rec, index) => (
                              <div key={index} className="text-blue-200">{rec}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {connectivityData.tests.map((test, index) => (
                    <Card key={index} className="bg-black border-blue-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                          <span className="flex items-center gap-2">
                            {getStatusIcon(test.success)}
                            {test.description}
                          </span>
                          {test.executionTime && (
                            <Badge variant="outline" className="text-gray-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {test.executionTime}ms
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 text-sm mb-2">{test.details}</p>
                        {test.error && (
                          <Alert variant="destructive" className="bg-red-900/20 border-red-500/30">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-red-200">
                              {test.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {loadingConnectivity && (
              <Card className="bg-black border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-400">Executando testes de conectividade...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {performanceData && (
              <>
                <Card className="bg-black border-blue-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Activity className="h-5 w-5 text-blue-400" />
                      Resumo de Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-400">{performanceData.summary.averageLatency}ms</div>
                        <div className="text-sm text-gray-400">Latência Média</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">{performanceData.summary.totalExecutionTime}ms</div>
                        <div className="text-sm text-gray-400">Tempo Total</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-red-400">{performanceData.summary.slowestQuery}</div>
                        <div className="text-sm text-gray-400">Query Mais Lenta</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-400">{performanceData.summary.fastestQuery}</div>
                        <div className="text-sm text-gray-400">Query Mais Rápida</div>
                      </div>
                    </div>
                    
                    {performanceData.recommendations.length > 0 && (
                      <Alert className="bg-blue-900/20 border-blue-500/30">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {performanceData.recommendations.map((rec, index) => (
                              <div key={index} className="text-blue-200">{rec}</div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {performanceData.tests.map((test, index) => (
                    <Card key={index} className="bg-black border-blue-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                          <span className="flex items-center gap-2">
                            {getStatusIcon(test.success)}
                            {test.description}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`${
                              test.executionTime > test.errorThreshold ? 'text-red-400 border-red-500/30' :
                              test.executionTime > test.warningThreshold ? 'text-yellow-400 border-yellow-500/30' :
                              'text-green-400 border-green-500/30'
                            }`}
                          >
                            {test.executionTime}ms
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 text-sm">{test.details}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Limite de aviso: {test.warningThreshold}ms | Limite de erro: {test.errorThreshold}ms
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {loadingPerformance && (
              <Card className="bg-black border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-400">Executando testes de performance...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {securityData && (
              <>
                <Card className={`${securityData.success ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5" />
                      Score de Segurança
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-400">{securityData.summary.securityScore}%</div>
                        <div className="text-sm text-gray-400">Score Geral</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">{securityData.summary.criticalIssues}</div>
                        <div className="text-sm text-gray-400">Problemas Críticos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">{securityData.summary.warnings}</div>
                        <div className="text-sm text-gray-400">Avisos</div>
                      </div>
                    </div>
                    
                    {securityData.recommendations.length > 0 && (
                      <Alert className={`${securityData.summary.criticalIssues > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-blue-900/20 border-blue-500/30'}`}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-1">
                            {securityData.recommendations.map((rec, index) => (
                              <div key={index} className={securityData.summary.criticalIssues > 0 ? 'text-red-200' : 'text-blue-200'}>
                                {rec}
                              </div>
                            ))}
                          </div>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {securityData.tests.map((test, index) => (
                    <Card key={index} className="bg-black border-blue-500/30">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between text-white">
                          <span className="flex items-center gap-2">
                            {getStatusIcon(test.success)}
                            {test.description}
                          </span>
                          <Badge variant="outline" className={getSeverityColor(test.severity)}>
                            {test.severity.toUpperCase()}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 text-sm mb-2">{test.details}</p>
                        {test.recommendation && (
                          <Alert className="bg-yellow-900/20 border-yellow-500/30">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-yellow-200">
                              {test.recommendation}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {loadingSecurity && (
              <Card className="bg-black border-blue-500/30">
                <CardContent className="p-6 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-400">Executando testes de segurança...</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
