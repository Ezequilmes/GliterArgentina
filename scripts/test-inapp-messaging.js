#!/usr/bin/env node

/**
 * Script de pruebas para el sistema de In-App Messaging
 * Verifica la funcionalidad en desarrollo y producción
 */

import https from 'https';
import http from 'http';

class InAppMessagingTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.isHttps = baseUrl.startsWith('https');
    this.client = this.isHttps ? https : http;
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      
      const options = {
        hostname: url.hostname,
        port: url.port || (this.isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'InAppMessaging-Tester/1.0'
        }
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = this.client.request(options, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              body: body ? JSON.parse(body) : null
            };
            resolve(result);
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: body
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  async testConfigEndpoint() {
    console.log('🔧 Probando endpoint de configuración...');
    
    try {
      const response = await this.makeRequest('/api/in-app-messages/config');
      
      if (response.statusCode === 200) {
        console.log('✅ GET /api/in-app-messages/config - OK');
        console.log('   Configuración:', JSON.stringify(response.body, null, 2));
        
        // Probar actualización de configuración
        const updateData = {
          maxMessagesPerSession: 5,
          displayInterval: 45000
        };
        
        const updateResponse = await this.makeRequest('/api/in-app-messages/config', 'POST', updateData);
        
        if (updateResponse.statusCode === 200) {
          console.log('✅ POST /api/in-app-messages/config - OK');
        } else {
          console.log(`⚠️  POST /api/in-app-messages/config - Status: ${updateResponse.statusCode}`);
        }
      } else {
        console.log(`❌ GET /api/in-app-messages/config - Status: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Error en endpoint de configuración: ${error.message}`);
    }
  }

  async testMessagesEndpoint() {
    console.log('\\n💬 Probando endpoint de mensajes...');
    
    try {
      const response = await this.makeRequest('/api/in-app-messages/messages');
      
      if (response.statusCode === 200) {
        console.log('✅ GET /api/in-app-messages/messages - OK');
        console.log(`   Mensajes encontrados: ${response.body.messages?.length || 0}`);
        
        if (response.body.messages && response.body.messages.length > 0) {
          console.log('   Primer mensaje:', JSON.stringify(response.body.messages[0], null, 2));
        }
        
        // Probar creación de mensaje
        const newMessage = {
          title: 'Mensaje de Prueba',
          body: 'Este es un mensaje de prueba del sistema',
          priority: 'normal',
          actions: [{
            label: 'Ver más',
            actionUrl: '/dashboard'
          }]
        };
        
        const createResponse = await this.makeRequest('/api/in-app-messages/messages', 'POST', newMessage);
        
        if (createResponse.statusCode === 201) {
          console.log('✅ POST /api/in-app-messages/messages - OK');
          console.log('   Mensaje creado:', createResponse.body.messageId);
        } else {
          console.log(`⚠️  POST /api/in-app-messages/messages - Status: ${createResponse.statusCode}`);
        }
      } else {
        console.log(`❌ GET /api/in-app-messages/messages - Status: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Error en endpoint de mensajes: ${error.message}`);
    }
  }

  async testAnalyticsEndpoints() {
    console.log('\\n📊 Probando endpoints de analytics...');
    
    try {
      // Probar tracking de mensaje mostrado
      const messageDisplayedData = {
        messageId: 'test_msg_001',
        campaignName: 'test_campaign',
        timestamp: new Date().toISOString()
      };
      
      const displayedResponse = await this.makeRequest(
        '/api/in-app-messages/analytics/message-displayed',
        'POST',
        messageDisplayedData
      );
      
      if (displayedResponse.statusCode === 200) {
        console.log('✅ POST /api/in-app-messages/analytics/message-displayed - OK');
      } else {
        console.log(`⚠️  POST /api/in-app-messages/analytics/message-displayed - Status: ${displayedResponse.statusCode}`);
      }
      
      // Probar tracking de acción clickeada
      const actionClickedData = {
        messageId: 'test_msg_001',
        actionLabel: 'Ver más',
        actionUrl: '/dashboard',
        timestamp: new Date().toISOString()
      };
      
      const clickedResponse = await this.makeRequest(
        '/api/in-app-messages/analytics/action-clicked',
        'POST',
        actionClickedData
      );
      
      if (clickedResponse.statusCode === 200) {
        console.log('✅ POST /api/in-app-messages/analytics/action-clicked - OK');
      } else {
        console.log(`⚠️  POST /api/in-app-messages/analytics/action-clicked - Status: ${clickedResponse.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Error en endpoints de analytics: ${error.message}`);
    }
  }

  async runAllTests() {
    console.log(`🧪 Iniciando pruebas para: ${this.baseUrl}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n');
    
    await this.testConfigEndpoint();
    await this.testMessagesEndpoint();
    await this.testAnalyticsEndpoints();
    
    console.log('\\n🎉 Pruebas completadas');
  }
}

async function main() {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('❌ Uso: npm run test:inapp <URL_BASE>');
    console.error('   Ejemplos:');
    console.error('   npm run test:inapp http://localhost:3000');
    console.error('   npm run test:inapp https://miapp.com');
    process.exit(1);
  }

  // Validar URL
  try {
    new URL(baseUrl);
  } catch (error) {
    console.error(`❌ URL inválida: ${baseUrl}`);
    process.exit(1);
  }

  const tester = new InAppMessagingTester(baseUrl);
  await tester.runAllTests();
}

main().catch((error) => {
  console.error('❌ Error durante las pruebas:', error.message);
  process.exit(1);
});