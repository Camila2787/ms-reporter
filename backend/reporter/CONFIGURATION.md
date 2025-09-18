# Configuración del ms-reporter

## Variables de Entorno Requeridas

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=reporter_db

# MQTT Configuration
MQTT_URL=mqtt://localhost:1883
MQTT_TOPIC_GENERATED=fleet/vehicles/generated

# Microservice Configuration
MICROBACKEND_KEY=your-microbackend-key-here
PORT=3000

# Keycloak Configuration (if needed)
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret
```

## Estructura de la Base de Datos

El microservicio creará automáticamente las siguientes colecciones:

1. **fleet_statistics**: Vista materializada con las estadísticas agregadas
2. **processed_vehicles**: Colección para control de idempotencia (contiene los `aid` de vehículos ya procesados)

## Tópico MQTT

El microservicio se suscribe al tópico: `fleet/vehicles/generated`

### Formato de Evento Esperado

```json
{
  "at": "Vehicle",
  "et": "Generated", 
  "aid": "hash_de_las_propiedades_del_vehiculo_en_data",
  "timestamp": "2025-09-18T10:00:00.050Z",
  "data": {
    "type": "SUV",
    "powerSource": "Electric",
    "hp": 275,
    "year": 2024,
    "topSpeed": 210
  }
}
```

## API GraphQL

### Query Disponible

```graphql
query GetFleetStatistics {
  getFleetStatistics {
    _id
    totalVehicles
    vehiclesByType
    vehiclesByDecade
    vehiclesBySpeedClass
    hpStats { min max sum count avg }
    lastUpdated
  }
}
```

### Subscription Disponible

```graphql
subscription OnFleetStats {
  ReporterFleetStatisticsUpdated {
    _id
    totalVehicles
    vehiclesByType
    vehiclesByDecade
    vehiclesBySpeedClass
    hpStats { min max sum count avg }
    lastUpdated
  }
}
```

## Procesamiento por Lotes

- Los eventos se procesan en lotes cada 1 segundo
- Se implementa idempotencia usando el campo `aid` como clave única
- Las estadísticas se actualizan usando operadores MongoDB `$inc`, `$min`, `$max`
- Las actualizaciones se envían al frontend via WebSocket/GraphQL Subscription
