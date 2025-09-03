import { api } from "encore.dev/api";
import { whatsappDB } from "./db";

export interface WhatsAppWebhookRequest {
  from: string;
  message: string;
  timestamp: string;
  tenant_id?: string;
}

export interface WhatsAppWebhookResponse {
  success: boolean;
  lead_id?: string;
  message: string;
}

// Processes incoming WhatsApp messages and creates leads automatically.
export const webhook = api<WhatsAppWebhookRequest, WhatsAppWebhookResponse>(
  { expose: true, method: "POST", path: "/whatsapp/webhook" },
  async (req) => {
    try {
      // Default to first tenant if not specified (for backward compatibility)
      let tenantId = req.tenant_id;
      if (!tenantId) {
        const firstTenant = await whatsappDB.queryRow<{id: string}>`
          SELECT id FROM units LIMIT 1
        `;
        tenantId = firstTenant?.id;
      }
      
      if (!tenantId) {
        return {
          success: false,
          message: "No tenant found"
        };
      }
      
      // Simulate AI processing to extract lead information
      const extractedData = extractLeadDataFromMessage(req.message);
      
      if (!extractedData.name) {
        return {
          success: false,
          message: "Could not extract lead information from message"
        };
      }
      
      // Check if lead already exists for this tenant
      const existingLead = await whatsappDB.rawQueryRow(
        `SELECT id FROM leads WHERE whatsapp_number = $1 AND tenant_id = $2`,
        req.from,
        tenantId
      );
      
      if (existingLead) {
        // Add interaction log
        await whatsappDB.rawExec(
          `INSERT INTO lead_interactions (lead_id, interaction_type, content, ai_generated)
          VALUES ($1, 'whatsapp_message', $2, TRUE)`,
          existingLead.id,
          req.message
        );
        
        return {
          success: true,
          lead_id: existingLead.id,
          message: "Interaction logged for existing lead"
        };
      }
      
      // Create new lead
      const newLead = await whatsappDB.rawQueryRow<{id: string}>(
        `INSERT INTO leads (
          name, whatsapp_number, discipline, age_group, who_searched, 
          origin_channel, interest_level, status, ai_interaction_log, 
          tenant_id, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        RETURNING id`,
        extractedData.name,
        req.from,
        extractedData.discipline || 'Não especificado',
        extractedData.age_group || 'Não especificado',
        extractedData.who_searched || 'Própria pessoa',
        'WhatsApp',
        extractedData.interest_level || 'morno',
        extractedData.scheduled_date ? 'agendado' : 'novo_lead',
        JSON.stringify({
          original_message: req.message,
          extracted_data: extractedData,
          confidence_score: extractedData.confidence_score,
          timestamp: req.timestamp
        }),
        tenantId
      );
      
      if (newLead) {
        // Add initial interaction
        await whatsappDB.rawExec(
          `INSERT INTO lead_interactions (lead_id, interaction_type, content, ai_generated)
          VALUES ($1, 'whatsapp_message', $2, TRUE)`,
          newLead.id,
          req.message
        );
        
        return {
          success: true,
          lead_id: newLead.id,
          message: "Lead created successfully"
        };
      }
      
      return {
        success: false,
        message: "Failed to create lead"
      };
      
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      return {
        success: false,
        message: "Internal server error"
      };
    }
  }
);

// Simulated AI function to extract lead data from WhatsApp message
function extractLeadDataFromMessage(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Simple keyword extraction (in real implementation, this would use AI)
  const nameMatch = message.match(/meu nome é ([a-zA-ZÀ-ÿ\s]+)/i) || 
                   message.match(/eu sou ([a-zA-ZÀ-ÿ\s]+)/i) ||
                   message.match(/me chamo ([a-zA-ZÀ-ÿ\s]+)/i);
  
  const disciplines = ['natação', 'musculação', 'pilates', 'yoga', 'crossfit', 'dança', 'funcional'];
  const foundDiscipline = disciplines.find(d => lowerMessage.includes(d));
  
  const ageGroups = ['infantil', 'adolescente', 'adulto', 'idoso'];
  const foundAgeGroup = ageGroups.find(a => lowerMessage.includes(a));
  
  // Check for scheduling keywords
  const schedulingKeywords = ['agendar', 'visita', 'conhecer', 'quando posso', 'horário'];
  const hasSchedulingIntent = schedulingKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Determine interest level
  let interestLevel = 'morno';
  if (lowerMessage.includes('urgente') || lowerMessage.includes('hoje') || lowerMessage.includes('agora')) {
    interestLevel = 'quente';
  } else if (lowerMessage.includes('talvez') || lowerMessage.includes('pensando') || lowerMessage.includes('futuramente')) {
    interestLevel = 'frio';
  }
  
  return {
    name: nameMatch ? nameMatch[1].trim() : extractPossibleName(message),
    discipline: foundDiscipline,
    age_group: foundAgeGroup,
    who_searched: 'Própria pessoa',
    interest_level: interestLevel as 'frio' | 'morno' | 'quente',
    scheduled_date: hasSchedulingIntent ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // Tomorrow if scheduling intent
    confidence_score: nameMatch ? 0.8 : 0.4
  };
}

function extractPossibleName(message: string): string {
  // Try to extract first capitalized word as potential name
  const words = message.split(' ');
  const capitalizedWord = words.find(word => 
    word.length > 2 && 
    word[0] === word[0].toUpperCase() && 
    /^[a-zA-ZÀ-ÿ]+$/.test(word)
  );
  
  return capitalizedWord || 'Nome não identificado';
}
