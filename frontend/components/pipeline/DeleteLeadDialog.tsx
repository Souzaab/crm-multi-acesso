import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { Lead } from '../../src/utils/mocks';

interface DeleteLeadDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export default function DeleteLeadDialog({ 
  lead, 
  open, 
  onOpenChange, 
  onConfirm, 
  isDeleting 
}: DeleteLeadDialogProps) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-red-500/30 text-white">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-white">Confirmar Exclusão</DialogTitle>
              <DialogDescription className="text-gray-400">
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-gray-300 mb-4">
            Deseja realmente excluir o lead <strong className="text-white">"{lead.name}"</strong>?
          </p>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-200">
              <strong>Atenção:</strong> Todos os dados relacionados a este lead serão excluídos permanentemente, incluindo:
            </p>
            <ul className="text-sm text-red-300 mt-2 space-y-1 list-disc list-inside">
              <li>Anotações e observações</li>
              <li>Histórico de eventos</li>
              <li>Agendamentos</li>
              <li>Interações registradas</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
