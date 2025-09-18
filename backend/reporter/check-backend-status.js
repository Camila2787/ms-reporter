#!/usr/bin/env node

/**
 * Script para verificar el estado del backend del ms-reporter
 */

const { brokerFactory } = require('@nebulae/backend-node-tools').broker;
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;

async function checkBackendStatus() {
    try {
        ConsoleLogger.i("🔍 Verificando estado del backend ms-reporter...");
        
        const broker = brokerFactory();
        const secondaryBroker = broker.secondaryBroker || broker;
        
        // Verificar que el broker esté funcionando
        ConsoleLogger.i("📡 Verificando broker...");
        if (secondaryBroker) {
            ConsoleLogger.i("✅ Broker funcionando");
        } else {
            ConsoleLogger.e("❌ Broker no disponible");
            return false;
        }
        
        // Verificar que el dominio VehicleStats esté registrado
        ConsoleLogger.i("🏗️ Verificando dominio VehicleStats...");
        
        try {
            const response = await secondaryBroker.forwardAndGetReply$(
                'VehicleStats',
                'reporter-uigateway.graphql.query.GetFleetStatistics',
                { 
                    root: {}, 
                    args: {}, 
                    jwt: "test-token" 
                },
                2000 // 2 second timeout
            ).toPromise();
            
            ConsoleLogger.i("✅ Dominio VehicleStats respondiendo");
            ConsoleLogger.i(`📊 Respuesta: ${JSON.stringify(response, null, 2)}`);
            
        } catch (error) {
            if (error.message.includes('timeout')) {
                ConsoleLogger.w("⚠️ Timeout - El dominio puede estar iniciando");
            } else {
                ConsoleLogger.e("❌ Error en dominio VehicleStats:");
                ConsoleLogger.e(error.message);
            }
        }
        
        // Verificar conexión a MongoDB
        ConsoleLogger.i("🗄️ Verificando conexión a MongoDB...");
        try {
            const mongoDB = require('./bin/tools/mongo-db/MongoDB').singleton();
            if (mongoDB && mongoDB.db) {
                ConsoleLogger.i("✅ MongoDB conectado");
                
                // Verificar colecciones
                const collections = await mongoDB.db.listCollections().toArray();
                ConsoleLogger.i(`📋 Colecciones disponibles: ${collections.map(c => c.name).join(', ')}`);
                
                // Verificar datos en fleet_statistics
                const fleetStats = await mongoDB.db.collection('fleet_statistics').findOne({ _id: 'real_time_fleet_stats' });
                if (fleetStats) {
                    ConsoleLogger.i("📊 Estadísticas de flota encontradas:");
                    ConsoleLogger.i(`   - Total vehículos: ${fleetStats.totalVehicles || 0}`);
                    ConsoleLogger.i(`   - Última actualización: ${fleetStats.lastUpdated || 'N/A'}`);
                } else {
                    ConsoleLogger.w("⚠️ No hay estadísticas de flota aún");
                }
                
            } else {
                ConsoleLogger.e("❌ MongoDB no conectado");
            }
        } catch (error) {
            ConsoleLogger.e("❌ Error verificando MongoDB:");
            ConsoleLogger.e(error.message);
        }
        
        return true;
        
    } catch (error) {
        ConsoleLogger.e("❌ Error durante la verificación:");
        ConsoleLogger.e(error.message);
        ConsoleLogger.e(error.stack);
        return false;
    }
}

// Ejecutar la verificación
if (require.main === module) {
    checkBackendStatus()
        .then((success) => {
            if (success) {
                ConsoleLogger.i("🏁 Verificación completada");
            } else {
                ConsoleLogger.e("💥 Verificación falló");
            }
            process.exit(success ? 0 : 1);
        })
        .catch((error) => {
            ConsoleLogger.e("💥 Error durante la verificación:", error);
            process.exit(1);
        });
}

module.exports = { checkBackendStatus };
