import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Shield, User as UserIcon } from 'lucide-react';
import type { User } from '../../../client.ts';
import type { Unit } from '../../../client.ts';

interface UsersTableProps {
  users: User[];
  units: Unit[];
  isLoading: boolean;
}

export default function UsersTable({ users, units, isLoading }: UsersTableProps) {
  const getUnitName = (unitId?: string) => {
    if (!unitId) return 'N/A';
    const unit = units.find(u => u.id === unitId);
    return unit?.name || 'N/A';
  };

  const getRoleBadge = (role: string, is_admin: boolean, is_master: boolean) => {
    if (is_master) {
      return (
        <Badge className="bg-purple-900/50 text-purple-300 border-purple-500/30">
          <Shield className="h-3 w-3 mr-1" />
          Master
        </Badge>
      );
    }
    
    if (is_admin || role === 'admin') {
      return (
        <Badge className="bg-red-900/50 text-red-300 border-red-500/30">
          <Shield className="h-3 w-3 mr-1" />
          Administrador
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-blue-900/50 text-blue-300 border-blue-500/30">
        <UserIcon className="h-3 w-3 mr-1" />
        Usuário
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="border border-blue-500/30 rounded-lg overflow-x-auto bg-black/30 backdrop-blur-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-blue-500/20 hover:bg-gray-800/50">
              <TableHead className="text-gray-300">Nome</TableHead>
              <TableHead className="text-gray-300">Email</TableHead>
              <TableHead className="text-gray-300">Função</TableHead>
              <TableHead className="text-gray-300">Unidade</TableHead>
              <TableHead className="text-gray-300">Data de Criação</TableHead>
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
            <TableHead className="text-gray-300">Email</TableHead>
            <TableHead className="text-gray-300">Função</TableHead>
            <TableHead className="text-gray-300">Unidade</TableHead>
            <TableHead className="text-gray-300">Data de Criação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow className="border-blue-500/20">
              <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-gray-500" />
                  <p className="text-lg font-medium">Nenhum usuário encontrado</p>
                  <p className="text-sm">Adicione usuários para começar</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="border-blue-500/20 hover:bg-gray-800/30 transition-colors">
                <TableCell className="font-medium text-white">{user.name}</TableCell>
                <TableCell className="text-gray-300">{user.email}</TableCell>
                <TableCell>
                  {getRoleBadge(user.role, user.is_admin, user.is_master)}
                </TableCell>
                <TableCell className="text-gray-300">{getUnitName(user.unit_id)}</TableCell>
                <TableCell className="text-gray-300">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
