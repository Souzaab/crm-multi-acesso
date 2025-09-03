import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, CheckCircle, User } from 'lucide-react';
import type { Lead } from '~backend/leads/create';

interface PipelineCardProps {
  lead: Lead;
  index: number;
  onCardClick: (lead: Lead) => void;
}

const interestLevelColors: Record<string, string> = {
  frio: 'bg-blue-100 text-blue-800',
  morno: 'bg-yellow-100 text-yellow-800',
  quente: 'bg-red-100 text-red-800',
};

export default function PipelineCard({ lead, index, onCardClick }: PipelineCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2"
        >
          <Card
            onClick={() => onCardClick(lead)}
            className={`cursor-pointer transition-shadow hover:shadow-lg ${
              snapshot.isDragging ? 'shadow-xl scale-105' : ''
            }`}
          >
            <CardContent className="p-3 space-y-2">
              <h4 className="font-semibold text-sm text-gray-800">{lead.name}</h4>
              
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{lead.whatsapp_number}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User className="h-3 w-3" />
                <span>{lead.discipline}</span>
              </div>

              {lead.scheduled_date && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(lead.scheduled_date).toLocaleDateString('pt-BR')}</span>
                </div>
              )}

              {lead.attended && (
                <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                  <CheckCircle className="h-3 w-3" />
                  <span>Compareceu</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <Badge variant="secondary" className={interestLevelColors[lead.interest_level]}>
                  {lead.interest_level}
                </Badge>
                <span className="text-xs text-gray-500">
                  {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Draggable>
  );
}
