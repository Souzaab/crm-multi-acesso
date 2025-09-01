import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, CheckCircle } from 'lucide-react';
import type { Lead } from '~backend/leads/create';

interface PipelineColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
  };
  leads: Lead[];
}

export default function PipelineColumn({ column, leads }: PipelineColumnProps) {
  return (
    <div className={`min-w-80 ${column.color} rounded-lg p-4 border`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <Badge variant="secondary">{leads.length}</Badge>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-2 min-h-20 ${
              snapshot.isDraggingOver ? 'bg-muted/50 rounded-md' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided, snapshot) => (
                  <Card
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`cursor-move transition-shadow ${
                      snapshot.isDragging ? 'shadow-lg' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{lead.name}</h4>
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {lead.whatsapp_number}
                        </div>

                        {lead.scheduled_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(lead.scheduled_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}

                        {lead.attended && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="h-3 w-3" />
                            Compareceu
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {lead.interest_level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
