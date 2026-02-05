# Verifact - Sistema de Facturación Electrónica

## Descripción del Proyecto
**Verifact** es un BackOffice para facturación electrónica diseñado para empresas de República Dominicana, cumpliendo con las normativas de la DGII (Dirección General de Impuestos Internos).

## Características Implementadas

### 1. Autenticación
- **Login**: Página de inicio de sesión conectada al API real de Verifact
- **Logout**: Cierre de sesión con invalidación del token
- **Refresh Token** ✅ NUEVO: Renovación automática del JWT antes de expirar
- **Registro de Empresa**: Wizard de 3 pasos para registrar empresas
- Formato RNC validado: XXX-XXXXX-X (Registro Nacional del Contribuyente)

### 2. Dashboard Principal
- **Estadísticas de Facturación**: Total, emitidas, pendientes, vencidas
- **Gráficos de Análisis**: Facturas por mes e ingresos anuales (datos MOCK)
- **Acciones Rápidas** y **Tabla de Facturas Recientes**

### 3. Gestión de Certificados
- **Listar certificados** digitales (.p12)
- **Subir certificados** nuevos con contraseña
- Estados: Activo, Por Vencer, Vencido

### 4. Gestión de Facturas Electrónicas ✅ COMPLETADO
- **Listar facturas** con filtros de fecha y estado
- **Filtrar por estado**: Aceptado, Aceptado Condicional, En Proceso, Rechazado
- **Búsqueda** por NCF, cliente o RNC
- **Ver detalle** completo de cada factura
- **Subir factura XML** ✅ NUEVO - Modal para cargar archivos XML

### 5. Navegación y Diseño
- **Sidebar Colapsable** con secciones organizadas
- **Modo Oscuro/Claro** con toggle
- **Diseño Responsivo** adaptado a móvil

## Arquitectura Técnica

### Frontend
- React.js, Tailwind CSS, Shadcn/UI
- Recharts para gráficos
- Lucide React para iconos

### Backend (Proxy)
- FastAPI como proxy para evitar CORS/SSL
- Reenvía peticiones al API de Verifact

### API Endpoints Integrados
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Autenticación |
| `/api/auth/logout` | POST | Cierre de sesión |
| `/api/auth/refresh` | POST | ✅ Renovar token JWT |
| `/api/certificado/listado` | GET | Listar certificados |
| `/api/certificado/subir` | POST | Subir certificado .p12 |
| `/api/facturas/getfacturaselectronicas` | GET | Listar facturas |
| `/api/facturas/facturaselectronicas` | POST | Subir factura XML |
| `/api/auth/logout` | POST | Cierre de sesión |
| `/api/certificado/listado` | GET | Listar certificados |
| `/api/certificado/subir` | POST | Subir certificado .p12 |
| `/api/facturas/getfacturaselectronicas` | GET | Listar facturas |
| `/api/facturas/facturaselectronicas` | POST | ✅ Subir factura XML |

## Estado Actual
✅ Login/Logout conectado al Backend REAL de Verifact  
✅ Gestión de Certificados (listar/subir)  
✅ Gestión de Facturas (listar/filtrar/ver/subir)  
✅ Modo oscuro/claro  
✅ Paquete de despliegue IIS generado  
⚠️ Dashboard con datos MOCK (pendiente endpoints)  
⚠️ Registro de empresa (pendiente endpoint)

## Archivos de Despliegue
- `/app/frontend/verifact-iis-deploy.zip` - Paquete para IIS
- `/app/frontend/DEPLOY_IIS.md` - Instrucciones de despliegue

## Tareas Futuras
- Mejorar sidebar móvil (overlay)
- Conectar dashboard a datos reales
- Implementar registro de empresa
- Añadir reportes y exportación

## Credenciales de Prueba
- Email: admin@axcom.com
- Password: Admin123!
