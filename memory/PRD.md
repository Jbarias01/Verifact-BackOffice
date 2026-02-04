# Verifact - Sistema de Facturación Electrónica

## Descripción del Proyecto
**Verifact** es un BackOffice para facturación electrónica diseñado para empresas de República Dominicana, cumpliendo con las normativas de la DGII (Dirección General de Impuestos Internos).

## Características Implementadas

### 1. Autenticación
- **Login**: Página de inicio de sesión con validación de campos
- **Registro de Empresa**: Wizard de 3 pasos para registrar empresas:
  - Paso 1: Datos de la empresa (nombre, RNC, correo, teléfono, dirección)
  - Paso 2: Datos del usuario administrador (nombre, correo, contraseña)
  - Paso 3: Confirmación de datos antes de crear la cuenta
- Formato RNC validado: XXX-XXXXX-X (Registro Nacional del Contribuyente)

### 2. Dashboard Principal
- **Estadísticas de Facturación**:
  - Total de facturas
  - Facturas emitidas
  - Pendientes de pago
  - Facturas vencidas
- **Acciones Rápidas**: Nueva factura, nuevo cliente, comprobante, importar, exportar
- **Gráficos de Análisis**: Facturas por mes y ingresos anuales
- **Tabla de Facturas Recientes** con estados (emitida, pagada, pendiente, vencida)
- **Principales Clientes** con montos facturados
- **Resumen del Mes** con progreso hacia objetivo

### 3. Navegación y Diseño
- **Sidebar Colapsable** con secciones:
  - Principal: Dashboard, Facturas, Clientes
  - Facturación: Emitidas, Pendientes, Comprobantes
  - Administración: Reportes, Empresa, Configuración
- **Header** con búsqueda, notificaciones y perfil de usuario
- **Modo Oscuro/Claro** con toggle
- **Diseño Responsivo** adaptado a móvil

## Paleta de Colores
- **Primario**: Azul corporativo (#1565C0) - Confianza
- **Acento**: Verde (#2E7D32) - Éxito/Seguridad
- **Warning**: Naranja - Alertas
- **Destructive**: Rojo - Errores/Vencidos

## Tecnologías
- **Frontend**: React.js, Tailwind CSS, Shadcn/UI
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Fuentes**: Inter, Plus Jakarta Sans

## Estado Actual
✅ Login conectado al Backend REAL de Verifact  
✅ Registro de empresa (MOCK - pendiente endpoint)  
✅ Dashboard completo con gráficos y tablas (datos MOCK)  
✅ Modo oscuro/claro  
✅ Navegación completa
✅ JWT Token guardado en localStorage
✅ Datos de usuario y empresa del backend real

## API Backend Integrado
**URL Base**: `https://ecf-test.api.verifact.com.do`

### Endpoints Implementados:
- ✅ `POST /api/auth/login` - Autenticación de usuarios

### Respuesta del Login:
```json
{
  "success": true,
  "token": "JWT_TOKEN",
  "refreshToken": "REFRESH_TOKEN",
  "expira": "2026-02-04T01:33:26Z",
  "usuario": {
    "id": "user-uuid",
    "clienteId": "cliente-uuid",
    "nombre": "Nombre Usuario",
    "email": "email@empresa.com",
    "rol": "Admin",
    "clienteNombre": "EMPRESA SRL",
    "clienteRNC": "123456789"
  }
}
```

## Próximos Pasos
- Implementar endpoint de registro de empresa
- Implementar CRUD de facturas
- Implementar gestión de clientes
- Añadir reportes y exportación
- Integrar más endpoints del backend
- Implementar refresh token

## Notas
- Login usa backend REAL de Verifact
- Los datos del dashboard aún son MOCK (pendiente endpoints)
- Token JWT se guarda en localStorage con expiración
- Diseñado para República Dominicana (RNC, pesos dominicanos)
