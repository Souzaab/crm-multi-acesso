import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import backend from '~backend/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  User, Phone, Calendar, BarChart, Tag, CheckCircle, XCircle, MessageSquare, History, Send
} from 'lucide-react';
import type { Lead } from '~backend/leads/create';
import type { Anotacao } from '~backend/anotacoes/create';
import type { Evento } from '~backend/eventos/create';

interface LeadDetailsModalProps {
  lead: Lead | null;
  tenantId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels: Record<string, string> = {
  novo_lead: 'Novo Lead', agendado: 'Agendado', follow_up_1: 'Follow Up 1',
  follow_up_2: 'Follow Up 2', follow_up_3: 'Follow Up 3', matriculado: 'Matriculado',
  em_espera: 'Em Espera',
};

const interestLabels: Record<string, string> = {
  frio: 'Frio', morno: 'Morno', quente: 'Quente',
};

export default function LeadDetailsModal({ lead, tenantId, open, onOpenChange }: LeadDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = React.useState('');

  const { data: notesData } = useQuery({
    queryKey: ['notes', lead?.id],
    queryFn: () => backend.anotacoes.list({ tenant_id: tenantId, lead_id: lead!.id }),
    enabled: !!lead,
  });

  const { data: eventsData } = useQuery({
    queryKey: ['events', lead?.id],
    queryFn: () => backend.eventos.list({ tenant_id: tenantId, lead_id: lead!.id }),
    enabled: !!lead,
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => backend.anotacoes.create({
      tenant_id: tenantId,
      lead_id: lead!.id,
      conteudo: content,
      tipo: 'geral',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', lead?.id] });
      setNewNote('');
      toast({ title: 'Sucesso', description: 'Anotação adicionada.' });
    },
    onError: (error) => {
      console.error('Error adding note:', error);
      toast({ title: 'Erro', description: 'Não foi possível adicionar a anotação.', variant: 'destructive' });
    },
  });

  const timelineItems = useMemo(() => {
    const notes = notesData?.anotacoes.map(n => ({ ...n, itemType: 'note', date: new Date(n.created_at) })) || [];
    const events = eventsData?.eventos.map(e => ({ ...e, itemType: 'event', date: new Date(e.created_at) })) || [];
    return [...notes, ...events].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [notesData, eventsData]);

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote.trim());
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col bg-gray-900 border-blue-500/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">{lead.name}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Detalhes completos, anotações e histórico do lead.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto pr-2">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="history">Anotações e Histórico</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <InfoItem icon={User} label="Nome" value={lead.name} />
                <InfoItem icon={Phone} label="WhatsApp" value={lead.whatsapp_number} />
                <InfoItem icon={Tag} label="Disciplina" value={lead.discipline} />
                <InfoItem icon={User} label="Faixa Etária" value={lead.age_group} />
                <InfoItem icon={BarChart} label="Status" value={<Badge>{statusLabels[lead.status]}</Badge>} />
                <InfoItem icon={Tag} label="Interesse" value={<Badge variant="secondary">{interestLabels[lead.interest_level]}</Badge>} />
                <InfoItem icon={Calendar} label="Data de Criação" value={new Date(lead.created_at).toLocaleString('pt-BR')} />
                <InfoItem icon={lead.attended ? CheckCircle : XCircle} label="Compareceu" value={lead.attended ? 'Sim' : 'Não'} color={lead.attended ? 'text-green-400' : 'text-red-400'} />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="Adicionar uma nova anotação..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-24 bg-black/50 border-blue-500/30 text-white placeholder-gray-400 focus:border-blue-500"
                  />
                  <Button 
                    onClick={handleAddNote} 
                    disabled={addNoteMutation.isPending || !newNote.trim()}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addNoteMutation.isPending ? 'Salvando...' : 'Salvar Anotação'}
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {timelineItems.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item.itemType === 'note' ? 'bg-yellow-900/50' : 'bg-blue-900/50'}`}>
                          {item.itemType === 'note' ? <MessageSquare className="h-4 w-4 text-yellow-300" /> : <History className="h-4 w-4 text-blue-300" />}
                        </div>
                        {index < timelineItems.length - 1 && <div className="w-px h-full bg-gray-700" />}
                      </div>
                      <div className="flex-1 pb-6">
                        <p className="text-xs text-gray-400">{item.date.toLocaleString('pt-BR')}</p>
                        <div className={`p-3 rounded-lg ${item.itemType === 'note' ? 'bg-gray-800/50' : 'bg-blue-950/50'}`}>
                          <p className="text-sm text-gray-300">
                            {item.itemType === 'note' ? (item as Anotacao).conteudo : (item as Evento).descricao}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const InfoItem = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: React.ReactNode, color?: string }) => (
  <div className="flex items-start gap-3 p-3 bg-black/50 border border-blue-500/20 rounded-lg">
    <Icon className={`h-5 w-5 mt-1 flex-shrink-0 ${color || 'text-blue-400'}`} />
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <div className={`font-medium text-white ${color}`}>{value}</div>
    </div>
  </div>
);
