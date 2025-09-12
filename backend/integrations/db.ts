import { createClient } from '@supabase/supabase-js';
import { encryptToken, decryptToken } from './crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Integration {
  id: string;
  unit_id: string;
  provider: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  timezone: string;
  status: 'connected' | 'disconnected' | 'error';
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateIntegrationData {
  unit_id: string;
  provider: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  timezone?: string;
  metadata?: Record<string, any>;
}

export interface UpdateIntegrationData {
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  timezone?: string;
  status?: 'connected' | 'disconnected' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Busca uma integração por unidade e provider
 */
export async function getIntegration(unitId: string, provider: string): Promise<Integration | null> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('unit_id', unitId)
    .eq('provider', provider)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Não encontrado
    }
    throw new Error(`Error fetching integration: ${error.message}`);
  }

  // Descriptografar tokens se existirem
  if (data.access_token) {
    try {
      data.access_token = await decryptToken(data.access_token);
    } catch (error) {
      console.error('Error decrypting access token:', error);
      data.access_token = null;
    }
  }

  if (data.refresh_token) {
    try {
      data.refresh_token = await decryptToken(data.refresh_token);
    } catch (error) {
      console.error('Error decrypting refresh token:', error);
      data.refresh_token = null;
    }
  }

  return data;
}

/**
 * Cria ou atualiza uma integração
 */
export async function upsertIntegration(data: CreateIntegrationData): Promise<Integration> {
  // Criptografar tokens
  const encryptedAccessToken = await encryptToken(data.access_token);
  const encryptedRefreshToken = await encryptToken(data.refresh_token);

  const integrationData = {
    unit_id: data.unit_id,
    provider: data.provider,
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    token_expires_at: data.token_expires_at,
    timezone: data.timezone || 'UTC',
    status: 'connected' as const,
    metadata: data.metadata || {},
  };

  const { data: result, error } = await supabase
    .from('integrations')
    .upsert(integrationData, {
      onConflict: 'unit_id,provider',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error upserting integration: ${error.message}`);
  }

  return result;
}

/**
 * Atualiza uma integração existente
 */
export async function updateIntegration(
  unitId: string,
  provider: string,
  updates: UpdateIntegrationData
): Promise<Integration> {
  const updateData: any = { ...updates };

  // Criptografar tokens se fornecidos
  if (updates.access_token) {
    updateData.access_token = await encryptToken(updates.access_token);
  }
  if (updates.refresh_token) {
    updateData.refresh_token = await encryptToken(updates.refresh_token);
  }

  const { data, error } = await supabase
    .from('integrations')
    .update(updateData)
    .eq('unit_id', unitId)
    .eq('provider', provider)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating integration: ${error.message}`);
  }

  return data;
}

/**
 * Remove uma integração (desconectar)
 */
export async function deleteIntegration(unitId: string, provider: string): Promise<void> {
  const { error } = await supabase
    .from('integrations')
    .delete()
    .eq('unit_id', unitId)
    .eq('provider', provider);

  if (error) {
    throw new Error(`Error deleting integration: ${error.message}`);
  }
}

/**
 * Lista todas as integrações de uma unidade
 */
export async function listIntegrations(unitId: string): Promise<Integration[]> {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .eq('unit_id', unitId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Error listing integrations: ${error.message}`);
  }

  return data || [];
}

/**
 * Verifica se uma integração está conectada
 */
export async function isIntegrationConnected(unitId: string, provider: string): Promise<boolean> {
  const integration = await getIntegration(unitId, provider);
  return integration?.status === 'connected' && !!integration.access_token;
}