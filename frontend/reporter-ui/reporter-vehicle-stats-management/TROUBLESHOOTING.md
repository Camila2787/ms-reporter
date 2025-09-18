# Troubleshooting - Error GraphQL

## 🔍 **Problema Actual:**
```
Cannot query field "getFleetStatistics" on type "Query"
```

## 🚀 **Soluciones Implementadas:**

### 1. **Archivo GraphQL Nuevo**
- **Archivo**: `gql/FleetStatisticsNew.js`
- **Query**: `GetFleetStatisticsNew`
- **Cambios**: Nombre único para evitar cache del navegador

### 2. **Componente Debug**
- **Archivo**: `vehicle-statss/VehicleStatssDebug.js`
- **Propósito**: Versión simplificada para debugging
- **Características**: 
  - Query inline (no importada)
  - Manejo de errores mejorado
  - Logs detallados en consola

## 🧪 **Pasos para Probar:**

### Opción 1: Usar Componente Debug
```bash
# Renombrar archivos
mv VehicleStatss.js VehicleStatssOriginal.js
mv VehicleStatssDebug.js VehicleStatss.js
```

### Opción 2: Limpiar Cache del Navegador
1. Abrir DevTools (F12)
2. Ir a Application/Storage
3. Limpiar Local Storage y Session Storage
4. Hard refresh (Ctrl+Shift+R)

### Opción 3: Verificar Query en DevTools
1. Abrir DevTools → Network
2. Filtrar por "GraphQL" o "graphql"
3. Verificar que la query enviada sea `GetFleetStatisticsNew`

## 🔧 **Verificaciones:**

### 1. **Schema GraphQL Disponible**
Verificar que el schema incluya:
```graphql
type Query {
  GetFleetStatistics: FleetStatistics
}
```

### 2. **Resolver Configurado**
Verificar que el resolver tenga:
```javascript
GetFleetStatistics(root, args, context) {
    return sendToBackEndHandler$(root, args, context, READ_ROLES, 'query', 'VehicleStats', 'GetFleetStatistics').toPromise();
}
```

### 3. **Backend Funcionando**
Verificar que el backend esté corriendo y respondiendo.

## 📝 **Logs a Revisar:**

### Frontend (Consola del Navegador):
```javascript
// Debería aparecer:
"Debug query data received: {GetFleetStatistics: {...}}"
"Fleet statistics updated: {...}"
```

### Backend (Terminal):
```javascript
// Debería aparecer:
"[reporter] VehicleStats domain started (batch=1s)"
"[reporter] Subscribing MQTT mqtt://localhost:1883 -> fleet/vehicles/generated"
```

## 🎯 **Si Sigue Fallando:**

### 1. **Verificar Schema Real**
Usar GraphQL Playground o Apollo Studio para ver el schema real disponible.

### 2. **Probar Query Directa**
```graphql
query TestQuery {
  __schema {
    queryType {
      fields {
        name
      }
    }
  }
}
```

### 3. **Verificar Permisos**
Asegurarse de que el usuario tenga los roles necesarios:
- `VEHICLE_STATS_READ`

## 🔄 **Rollback si es Necesario:**

Si nada funciona, volver a la versión original:
```bash
mv VehicleStatss.js VehicleStatssDebug.js
mv VehicleStatssOriginal.js VehicleStatss.js
```

Y usar la query original del archivo `VehicleStats.js`:
```javascript
import { GET_FLEET_STATISTICS } from '../gql/VehicleStats';
```
