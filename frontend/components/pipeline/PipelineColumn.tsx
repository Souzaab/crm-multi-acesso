import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import PipelineCard from './PipelineCard';
import type { Lead } from '~backend/leads/create';

interface PipelineColumnProps {
  column: {
    id: string;
    title: string;
    color: string;
  };
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
}

export default function PipelineColumn({ column, leads, onCardClick }: PipelineColumnProps) {
  return (
    <div className={`min-w-80 w-80 flex-shrink-0 ${column.color} rounded-lg border`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold text-sm text-gray-800">{column.title}</h3>
        <Badge variant="secondary" className="bg-white text-gray-700">{leads.length}</Badge>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-2 space-y-2 min-h-40 transition-colors duration-200 ${
              snapshot.isDraggingOver ? 'bg-muted/50' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <PipelineCard 
                key={lead.id} 
                lead={lead} 
                index={index} 
                onCardClick={onCardClick} 
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
