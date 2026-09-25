const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 3000;
const DATA_DIR = '/data';
const DATA_FILE = path.join(DATA_DIR, 'reservas.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Asegurar directorio y archivo
let actualDataFile = DATA_FILE;
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
  catch (e) { actualDataFile = path.join(__dirname, 'reservas.json'); }
}
if (!fs.existsSync(actualDataFile)) {
  fs.writeFileSync(actualDataFile, JSON.stringify([]));
}

const getContentType = (filePath) => {
  const extname = path.extname(filePath);
  switch (extname) {
    case '.html': return 'text/html; charset=utf-8';
    case '.css': return 'text/css';
    case '.js': return 'text/javascript';
    default: return 'text/plain';
  }
};

const server = http.createServer((req, res) => {
  // Configuración CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Endpoint GET /api/reservas
  if (req.url === '/api/reservas' && req.method === 'GET') {
    fs.readFile(actualDataFile, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Error leyendo datos de reservas' }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data || '[]');
    });
    return;
  }

  // Endpoint POST /api/reservas
  if (req.url === '/api/reservas' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        fs.readFile(actualDataFile, 'utf8', (err, data) => {
          let reservas = [];
          if (!err && data) {
            try { reservas = JSON.parse(data); } catch (e) {}
          }
          
          const nuevaReserva = {
            id: Date.now(),
            cliente: payload.cliente,
            tipo: payload.tipo,
            fecha: payload.fecha,
            invitados: parseInt(payload.invitados)
          };
          reservas.push(nuevaReserva);
          
          fs.writeFile(actualDataFile, JSON.stringify(reservas, null, 2), (errWrite) => {
            if (errWrite) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: 'Error escribiendo datos' }));
            }
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(nuevaReserva));
          });
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Datos enviados inválidos' }));
      }
    });
    return;
  }

  // Servir archivos estáticos
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(PUBLIC_DIR, filePath);

  fs.readFile(filePath, 'utf8', (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Archivo no encontrado');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Error interno del servidor');
      }
      return;
    }

    // Inyectar datos en index.html
    if (req.url === '/' || req.url === '/index.html') {
      const hostname = os.hostname();
      const injectedInfo = `Realizado por Angy | Contenedor ID: ${hostname}`;
      content = content.replace('{{HOST_INFO}}', injectedInfo);
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor nativo Elegance corriendo en http://localhost:${PORT}`);
});
