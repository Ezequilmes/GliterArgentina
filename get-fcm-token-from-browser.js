#!/usr/bin/env node

/**
 * Script para obtener un token FCM real desde el navegador
 * Este script usa Puppeteer para automatizar la obtención del token
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function getFCMToken() {
  console.log('🚀 Iniciando navegador para obtener token FCM...');
  
  const browser = await puppeteer.launch({
    headless: false, // Mostrar navegador para ver el proceso
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Habilitar notificaciones
    const context = browser.defaultBrowserContext();
    await context.overridePermissions('http://localhost:3001', ['notifications']);
    
    console.log('📱 Navegando a la página de prueba FCM...');
    await page.goto('http://localhost:3001/test-fcm', { waitUntil: 'networkidle2' });
    
    // Esperar a que la página cargue completamente
    await page.waitForTimeout(3000);
    
    console.log('🔍 Buscando el token FCM...');
    
    // Esperar y hacer clic en el botón de solicitar permisos si existe
    try {
      const requestPermissionButton = await page.$('button:has-text("Solicitar Permisos")');
      if (requestPermissionButton) {
        console.log('📋 Solicitando permisos de notificación...');
        await requestPermissionButton.click();
        await page.waitForTimeout(2000);
      }
    } catch (e) {
      console.log('ℹ️ No se encontró botón de solicitar permisos');
    }
    
    // Esperar a que aparezca el token
    await page.waitForFunction(() => {
      const tokenElement = document.querySelector('#fcm-token');
      return tokenElement && tokenElement.textContent && tokenElement.textContent !== 'No disponible' && tokenElement.textContent.length > 50;
    }, { timeout: 15000 }).catch(() => {
      console.log('⚠️ Timeout esperando el token, continuando...');
    });
    
    // Obtener el token FCM
    const fcmToken = await page.evaluate(() => {
      const tokenElement = document.querySelector('#fcm-token');
      return tokenElement ? tokenElement.textContent : null;
    });
    
    if (fcmToken && fcmToken !== 'No disponible' && fcmToken.length > 50) {
      console.log('✅ Token FCM encontrado:', fcmToken);
      
      // Guardar token en archivo
      const tokenData = {
        token: fcmToken,
        timestamp: new Date().toISOString(),
        url: 'http://localhost:3001/test-fcm'
      };
      
      fs.writeFileSync('real-fcm-token.json', JSON.stringify(tokenData, null, 2));
      console.log('💾 Token guardado en real-fcm-token.json');
      
      // Probar enviar una notificación
      console.log('\n🧪 Probando enviar notificación...');
      await testNotification(fcmToken);
      
    } else {
      console.log('❌ No se pudo obtener el token FCM');
      console.log('📸 Tomando captura de pantalla...');
      await page.screenshot({ path: 'fcm-error-screenshot.png', fullPage: true });
      console.log('💾 Captura guardada como fcm-error-screenshot.png');
    }
    
    // Mostrar estado de permisos
    const permissionStatus = await page.evaluate(() => {
      return Notification.permission;
    });
    console.log('📋 Estado de permisos:', permissionStatus);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n👋 Cerrando navegador...');
    await browser.close();
  }
}

async function testNotification(token) {
  // Aquí puedes agregar el código para probar el envío de notificaciones
  // usando el endpoint de tu API o directamente con Firebase Admin
  console.log('📝 Token disponible para pruebas:', token);
  console.log('💡 Puedes usar este token con el endpoint /api/test/send-notification');
}

// Ejecutar el script
getFCMToken().catch(console.error);