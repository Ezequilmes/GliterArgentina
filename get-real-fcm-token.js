const http = require('http');

/**
 * Script para ayudar a obtener tokens FCM reales desde el navegador
 * Este script crea un servidor local donde puedes pegar tu token FCM real
 */

const PORT = 3001;

const server = http.createServer((req, res) => {
  if (req.method === 'GET') {
    // Servir un formulario HTML simple
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Obtener Token FCM Real</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .container { border: 1px solid #ccc; padding: 20px; border-radius: 5px; }
          textarea { width: 100%; height: 100px; margin: 10px 0; }
          button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; }
          button:hover { background: #0056b3; }
          .instructions { background: #f8f9fa; padding: 15px; border-radius: 3px; margin-bottom: 20px; }
          .token-display { background: #e9ecef; padding: 10px; border-radius: 3px; margin-top: 20px; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎯 Obtener Token FCM Real</h1>
          
          <div class="instructions">
            <h3>Instrucciones:</h3>
            <ol>
              <li>Abre la página de test FCM: <a href="http://localhost:3000/test-fcm" target="_blank">http://localhost:3000/test-fcm</a></li>
              <li>Inicia sesión en la aplicación</li>
              <li>Haz clic en "Obtener Token FCM Real"</li>
              <li>Copia el token que aparezca</li>
              <li>Pégalo aquí abajo</li>
            </ol>
          </div>
          
          <form id="tokenForm">
            <label for="token">Token FCM:</label><br>
            <textarea id="token" name="token" placeholder="Pega aquí tu token FCM real..."></textarea><br>
            <label for="userId">User ID (opcional):</label><br>
            <input type="text" id="userId" name="userId" placeholder="ID del usuario (opcional)" style="width: 100%; margin: 10px 0; padding: 5px;"><br>
            <button type="submit">💾 Guardar y Probar</button>
          </form>
          
          <div id="result"></div>
        </div>
        
        <script>
          document.getElementById('tokenForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const token = document.getElementById('token').value;
            const userId = document.getElementById('userId').value;
            
            if (!token) {
              alert('Por favor, pega un token FCM');
              return;
            }
            
            // Guardar el token en un archivo temporal
            fetch('/save-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token, userId })
            })
            .then(response => response.json())
            .then(data => {
              document.getElementById('result').innerHTML = 
                '<div class="token-display">' +
                '<h3>✅ Token guardado exitosamente!</h3>' +
                '<p><strong>Token:</strong> ' + token.substring(0, 50) + '...</p>' +
                '<p><strong>Archivo:</strong> ' + data.file + '</p>' +
                '<p><strong>User ID:</strong> ' + (userId || 'No especificado') + '</p>' +
                '<p>Ahora puedes usar este token en el script de prueba.</p>' +
                '</div>';
            })
            .catch(error => {
              alert('Error al guardar el token: ' + error.message);
            });
          });
        </script>
      </body>
      </html>
    `);
  } else if (req.method === 'POST' && req.url === '/save-token') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const fs = require('fs');
        const path = require('path');
        
        // Crear un archivo con el token
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `fcm-token-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        const tokenData = {
          token: data.token,
          userId: data.userId || null,
          timestamp: new Date().toISOString(),
          source: 'manual-input'
        };
        
        fs.writeFileSync(filepath, JSON.stringify(tokenData, null, 2));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          file: filename,
          message: 'Token guardado exitosamente'
        }));
        
        console.log(`✅ Token FCM guardado en: ${filename}`);
        console.log(`📋 Token: ${data.token.substring(0, 50)}...`);
        console.log(`👤 User ID: ${data.userId || 'No especificado'}`);
        
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`🎯 Servidor de tokens FCM iniciado en: http://localhost:${PORT}`);
  console.log('📋 Abre esta URL en tu navegador para obtener un token FCM real');
  console.log('');
  console.log('Pasos:');
  console.log('1. Abre http://localhost:3000/test-fcm en otra pestaña');
  console.log('2. Inicia sesión y obtén un token FCM real');
  console.log('3. Copia el token y pégalo en http://localhost:3001');
  console.log('4. El token se guardará automáticamente para usar en pruebas');
});

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('\n👋 Servidor cerrado');
  process.exit(0);
});