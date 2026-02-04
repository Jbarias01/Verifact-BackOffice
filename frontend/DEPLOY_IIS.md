# Verifact - Guía de Despliegue en IIS

## Requisitos Previos

1. **Windows Server** con IIS instalado
2. **URL Rewrite Module** para IIS (descargar de: https://www.iis.net/downloads/microsoft/url-rewrite)
3. **Node.js** (solo para generar el build, no es necesario en el servidor)

## Paso 1: Configurar Variables de Entorno

Antes de hacer el build, configura la URL de tu API de Verifact.

### Opción A: Archivo .env.production
Crea o edita el archivo `.env.production` en la carpeta `frontend`:

```env
REACT_APP_VERIFACT_API_URL=https://ecf-test.api.verifact.com.do
```

### Opción B: Variables del sistema
```cmd
set REACT_APP_VERIFACT_API_URL=https://ecf-test.api.verifact.com.do
```

## Paso 2: Generar el Build

```bash
cd frontend
npm install
npm run build
```

Esto generará una carpeta `build` con todos los archivos estáticos.

## Paso 3: Configurar CORS en tu Backend .NET

En tu API de Verifact (backend .NET), asegúrate de tener CORS habilitado.

### En Program.cs o Startup.cs:

```csharp
// Agregar en ConfigureServices
services.AddCors(options =>
{
    options.AddPolicy("AllowVerifactUI", builder =>
    {
        builder
            .WithOrigins(
                "https://tu-dominio-iis.com",      // Producción
                "http://localhost:3000"            // Desarrollo
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Agregar en Configure (antes de UseRouting)
app.UseCors("AllowVerifactUI");
```

## Paso 4: Desplegar en IIS

1. **Crear un nuevo sitio** en IIS Manager
2. **Copiar contenido** de la carpeta `build` al directorio del sitio
3. **Verificar web.config** - Ya está incluido en el build con las reglas de rewrite

### Estructura de archivos en IIS:
```
C:\inetpub\wwwroot\verifact\
├── index.html
├── web.config          (configuración de IIS incluida)
├── static/
│   ├── css/
│   ├── js/
│   └── media/
├── favicon.ico
└── manifest.json
```

## Paso 5: Configurar el Sitio en IIS

1. Abrir **IIS Manager**
2. Click derecho en **Sites** → **Add Website**
3. Configurar:
   - **Site name**: Verifact
   - **Physical path**: `C:\inetpub\wwwroot\verifact`
   - **Binding**: Configurar HTTP/HTTPS según necesites
4. Click **OK**

## Paso 6: Instalar URL Rewrite Module

Si no tienes el módulo instalado:

1. Descargar desde: https://www.iis.net/downloads/microsoft/url-rewrite
2. Ejecutar el instalador
3. Reiniciar IIS: `iisreset`

## Paso 7: Configurar HTTPS (Recomendado)

1. Obtener certificado SSL (Let's Encrypt, DigiCert, etc.)
2. En IIS Manager → Sitio → Bindings → Add
3. Tipo: https, Puerto: 443, Certificado SSL: seleccionar tu certificado

## Verificación

1. Navegar a: `https://tu-dominio-iis.com`
2. Deberías ver la página de login de Verifact
3. Probar login con credenciales reales
4. Verificar que las llamadas al API funcionen (F12 → Network)

## Solución de Problemas

### Error 404 en rutas
- Verificar que URL Rewrite Module esté instalado
- Verificar que web.config esté en la raíz del sitio

### Error de CORS
- Verificar configuración CORS en el backend .NET
- Verificar que el dominio del frontend esté en la lista de orígenes permitidos

### API no responde
- Verificar la variable `REACT_APP_VERIFACT_API_URL` en el build
- Verificar conectividad entre IIS y el servidor de la API

## Archivos de Configuración

### .env.production
```env
REACT_APP_VERIFACT_API_URL=https://ecf-test.api.verifact.com.do
```

### web.config (ya incluido en public/)
- Reglas de rewrite para React Router
- Tipos MIME para archivos estáticos
- Headers de seguridad
- Configuración de caché

## Comandos Útiles

```bash
# Generar build de producción
npm run build

# Verificar build localmente
npx serve -s build

# Limpiar caché de npm
npm cache clean --force
```

## Contacto y Soporte

Para soporte técnico, contactar al equipo de desarrollo de Verifact.
