import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Calendar, User, Clock, Trash2 } from 'lucide-react';
import type { Lead } from '../../src/utils/mocks';
import { cn } from '@/lib/utils';

interface PipelineCardProps {
  lead: Lead;
  index: number;
  onCardClick: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  canDelete: boolean;
}

const interestLevelConfig = {
  frio: { label: 'Frio', className: 'bg-blue-900/50 text-blue-300 border-blue-500/30' },
  morno: { label: 'Morno', className: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30' },
  quente: { label: 'Quente', className: 'bg-red-900/50 text-red-300 border-red-500/30' },
};

const sourceConfig: Record<string, string> = {
  'Instagram': 'bg-pink-900/50 text-pink-300 border-pink-500/30',
  'WhatsApp': 'bg-green-900/50 text-green-300 border-green-500/30',
  'Google': 'bg-blue-900/50 text-blue-300 border-blue-500/30',
  'Facebook': 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30',
  'Indicação': 'bg-purple-900/50 text-purple-300 border-purple-500/30',
  'Site': 'bg-gray-700 text-gray-300 border-gray-500/30',
  'Passando na rua': 'bg-orange-900/50 text-orange-300 border-orange-500/30',
  'Outros': 'bg-gray-700 text-gray-300 border-gray-500/30',
};

const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "a";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "m";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "min";
  return Math.floor(seconds) + "s";
};

const openWhatsApp = (phoneNumber: string) => {
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  window.open(`https://wa.me/55${cleanNumber}`, '_blank');
};

export default function PipelineCard({ lead, index, onCardClick, onDelete, canDelete }: PipelineCardProps) {
  const interest = interestLevelConfig[lead.interest_level] || interestLevelConfig.morno;
  const sourceClass = sourceConfig[lead.origin_channel] || sourceConfig['Outros'];

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    onDelete(lead);
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-3"
        >
          <Card
            onClick={() => onCardClick(lead)}
            className={cn(
              'bg-gray-900 border border-blue-500/20 text-gray-300 hover:border-blue-500/50 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-900/20 relative group',
              snapshot.isDragging && 'shadow-2xl shadow-blue-900/50 scale-105 border-blue-500/80'
            )}
          >
            <CardContent className="p-3 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-white text-sm truncate flex-1 mr-2">{lead.name}</h4>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Phone 
                    className="h-4 w-4 text-gray-500 hover:text-green-400 transition-colors cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      openWhatsApp(lead.whatsapp_number);
                    }}
                    title="Abrir no WhatsApp"
                  />
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={handleDeleteClick}
                      title="Excluir lead"
                    >
                      <Trash2 className="h-3 w-3 text-red-400 hover:text-red-300" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 flex-wrap">
                  <Badge variant="outline" className={cn("font-mono text-xs", sourceClass)}>
                    {lead.origin_channel.length > 8 ? lead.origin_channel.substring(0, 8) + '...' : lead.origin_channel}
                  </Badge>
                  <Badge variant="outline" className={cn("font-mono text-xs", interest.className)}>
                    {interest.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{timeSince(lead.created_at)}</span>
                </div>
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  <span className="truncate">{lead.who_searched}</span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {lead.discipline} • {lead.age}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {lead.whatsapp_number}
                </div>
                {lead.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-xs truncate">
                      {new Date(lead.scheduled_date).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                )}
              </div>
              
              {lead.observations && (
                <p className="text-xs text-gray-500 pt-1 border-t border-gray-800 truncate" title={lead.observations}>
                  {lead.observations.length > 50 ? lead.observations.substring(0, 50) + '...' : lead.observations}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
