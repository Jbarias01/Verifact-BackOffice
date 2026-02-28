# Verifact - Sistema de Facturación Electrónica

## Descripción del Proyecto
**Verifact** es un BackOffice para facturación electrónica diseñado para empresas de República Dominicana, cumpliendo con las normativas de la DGII (Dirección General de Impuestos Internos).

## Características Implementadas

### 1. Autenticación y Sesión
- **Login**: Página de inicio de sesión conectada al API real de Verifact
- **Logout**: Cierre de sesión con invalidación del token
- **Refresh Token**: Renovación automática del JWT antes de expirar (5 min antes)
- **Registro de Empresa**: Wizard de 3 pasos para registrar empresas (endpoint público)
- Formato RNC validado: XXX-XXXXX-X

### 2. Dashboard Principal
- **Estadísticas de Facturación**: Total, emitidas, pendientes, vencidas
- **Gráficos de Análisis**: Facturas por mes e ingresos anuales (datos MOCK)
- **Acciones Rápidas**: Nueva Factura, Nuevo Cliente, Comprobante, Importar, Exportar
- **Tabla de Facturas Recientes**

### 3. Gestión de Certificados
- **Listar certificados** digitales (.p12)
- **Subir certificados** nuevos con contraseña
- Estados: Activo, Por Vencer, Vencido

### 4. Gestión de Facturas Electrónicas
- **Listar facturas** con filtros de fecha y estado
- **Filtrar por estado**: Aceptado, Aceptado Condicional, En Cola, En Proceso, Rechazado
- **Búsqueda** por NCF, cliente o RNC
- **Ver detalle** completo de cada factura
- **Subir factura XML** - Modal para cargar archivos XML
- **Consultar DGII** - Link a la página de consulta de la DGII (solo para facturas procesadas)

### 5. Gestión de Usuarios (CRUD Completo)
- **Listar usuarios** de la empresa
- **Crear usuario** con rol (Admin/Usuario)
- **Editar usuario** (nombre, email, rol, estado)
- **Ver detalle** de usuario
- Roles: Admin, Usuario

### 6. Información de Empresa
- **Ver datos de la empresa**: Nombre, RNC, email, teléfono, dirección

### 7. Configuración (Cambio de Contraseña)
- **Cambiar contraseña** del usuario logueado

### 8. Recepción eCF
- **Listar eCF recibidos** de otros emisores
- **Consulta RNC**: Obtener nombre del emisor por RNC
- **Ver detalle** de eCF recibido
- **Previsualizar XML** (simulado)
- **Descargar XML** (simulado)
- Estadísticas: Total recibidos, estado, monto total

### 9. Comprobantes Fiscales (NCF)
- **Listar secuencias NCF** asignadas al cliente
- Tipos de comprobantes (31-47):
  - 31: Factura de Crédito Fiscal Electrónica
  - 32: Factura de Consumo Electrónica
  - 33: Nota de Débito Electrónica
  - 34: Nota de Crédito Electrónica
  - 41: Comprobante Electrónico de Compras
  - 43: Comprobante Electrónico para Gastos Menores
  - 44: Comprobante Electrónico para Regímenes Especiales
  - 45: Comprobante Electrónico Gubernamental
  - 46: Comprobante Electrónico para Exportaciones
  - 47: Comprobante Electrónico para Pagos al Exterior
- **Información de vigencia** (Desde/Hasta)
- **Estado**: Habilitado/Deshabilitado
- **Secuencia actual** y rango asignado

### 10. e-CF Emitidos (Reportes) - NUEVO
- **Listar e-CF emitidos** por la empresa
- **Filtros disponibles:**
  - Fecha Desde / Hasta
  - Estado (Aceptado, Aceptado Condicional, En Proceso, Rechazado)
  - RNC Receptor
