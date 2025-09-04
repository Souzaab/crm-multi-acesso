import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Building } from 'lucide-react';
import type { Unit } from '~backend/units/create';

interface UnitsTableProps {
  units: Unit[];
  isLoading: boolean;
  onEditUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
}

export default function UnitsTable({
  units,
  isLoading,
  onEditUnit,
  onDeleteUnit,
}: UnitsTableProps) {
  if (isLoading) {
    return (
      <div className="border border-blue-500/30 rounded-lg overflow-x-auto bg-black/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-blue-500/20 hover:bg-gray-800/50">
              <TableHead className="text-gray-300">Nome</TableHead>
              <TableHead className="text-gray-300">Endereço</TableHead>
              <TableHead className="text-gray-300">Telefone</TableHead>
              <TableHead className="text-gray-300">Data de Criação</TableHead>
              <TableHead className="text-gray-300">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(3)].map((_, i) => (
              <TableRow key={i} className="border-blue-500/20 hover:bg-gray-800/30">
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-32"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-24"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-20"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-800 rounded animate-pulse w-16"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border border-blue-500/30 rounded-lg overflow-x-auto bg-black/30 backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-blue-500/20 hover:bg-gray-800/50">
            <TableHead className="text-gray-300">Nome</TableHead>
            <TableHead className="text-gray-300">Endereço</TableHead>
            <TableHead className="text-gray-300">Telefone</TableHead>
            <TableHead className="text-gray-300">Data de Criação</TableHead>
            <TableHead className="text-gray-300">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {units.length === 0 ? (
            <TableRow className="border-blue-500/20">
              <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Building className="h-8 w-8 text-gray-500" />
                  <p className="text-lg font-medium">Nenhuma unidade encontrada</p>
                  <p className="text-sm">Crie uma nova unidade para começar</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            units.map((unit) => (
              <TableRow key={unit.id} className="border-blue-500/20 hover:bg-gray-800/30 transition-colors">
                <TableCell className="font-medium text-white">{unit.name}</TableCell>
                <TableCell className="text-gray-300">{unit.address || 'N/A'}</TableCell>
                <TableCell className="text-gray-300">{unit.phone || 'N/A'}</TableCell>
                <TableCell className="text-gray-300">
                  {new Date(unit.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-blue-900/30 hover:text-blue-400"
                      onClick={() => onEditUnit(unit)}
                      title="Editar unidade"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-900/30 hover:text-red-400"
                      onClick={() => onDeleteUnit(unit.id)}
                      title="Excluir unidade"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
