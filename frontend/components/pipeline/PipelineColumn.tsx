import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Badge } from '@/components/ui/badge';
import PipelineCard from './PipelineCard';
import type { Lead } from '../../src/utils/mocks';

interface PipelineColumnProps {
  column: {
    id: string;
    title: string;
  };
  leads: Lead[];
  onCardClick: (lead: Lead) => void;
  onDelete: (lead: Lead) => void;
  canDelete: boolean;
}

export default function PipelineColumn({ column, leads, onCardClick, onDelete, canDelete }: PipelineColumnProps) {
  return (
    <div className="min-w-[320px] w-[320px] flex-shrink-0 bg-black/30 border border-blue-500/20 backdrop-blur-sm rounded-xl flex flex-col">
      <div className="p-4 bg-gradient-to-b from-blue-600/50 to-blue-800/50 rounded-t-xl flex justify-between items-center shadow-inner-top">
        <h3 className="font-semibold text-white">{column.title}</h3>
        <Badge variant="secondary" className="bg-black/20 text-white">{leads.length}</Badge>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`p-2 space-y-2 min-h-[200px] transition-colors duration-200 flex-grow overflow-y-auto rounded-b-xl ${
              snapshot.isDraggingOver ? 'bg-blue-900/20' : ''
            }`}
          >
            {leads.map((lead, index) => (
              <PipelineCard 
                key={lead.id} 
                lead={lead} 
                index={index} 
                onCardClick={onCardClick}
                onDelete={onDelete}
                canDelete={canDelete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
