# Configuración de Dominio Personalizado - gliter.com.ar

## Información del Proyecto
- **Proyecto Firebase**: gliter-argentina
- **URL Actual**: https://gliter-argentina.web.app
- **Dominio Objetivo**: gliter.com.ar

## Pasos para Configurar el Dominio Personalizado

### 1. Verificación de Propiedad del Dominio

#### En Firebase Console:
1. Ir a [Firebase Console](https://console.firebase.google.com/project/gliter-argentina/hosting)
2. Navegar a **Hosting** > **Dominios personalizados**
3. Hacer clic en **Agregar dominio personalizado**
4. Ingresar: `gliter.com.ar`

#### Verificación DNS:
Firebase proporcionará un registro TXT para verificar la propiedad del dominio:
```
Tipo: TXT
Nombre: @
Valor: [Valor proporcionado por Firebase]
```

### 2. Configuración DNS

Una vez verificado el dominio, Firebase proporcionará las direcciones IP para configurar:

#### Registros A (IPv4):
```
Tipo: A
Nombre: @
Valor: [IP proporcionada por Firebase]
TTL: 3600
```

#### Registros AAAA (IPv6):
```
Tipo: AAAA
Nombre: @
Valor: [IPv6 proporcionada por Firebase]
TTL: 3600
```

#### Registro CNAME para www:
```
Tipo: CNAME
Nombre: www
Valor: gliter.com.ar
TTL: 3600
```

### 3. Configuración en el Proveedor DNS

#### Si usas Cloudflare:
1. Ir al panel de Cloudflare
2. Seleccionar el dominio `gliter.com.ar`
3. Ir a **DNS** > **Records**
4. Agregar los registros proporcionados por Firebase
5. Asegurarse de que el proxy esté **desactivado** (nube gris) para los registros A/AAAA

#### Si usas otro proveedor:
1. Acceder al panel de control DNS
2. Agregar los registros A, AAAA y CNAME según las instrucciones de Firebase
3. Guardar los cambios

### 4. Verificación y Activación

#### Tiempo de Propagación:
- **Mínimo**: 1-4 horas
- **Máximo**: 24-48 horas

#### Verificación Manual:
```bash
# Verificar registros A
nslookup gliter.com.ar

# Verificar registros AAAA
nslookup -type=AAAA gliter.com.ar

# Verificar CNAME
nslookup www.gliter.com.ar
```

#### En Firebase Console:
1. Una vez propagados los DNS, Firebase mostrará el estado como "Conectado"
2. Firebase generará automáticamente un certificado SSL
3. El dominio estará disponible en 10-60 minutos adicionales

### 5. Configuración de Redirecciones (Opcional)

Para redirigir automáticamente de www a dominio principal:

#### En `firebase.json`:
```json
{
  "hosting": {
    "source": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "frameworksBackend": {
      "region": "us-central1"
    },
    "redirects": [
      {
        "source": "**",
        "destination": "https://gliter.com.ar/**",
        "type": 301
      }
    ]
  }
}
```

### 6. Verificación Final

Una vez configurado, verificar:

1. **HTTPS**: https://gliter.com.ar
2. **WWW**: https://www.gliter.com.ar
3. **Certificado SSL**: Verificar que el certificado sea válido
4. **Funcionalidad**: Probar todas las rutas principales

### 7. Monitoreo

#### URLs para monitorear:
- https://gliter.com.ar
- https://gliter.com.ar/chat/test
- https://gliter.com.ar/profile/test
- https://gliter.com.ar/api/health

#### Herramientas útiles:
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [DNS Checker](https://dnschecker.org/)
- [GTmetrix](https://gtmetrix.com/)

## Notas Importantes

1. **Certificado SSL**: Firebase maneja automáticamente la renovación
2. **CDN**: Firebase Hosting incluye CDN global automáticamente
3. **Caching**: Las reglas de cache se aplican automáticamente
4. **Rollback**: Si hay problemas, se puede revertir eliminando los registros DNS

## Contacto de Soporte

Si hay problemas durante la configuración:
- **Firebase Support**: https://firebase.google.com/support
- **Documentación**: https://firebase.google.com/docs/hosting/custom-domain