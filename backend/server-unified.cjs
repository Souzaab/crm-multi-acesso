const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 4000;
const FRONTEND_DIR = path.join(__dirname, '../frontend/dist');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Mock API responses
const mockResponses = {
  '/health': { status: 'ok', message: 'Backend unified server running on port 4000' },
  '/api/health': { status: 'ok', message: 'Backend unified server running on port 4000' },
  '/api/calendar/1/connect': { redirectUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock&response_type=code&redirect_uri=http://localhost:5174/oauth/callback&scope=https://graph.microsoft.com/Calendars.ReadWrite offline_access&state=mock' },
  '/api/calendar/2/connect': { redirectUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock&response_type=code&redirect_uri=http://localhost:5174/oauth/callback&scope=https://graph.microsoft.com/Calendars.ReadWrite offline_access&state=mock' },
  '/api/integrations/calendar/status': { connected: true, provider: 'google', last_sync: new Date().toISOString() },
  '/api/integrations/calendar/disconnect': { success: true, message: 'Calendar integration disconnected successfully' },
  '/api/login': { success: true, token: 'mock-jwt-token', user: { id: 1, name: 'User' } },
  '/api/users/login': { 
    success: true, 
    token: 'mock-jwt-token', 
    user: { 
      id: 1, 
      name: 'Admin User', 
      email: 'admin@test.com',
      role: 'admin',
      tenant_id: 1,
      is_master: true,
      is_admin: true
    } 
  },
  '/api/users': [{ id: 1, name: 'John Doe', email: 'john@example.com' }],
  '/api/leads': {
    leads: [
      { id: 1, name: 'João Silva', email: 'joao@email.com', phone: '11999999999', status: 'novo', source: 'website', unit_id: 1, created_at: new Date().toISOString() },
      { id: 2, name: 'Maria Santos', email: 'maria@email.com', phone: '11888888888', status: 'contato', source: 'facebook', unit_id: 1, created_at: new Date().toISOString() },
      { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', phone: '11777777777', status: 'interessado', source: 'google', unit_id: 1, created_at: new Date().toISOString() }
    ],
    total: 3
  },
  '/api/units': {
    units: [
      { id: 1, name: 'Unidade Centro', address: 'Rua das Flores, 123', phone: '11555555555', created_at: new Date().toISOString() },
      { id: 2, name: 'Unidade Norte', address: 'Av. Principal, 456', phone: '11444444444', created_at: new Date().toISOString() }
    ]
  },
  '/api/metrics/dashboard': {
    total_leads: 156,
    converted_leads: 23,
    conversion_rate: 14.7,
    monthly_evolution: [
      { month: 'Jan', leads: 45, conversions: 8 },
      { month: 'Fev', leads: 52, conversions: 12 },
      { month: 'Mar', leads: 59, conversions: 15 }
    ],
    pipeline_data: [
      { status: 'novo', count: 45 },
      { status: 'contato', count: 32 },
      { status: 'interessado', count: 28 },
      { status: 'convertido', count: 23 }
    ],
    discipline_data: [
      { discipline: 'Matemática', count: 45 },
      { discipline: 'Português', count: 38 },
      { discipline: 'Inglês', count: 32 }
    ],
    recent_leads: [
      { id: 1, name: 'João Silva', email: 'joao@email.com', status: 'novo', created_at: new Date().toISOString() },
      { id: 2, name: 'Maria Santos', email: 'maria@email.com', status: 'contato', created_at: new Date().toISOString() }
    ],
    last_sync: new Date().toISOString()
  },
  '/api/reports': {
    conversionByChannel: [
      { label: 'Website', value: 15, total: 45 },
      { label: 'Facebook', value: 12, total: 38 },
      { label: 'Google Ads', value: 8, total: 32 },
      { label: 'Instagram', value: 6, total: 25 }
    ],
    consultantRanking: [
      { label: 'Ana Silva', value: 23 },
      { label: 'Carlos Santos', value: 18 },
      { label: 'Maria Costa', value: 15 },
      { label: 'João Oliveira', value: 12 }
    ],
    enrollmentsByDiscipline: [
      { label: 'Matemática', value: 45 },
      { label: 'Português', value: 38 },
      { label: 'Inglês', value: 32 },
      { label: 'Física', value: 28 }
    ],
    averageFunnelTime: {
      days: 7,
      hours: 12,
      minutes: 30
    }
  },
  '/api/integrations': [
    {
      id: 'microsoft-365',
      name: 'Microsoft 365',
      provider: 'Microsoft',
      description: 'Sincronize sua agenda e eventos diretamente com o Microsoft Outlook e Teams.',
      status: 'available',
      connected: false,
      icon: 'microsoft'
    }
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Add CORS headers
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // OAuth callback endpoint (handle before API routes)
  if (pathname === '/oauth/callback/microsoft') {
    res.setHeader('Content-Type', 'application/json');
    const urlParams = new URLSearchParams(url.parse(req.url).query);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');
    
    if (error) {
      const response = {
        success: false,
        message: `OAuth error: ${error}`,
        error: error
      };
      res.writeHead(400);
      res.end(JSON.stringify(response));
      return;
    }
    
    if (!code || !state) {
      const response = {
        success: false,
        message: 'Missing required parameters: code or state'
      };
      res.writeHead(400);
      res.end(JSON.stringify(response));
      return;
    }
    
    // Mock successful OAuth callback
    const response = {
      success: true,
      message: 'Microsoft 365 connected successfully',
      provider: 'microsoft',
      unitId: state.replace('mock-unit-', '')
    };
    res.writeHead(200);
    res.end(JSON.stringify(response));
    return;
  }

  // API routes and health endpoint
  if (pathname.startsWith('/api/') || mockResponses[pathname]) {
    res.setHeader('Content-Type', 'application/json');
    
    // Handle POST requests for creating leads
    if (pathname === '/api/leads' && req.method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const leadData = JSON.parse(body);
          
          // Create new lead with mock ID
          const newLead = {
            id: Date.now(), // Simple ID generation
            ...leadData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('✅ Lead criado:', newLead);
          
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, lead: newLead }));
        } catch (error) {
          console.error('❌ Erro ao criar lead:', error);
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
      
      return;
    }
    
    // Check for exact match first
    if (mockResponses[pathname]) {
      res.writeHead(200);
      res.end(JSON.stringify(mockResponses[pathname]));
      return;
    }
    
    // Check for dynamic routes
    const calendarConnectMatch = pathname.match(/^\/api\/calendar\/([\w-]+)\/connect$/);
    if (calendarConnectMatch) {
      const unitId = calendarConnectMatch[1];
      const response = {
        redirectUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=mock&response_type=code&redirect_uri=http://localhost:5174/oauth/callback&scope=https://graph.microsoft.com/Calendars.ReadWrite offline_access&state=mock-unit-${unitId}`
      };
      res.writeHead(200);
      res.end(JSON.stringify(response));
      return;
    }
    
    const calendarStatusMatch = pathname.match(/^\/api\/calendar\/([\w-]+)\/status$/);
    if (calendarStatusMatch) {
      const response = {
        connected: false,
        provider: 'microsoft'
      };
      res.writeHead(200);
      res.end(JSON.stringify(response));
      return;
    }
    
    // Default 404 for unmatched API routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API endpoint not found' }));
    return;
  }

  // Serve static files from frontend dist
  let filePath = path.join(FRONTEND_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // For SPA routing, serve index.html for non-API routes
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }

  const extname = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Serve index.html for SPA routing
        fs.readFile(path.join(FRONTEND_DIR, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Unified server running on http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${FRONTEND_DIR}`);
  console.log(`🔗 API endpoints available at: http://localhost:${PORT}/api/*`);
});

module.exports = server;