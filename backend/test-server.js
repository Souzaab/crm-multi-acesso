const http = require('http');
const PORT = 4000;

console.log('Iniciando servidor de teste...');

const server = http.createServer((req, res) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(JSON.stringify({ message: 'Servidor funcionando!' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando em http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejeitada:', reason);
});