const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 4000;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Serve static files from frontend dist
function serveStaticFile(res, filePath) {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
  const fullPath = path.join(frontendDistPath, filePath);
  
  // Security check - prevent directory traversal
  if (!fullPath.startsWith(frontendDistPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Check if file exists first
  fs.stat(fullPath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      // If file not found, serve index.html for SPA routing (except for assets)
      if (filePath.startsWith('assets/')) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Asset not found');
        return;
      }
      
      const indexPath = path.join(frontendDistPath, 'index.html');
      fs.readFile(indexPath, (indexErr, indexData) => {
        if (indexErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
        } else {
          res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
          });
          res.end(indexData);
        }
      });
    } else {
      // File exists, serve it
      fs.readFile(fullPath, (err, data) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Internal Server Error');
          return;
        }
        
        const ext = path.extname(fullPath);
        const contentType = {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon'
        }[ext] || 'application/octet-stream';
        
        // Set appropriate cache headers
        const headers = { 'Content-Type': contentType };
        if (filePath.startsWith('assets/')) {
          headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year for assets
        } else {
          headers['Cache-Control'] = 'no-cache';
        }
        
        res.writeHead(200, headers);
        res.end(data);
      });
    }
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const method = req.method;
  const pathname = parsedUrl.pathname;

  // Set CORS headers for all requests
  Object.keys(corsHeaders).forEach(key => {
    res.setHeader(key, corsHeaders[key]);
  });

  // Handle preflight OPTIONS requests
  if (method === 'OPTIONS') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', method: 'OPTIONS', message: 'CORS preflight successful' }));
    return;
  }

  // API Routes - TODAS com prefixo /api/
  if (pathname.startsWith('/api/') || pathname === '/health') {
    
    // Health check (sem prefixo para compatibilidade)
    if (pathname === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'OK', 
        message: 'Backend funcionando',
        port: PORT,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Health check com prefixo /api/
    if (pathname === '/api/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'OK', 
        message: 'Backend funcionando',
        port: PORT,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // Login endpoint
    if (pathname === '/api/users/login' && method === 'POST') {
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { email, password } = data;

          if (!email || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Email e senha são obrigatórios' }));
            return;
          }

          // Mock successful login based on email
          const isMaster = email === 'admin@escola.com';
          const response = {
            token: 'mock-jwt-token-' + Date.now(),
            user: {
              id: isMaster ? 1 : 2,
              email: email,
              name: isMaster ? 'Admin Master' : 'Usuário Padrão',
              role: isMaster ? 'master' : 'user',
              tenant_id: isMaster ? '1' : '2',
              is_master: isMaster,
              is_admin: isMaster,
            },
            message: 'Login realizado com sucesso'
          };

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Dados inválidos' }));
        }
      });
      return;
    }

    // Units list endpoint
     if (pathname === '/api/units/list' && method === 'GET') {
       const mockUnits = {
         units: [
           {
             id: '1',
             name: 'Escola Principal',
             description: 'Unidade principal da escola',
             active: true
           },
           {
             id: '2', 
             name: 'Filial Norte',
             description: 'Filial da região norte',
             active: true
           },
           {
             id: '3',
             name: 'Filial Sul',
             description: 'Filial da região sul', 
             active: true
           }
         ]
       };

       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(mockUnits));
       return;
     }

     // Metrics dashboard endpoint
     if (pathname === '/api/metrics/dashboard' && method === 'GET') {
       const mockMetrics = {
         totalLeads: 45,
         totalUsers: 12,
         totalUnits: 3,
         conversionRate: 15.5,
         monthlyGrowth: 8.2,
         recentLeads: [
           { id: '1', name: 'João Silva', status: 'novo', created_at: new Date().toISOString() },
           { id: '2', name: 'Maria Santos', status: 'contato', created_at: new Date().toISOString() }
         ]
       };

       res.writeHead(200, { 'Content-Type': 'application/json' });
       res.end(JSON.stringify(mockMetrics));
       return;
     }

    // API 404
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API endpoint não encontrado' }));
    return;
  }

  // Serve static files (frontend)
  const filePath = pathname === '/' ? 'index.html' : pathname.substring(1);
  serveStaticFile(res, filePath);
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor unificado rodando na porta ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API Health: http://localhost:${PORT}/health`);
  console.log(`🔐 API Login: http://localhost:${PORT}/api/users/login`);
  console.log(`🏢 API Units: http://localhost:${PORT}/api/units/list`);
  console.log(`📊 API Metrics: http://localhost:${PORT}/api/metrics/dashboard`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Fechando servidor...');
  server.close(() => {
    console.log('Servidor fechado.');
  });
});