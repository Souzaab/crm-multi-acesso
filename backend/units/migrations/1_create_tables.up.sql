-- Create units table
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create users table  
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  unit_id UUID REFERENCES units(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  discipline VARCHAR(100) NOT NULL,
  age_group VARCHAR(50) NOT NULL,
  who_searched VARCHAR(100) NOT NULL,
  origin_channel VARCHAR(100) NOT NULL,
  interest_level VARCHAR(20) DEFAULT 'morno' CHECK (interest_level IN ('frio', 'morno', 'quente')),
  observations TEXT,
  status VARCHAR(20) DEFAULT 'novo_lead' CHECK (status IN ('novo_lead', 'agendado', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'matriculado', 'em_espera')),
  unit_id UUID REFERENCES units(id),
  user_id UUID REFERENCES users(id),
  scheduled_date TIMESTAMP,
  attended BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,
  ai_interaction_log JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create lead_interactions table
CREATE TABLE lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  interaction_type VARCHAR(20) CHECK (interaction_type IN ('whatsapp_message', 'call', 'visit', 'follow_up')),
  content TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert sample unit
INSERT INTO units (name, address, phone) VALUES 
('Unidade Centro', 'Rua Principal, 123 - Centro', '(11) 99999-9999');

-- Insert sample user
INSERT INTO users (name, email, password_hash, role, unit_id) VALUES 
('Admin User', 'admin@crm.com', 'hash123', 'admin', (SELECT id FROM units LIMIT 1)),
('User Cliente', 'user@crm.com', 'hash456', 'user', (SELECT id FROM units LIMIT 1));