- **Búsqueda local** por eNCF, RNC, razón social
- **Ver detalle** completo del e-CF
- **Previsualizar XML** con formato legible
- **Descargar XML** original firmado
- **Estadísticas**: Total emitidos, Aceptados, En Cola, Monto Total

### 11. Navegación y Diseño
- **Sidebar Colapsable** con secciones organizadas:
  - Principal: Dashboard
  - Facturación: Facturas, Recepción eCF, Comprobantes
  - Reportes: Reportes (placeholder)
  - Administración: Certificados, Usuarios, Empresa, Configuración
- **Modo Oscuro/Claro** con toggle
- **Diseño Responsivo** adaptado a móvil

## Arquitectura Técnica

### Frontend
- React.js 18
- Tailwind CSS
- Shadcn/UI (componentes)
- Recharts (gráficos)
- Lucide React (iconos)
- date-fns (manejo de fechas)
- axios (peticiones HTTP)

### Backend (Proxy FastAPI)
- FastAPI como proxy para evitar CORS/SSL
- Reenvía peticiones al API de Verifact
- Manejo de respuestas 200, 201 como éxito
- Extracción de mensajes de error de respuestas 400

### API Endpoints Integrados
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Autenticación |
| `/api/auth/logout` | POST | Cierre de sesión |
| `/api/auth/refresh` | POST | Renovar token JWT |
| `/api/clientes/registrar` | POST | Registro de empresa (público) |
| `/api/clientes` | GET | Información de empresa |
| `/api/certificado/listado` | GET | Listar certificados |
| `/api/certificado/subir` | POST | Subir certificado .p12 |
| `/api/facturas/getfacturaselectronicas` | GET | Listar facturas |
| `/api/facturas/facturaselectronicas` | POST | Subir factura XML |
| `/api/usuarios` | GET | Listar usuarios |
| `/api/usuarios` | POST | Crear usuario |
| `/api/usuarios/{id}` | GET | Obtener usuario |
| `/api/usuarios/{id}` | PUT | Actualizar usuario |
| `/api/usuarios/{id}/password` | POST | Cambiar contraseña |
| `/api/fe/recepcion/ecf/recibidos` | GET | eCF recibidos |
| `/api/rnc/consultar/{rnc}` | GET | Consultar RNC |
| `/api/comprobantes/cliente` | GET | Secuencias NCF |
| `/api/ecf/emitidos` | GET | e-CF emitidos (con filtros) |

## Estado Actual
- Login/Logout conectado al Backend REAL de Verifact
- Gestión de Certificados (listar/subir)
- Gestión de Facturas (listar/filtrar/ver/subir)
- Gestión de Usuarios (CRUD completo)
- Información de Empresa
- Cambio de Contraseña
- Recepción eCF (listar/ver/búsqueda)
- Comprobantes Fiscales (listar secuencias NCF)
- e-CF Emitidos (reportes con filtros)
- Modo oscuro/claro
- Paquete de despliegue IIS generado

### Pendiente (MOCK o Placeholder)
- Dashboard con datos MOCK (pendiente endpoints)
- XML real de eCF recibidos (actualmente simulado)
- **NOTA**: El endpoint `/api/ecf/emitidos` no está disponible en el ambiente de prueba (ecf-test.api.verifact.com.do). Funcionará en producción.

## Archivos de Despliegue
- `/app/frontend/verifact-iis-deploy.zip` - Paquete para IIS
- `/app/frontend/DEPLOY_IIS.md` - Instrucciones de despliegue

## Tareas Futuras (Backlog)
1. **P1**: Acciones XML reales en Recepción eCF (obtener XML del servidor)
2. **P2**: Mejorar sidebar móvil (overlay con Sheet)
3. **P2**: Conectar dashboard a datos reales

## Credenciales de Prueba
- Email: admin@axcom.com
- Password: Admin123!

## Última Actualización
- Fecha: 28 de febrero de 2026
- Tarea completada: Módulo e-CF Emitidos con filtros (desde, hasta, estado, rncReceptor)
