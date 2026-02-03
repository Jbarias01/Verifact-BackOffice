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
✅ Prototipo funcional con datos MOCK  
✅ Login y registro funcionales (con localStorage)  
✅ Dashboard completo con gráficos y tablas  
✅ Modo oscuro/claro  
✅ Navegación completa

## Próximos Pasos
- Integrar con endpoints del Backend real
- Implementar CRUD de facturas
- Implementar gestión de clientes
- Añadir reportes y exportación
- Integración con DGII

## Notas
- La autenticación actual usa localStorage (MOCK)
- Los datos del dashboard son simulados
- Diseñado para República Dominicana (RNC, pesos dominicanos)
