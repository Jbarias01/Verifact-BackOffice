# Verifact - Guía de Despliegue en IIS

## Resumen del Proyecto

**Verifact** es un BackOffice para facturación electrónica para República Dominicana.

### Funcionalidades Implementadas:
- ✅ Login con autenticación JWT
- ✅ Registro de empresa (3 pasos)
- ✅ Dashboard con estadísticas
- ✅ Módulo de Certificados Digitales (.p12)
- ✅ Modo oscuro/claro
- ✅ Diseño responsive

---

## Requisitos Previos

1. **Windows Server** con IIS instalado
2. **URL Rewrite Module** para IIS 
   - Descargar: https://www.iis.net/downloads/microsoft/url-rewrite
3. **Node.js 18+** (solo para generar el build)

---

## Opción 1: Despliegue con Proxy (Recomendado si no controlas CORS)

Si no puedes modificar el backend .NET para habilitar CORS, puedes usar IIS como reverse proxy.

### Configuración del Reverse Proxy en IIS:

1. Instalar **Application Request Routing (ARR)** en IIS
2. Habilitar proxy en ARR
3. Agregar regla de rewrite para `/api/*`:

```xml
<rule name="API Proxy" stopProcessing="true">
    <match url="^api/(.*)" />
    <action type="Rewrite" url="https://ecf-test.api.verifact.com.do/api/{R:1}" />
</rule>
```

---

## Opción 2: Despliegue Directo (Requiere CORS en Backend)

### Paso 1: Habilitar CORS en tu Backend .NET

Agrega en tu `Program.cs` o `Startup.cs`:

```csharp
// En ConfigureServices o builder.Services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowVerifactUI", policy =>
    {
        policy
            .WithOrigins(
                "https://tu-dominio.com",        // Producción
                "http://localhost:3000"          // Desarrollo
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// En Configure o app (antes de UseRouting)
app.UseCors("AllowVerifactUI");
```

### Paso 2: Configurar Variables de Entorno

Editar `.env.production` antes del build:

```env
REACT_APP_VERIFACT_API_URL=https://ecf-test.api.verifact.com.do
```

### Paso 3: Generar el Build

```bash
cd frontend
npm install
npm run build
```

---

## Desplegar en IIS

### 1. Crear Sitio en IIS

1. Abrir **IIS Manager**
2. Click derecho en **Sites** → **Add Website**
3. Configurar:
   - **Site name**: Verifact
   - **Physical path**: `C:\inetpub\wwwroot\verifact`
   - **Binding**: tu dominio/puerto

### 2. Copiar Archivos

Copiar el contenido de la carpeta `build/` a `C:\inetpub\wwwroot\verifact\`:

```
C:\inetpub\wwwroot\verifact\
├── index.html
├── web.config          ← Incluido automáticamente
├── asset-manifest.json
└── static/
    ├── css/
    │   └── main.*.css
    └── js/
        └── main.*.js
```

### 3. Verificar URL Rewrite

El archivo `web.config` ya incluye las reglas necesarias para React Router.

Si no funciona, verificar que **URL Rewrite Module** esté instalado:
```cmd
iisreset
```

---

## Configurar HTTPS (Recomendado)

1. Obtener certificado SSL
2. En IIS Manager → Sitio → Bindings → Add
3. Tipo: https, Puerto: 443, Seleccionar certificado

---

## Verificación

1. Navegar a `https://tu-dominio.com`
2. Deberías ver la página de login
3. Probar login con credenciales reales
4. Navegar a **Certificados** desde el sidebar

---

## Solución de Problemas

### Página en blanco o error 404
- Verificar que `web.config` esté en la raíz
- Verificar que URL Rewrite Module esté instalado
- Ejecutar `iisreset`

### Error de CORS
- Verificar configuración CORS en backend .NET
- Verificar que el dominio esté en la lista de orígenes permitidos

### Login no funciona
- Verificar variable `REACT_APP_VERIFACT_API_URL`
- Verificar conectividad con el servidor API
- Revisar consola del navegador (F12)

---

## Estructura del Proyecto

```
/frontend
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/            # Componentes Shadcn
│   │   ├── layout/        # Sidebar, Header, Layout
│   │   └── dashboard/     # Componentes del dashboard
│   ├── pages/             # Páginas principales
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   └── Certificados.jsx
│   ├── context/           # Contextos de React
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   └── services/          # Servicios de API
│       └── api.js
├── public/
│   └── web.config         # Configuración IIS
├── .env.production        # Variables de producción
└── build/                 # Archivos compilados
```

---

## API Endpoints Utilizados

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Autenticación |
| `/api/certificado/listado` | GET | Listar certificados |
| `/api/certificado/subir` | POST | Subir certificado .p12 |

---

## Soporte

Para soporte técnico, contactar al equipo de desarrollo de Verifact.
