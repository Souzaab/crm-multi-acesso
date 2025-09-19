import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Server, 
  Code, 
  GitBranch, 
  Table, 
  Key,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useBackend } from '../hooks/useBackend';

export default function DatabaseInfo() {
  const backend = useBackend();

  const { data: dbInfo, isLoading, error } = useQuery({
    queryKey: ['database-integration'],
    queryFn: () => backend.database.getDatabaseIntegration(),
    retry: 3,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Integração do Banco de Dados</h1>
              <p className="text-gray-400">Analisando configuração do banco...</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-4 lg:p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-red-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Integração do Banco de Dados</h1>
              <p className="text-gray-400">Erro ao analisar banco de dados</p>
            </div>
          </div>
          <Alert variant="destructive" className="bg-red-900/50 border-red-500/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-200">
              Erro ao conectar com o banco: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!dbInfo) {
    return null;
  }

  const getProviderIcon = (provider: string) => {
    if (provider.toLowerCase().includes('supabase')) {
      return '🟢'; // Supabase green
    }
    if (provider.toLowerCase().includes('postgresql')) {
      return '🐘'; // PostgreSQL elephant
    }
    return '🗄️'; // Generic database
  };

  const getConnectionStatus = () => {
    if (dbInfo.current_connection_info.current_database === 'Connection failed') {
      return { status: 'error', text: 'Falha na Conexão', color: 'text-red-400' };
    }
    return { status: 'success', text: 'Conectado', color: 'text-green-400' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen bg-black text-white p-4 lg:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Database className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Integração do Banco de Dados</h1>
            <p className="text-gray-400">
              Detalhes completos da configuração e conexão do banco de dados do CRM
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <Alert className={`${connectionStatus.status === 'success' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          {connectionStatus.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className={`font-semibold ${connectionStatus.color}`}>
                Status: {connectionStatus.text}
              </span>
              <Badge variant="outline" className="text-gray-400">
                {dbInfo.database_name}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>

        {/* Main Database Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Server className="h-5 w-5 text-blue-400" />
                Informações do Servidor
              </CardTitle>
              <CardDescription className="text-gray-400">
                Detalhes da conexão e configuração do servidor
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tipo de Banco:</span>
                  <div className="flex items-center gap-2">
                    <span>{getProviderIcon(dbInfo.integration_details.estimated_provider)}</span>
                    <span className="font-medium text-white">{dbInfo.database_type}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Provedor:</span>
                  <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/30">
                    {dbInfo.integration_details.estimated_provider}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Nome do Banco:</span>
                  <span className="font-medium text-white">{dbInfo.current_connection_info.current_database}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Usuário:</span>
                  <span className="font-medium text-white">{dbInfo.current_connection_info.current_user}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Servidor:</span>
                  <span className="font-medium text-white text-sm">{dbInfo.current_connection_info.connection_from}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Code className="h-5 w-5 text-green-400" />
                Configuração Encore.ts
              </CardTitle>
              <CardDescription className="text-gray-400">
                Como o banco está integrado no framework
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Framework:</span>
                  <Badge className="bg-green-900/50 text-green-300 border-green-500/30">
                    {dbInfo.integration_details.framework}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Conexão:</span>
                  <span className="font-medium text-white text-sm">{dbInfo.connection_method}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Migrações:</span>
                  <span className="font-medium text-white text-sm">{dbInfo.integration_details.migration_system}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Configuração:</span>
                  <span className="font-medium text-white text-sm">{dbInfo.integration_details.connection_string_source}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Server Version Details */}
        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Info className="h-5 w-5 text-yellow-400" />
              Versão do Servidor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900/50 p-3 rounded-lg">
              <code className="text-xs text-gray-300 whitespace-pre-wrap">
                {dbInfo.current_connection_info.server_version}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Database Schema */}
        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Table className="h-5 w-5 text-purple-400" />
              Estrutura do Banco
            </CardTitle>
            <CardDescription className="text-gray-400">
              {dbInfo.tables_count} tabelas configuradas no schema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dbInfo.tables_structure.map((table, index) => (
                <Card key={index} className="bg-gray-900/50 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="text-white">{table.table_name}</span>
                      <Badge variant="outline" className="text-xs text-gray-400">
                        {table.estimated_rows} linhas
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Key className="h-3 w-3 text-yellow-400" />
                        <span className="text-gray-400">PK:</span>
                        <span className="text-gray-300">{table.primary_key}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Table className="h-3 w-3 text-blue-400" />
                        <span className="text-gray-400">Colunas:</span>
                        <span className="text-gray-300">{table.column_count}</span>
                      </div>
                      
                      {table.foreign_keys.length > 0 && (
                        <div className="mt-2">
                          <div className="text-gray-400 mb-1">FKs:</div>
                          <div className="space-y-1">
                            {table.foreign_keys.slice(0, 2).map((fk, fkIndex) => (
                              <div key={fkIndex} className="text-gray-500 truncate">
                                • {fk.split(' -> ')[1]}
                              </div>
                            ))}
                            {table.foreign_keys.length > 2 && (
                              <div className="text-gray-500">
                                +{table.foreign_keys.length - 2} mais
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Code Configuration */}
        <Card className="bg-black border-blue-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <GitBranch className="h-5 w-5 text-orange-400" />
              Configuração no Código
            </CardTitle>
            <CardDescription className="text-gray-400">
              Como o banco está configurado nos arquivos do projeto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-white mb-2">📁 Arquivo Principal de Configuração:</h4>
                <div className="bg-gray-900/50 p-3 rounded-lg">
                  <code className="text-sm text-blue-300">backend/database/db.ts</code>
                </div>
                <div className="mt-2 bg-gray-900/50 p-3 rounded-lg">
                  <pre className="text-xs text-gray-300">
{`export const mainDB = new SQLDatabase("supabase_crm", {
  migrations: "./migrations",
});`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">📁 Migrações:</h4>
                <div className="space-y-2">
                  <div className="bg-gray-900/50 p-2 rounded">
                    <code className="text-xs text-blue-300">backend/database/migrations/1_create_all_tables.up.sql</code>
                    <p className="text-xs text-gray-400 mt-1">Criação de todas as tabelas principais</p>
                  </div>
                  <div className="bg-gray-900/50 p-2 rounded">
                    <code className="text-xs text-blue-300">backend/database/migrations/2_fix_constraints_and_data.up.sql</code>
                    <p className="text-xs text-gray-400 mt-1">Correções de constraints e dados de exemplo</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-white mb-2">🔌 Conexão nos Serviços:</h4>
                <div className="text-sm text-gray-300">
                  <p>Cada serviço usa: <code className="text-blue-300">SQLDatabase.named("supabase_crm")</code></p>
                  <p className="text-xs text-gray-400 mt-1">
                    Todos os serviços (leads, units, users, etc.) referenciam o mesmo banco através do nome "supabase_crm"
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
