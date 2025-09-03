import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, User, Clock } from 'lucide-react';
import type { Lead } from '~backend/leads/create';
import { cn } from '@/lib/utils';

interface PipelineCardProps {
  lead: Lead;
  index: number;
  onCardClick: (lead: Lead) => void;
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

export default function PipelineCard({ lead, index, onCardClick }: PipelineCardProps) {
  const interest = interestLevelConfig[lead.interest_level] || interestLevelConfig.morno;
  const sourceClass = sourceConfig[lead.origin_channel] || sourceConfig['Outros'];

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
              'bg-gray-900 border border-gray-800 text-gray-300 hover:border-blue-700 cursor-pointer transition-all duration-200',
              snapshot.isDragging && 'shadow-2xl shadow-blue-900/50 scale-105'
            )}
          >
            <CardContent className="p-3 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-white">{lead.name}</h4>
                <Phone className="h-4 w-4 text-gray-500 hover:text-green-400 transition-colors" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("font-mono", sourceClass)}>{lead.origin_channel}</Badge>
                  <Badge variant="outline" className={cn("font-mono", interest.className)}>{interest.label}</Badge>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>{timeSince(lead.created_at)}</span>
                </div>
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span>{lead.who_searched}</span>
                </div>
                {lead.scheduled_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(lead.scheduled_date).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
              
              {lead.observations && (
                <p className="text-xs text-gray-500 pt-1 border-t border-gray-800">
                  {lead.observations}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
