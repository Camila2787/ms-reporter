#!/usr/bin/env node

/**
 * Script para probar la query GraphQL GetFleetStatistics
 * Este script simula una llamada GraphQL directa al backend
 */

const { brokerFactory } = require('@nebulae/backend-node-tools').broker;
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;

// Configuración
const CONTEXT_NAME = "reporter";
const READ_ROLES = ["VEHICLE_STATS_READ"];

// Mock auth token para testing
const mockAuthToken = {
    realm_access: {
        roles: ["VEHICLE_STATS_READ", "VEHICLE_STATS_WRITE"]
    },
    preferred_username: "test-user"
};

const mockContext = {
    authToken: mockAuthToken,
    encodedToken: "mock-jwt-token"
};

async function testGraphQLQuery() {
    try {
        ConsoleLogger.i("🧪 Iniciando prueba de query GraphQL...");
        
        const broker = brokerFactory();
        const secondaryBroker = broker.secondaryBroker || broker;
        
        ConsoleLogger.i("📡 Enviando query GetFleetStatistics al backend...");
        
        const response = await secondaryBroker.forwardAndGetReply$(
            'VehicleStats',
            'reporter-uigateway.graphql.query.GetFleetStatistics',
            { 
                root: {}, 
                args: {}, 
                jwt: mockContext.encodedToken 
            },
            5000 // 5 second timeout
        ).toPromise();
        
        ConsoleLogger.i("✅ Respuesta recibida del backend:");
        ConsoleLogger.i(JSON.stringify(response, null, 2));
        
        if (response.result && response.result.code === 200) {
            ConsoleLogger.i("🎉 Query GraphQL funcionando correctamente!");
            ConsoleLogger.i("📊 Datos de estadísticas:");
            ConsoleLogger.i(`   - Total vehículos: ${response.data.totalVehicles || 0}`);
            ConsoleLogger.i(`   - Última actualización: ${response.data.lastUpdated || 'N/A'}`);
        } else {
            ConsoleLogger.e("❌ Error en la respuesta del backend:");
            ConsoleLogger.e(response.result?.error || "Error desconocido");
        }
        
    } catch (error) {
        ConsoleLogger.e("❌ Error durante la prueba:");
        ConsoleLogger.e(error.message);
        ConsoleLogger.e(error.stack);
    }
}

// Ejecutar la prueba
if (require.main === module) {
    testGraphQLQuery()
        .then(() => {
            ConsoleLogger.i("🏁 Prueba completada");
            process.exit(0);
        })
        .catch((error) => {
            ConsoleLogger.e("💥 Prueba falló:", error);
            process.exit(1);
        });
}

module.exports = { testGraphQLQuery };
