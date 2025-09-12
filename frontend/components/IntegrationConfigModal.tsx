import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Settings } from 'lucide-react';
import { useUpdateIntegrationConfig, useDisconnectIntegration, TIMEZONES } from '@/hooks/useIntegrations';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  provider: string;
  timezone?: string;
}

interface IntegrationConfigModalProps {
  integration: Integration | null;
  isOpen: boolean;
  onClose: () => void;
  unitId: string;
}

const configSchema = z.object({
  timezone: z.string().min(1, 'Selecione um fuso horário'),
});

type ConfigFormData = z.infer<typeof configSchema>;

export default function IntegrationConfigModal({
  integration,
  isOpen,
  onClose,
  unitId,
}: IntegrationConfigModalProps) {
  const updateConfigMutation = useUpdateIntegrationConfig();
  const disconnectMutation = useDisconnectIntegration();

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      timezone: integration?.timezone || 'America/Sao_Paulo',
    },
  });

  const onSubmit = async (data: ConfigFormData) => {
    if (!integration) return;
    
    try {
      await updateConfigMutation.mutateAsync({
        unitId,
        config: data,
      });
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDisconnect = async () => {
    if (!integration) return;
    
    try {
      await disconnectMutation.mutateAsync(unitId);
      onClose();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  if (!integration) return null;

  const isConnected = integration.status === 'connected';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurar {integration.name}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure as opções de integração para {integration.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isConnected ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Fuso Horário</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                            <SelectValue placeholder="Selecione um fuso horário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          {TIMEZONES.map((timezone) => (
                            <SelectItem
                              key={timezone.value}
                              value={timezone.value}
                              className="text-white hover:bg-gray-700"
                            >
                              {timezone.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateConfigMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    {updateConfigMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Integração não conectada
              </h3>
              <p className="text-gray-400 mb-4">
                Conecte-se ao {integration.name} primeiro para acessar as configurações.
              </p>
              <Button
                variant="outline"
                onClick={onClose}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Fechar
              </Button>
            </div>
          )}

          {isConnected && (
            <>
              <Separator className="bg-gray-700" />
              
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Zona de Perigo</h4>
                <p className="text-xs text-gray-400">
                  Desconectar removerá todos os tokens de acesso e configurações.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {disconnectMutation.isPending ? 'Desconectando...' : 'Desconectar Integração'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}