#!/usr/bin/env node

/**
 * Script de prueba para enviar eventos de vehículos al tópico MQTT
 * Este script simula el comportamiento del ms-generator
 */

const mqtt = require('mqtt');
const crypto = require('crypto');

// Configuración
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const TOPIC = process.env.MQTT_TOPIC_GENERATED || 'fleet/vehicles/generated';

// Tipos de vehículos y fuentes de energía
const vehicleTypes = ['SUV', 'PickUp', 'Sedan'];
const powerSources = ['Electric', 'Gas', 'Hybrid'];

// Función para generar un vehículo aleatorio
function generateRandomVehicle() {
  const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
  const powerSource = powerSources[Math.floor(Math.random() * powerSources.length)];
  const hp = Math.floor(Math.random() * 225) + 75; // 75-300 HP
  const year = Math.floor(Math.random() * 45) + 1980; // 1980-2025
  const topSpeed = Math.floor(Math.random() * 160) + 120; // 120-280 km/h

  const vehicleData = {
    type,
    powerSource,
    hp,
    year,
    topSpeed
  };

  // Generar hash para el aid (idempotencia)
  const aid = crypto.createHash('sha256')
    .update(JSON.stringify(vehicleData))
    .digest('hex');

  return {
    at: "Vehicle",
    et: "Generated",
    aid: aid,
    timestamp: new Date().toISOString(),
    data: vehicleData
  };
}

// Conectar a MQTT
console.log(`Conectando a MQTT: ${MQTT_URL}`);
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log('Conectado a MQTT broker');
  console.log(`Enviando eventos al tópico: ${TOPIC}`);
  
  // Enviar un evento cada 50ms (como el ms-generator)
  const interval = setInterval(() => {
    const vehicle = generateRandomVehicle();
    const message = JSON.stringify(vehicle);
    
    client.publish(TOPIC, message, (err) => {
      if (err) {
        console.error('Error enviando mensaje:', err);
      } else {
        console.log(`Evento enviado: ${vehicle.data.type} ${vehicle.data.year} (${vehicle.data.hp}HP)`);
      }
    });
  }, 50);

  // Detener después de 30 segundos
  setTimeout(() => {
    clearInterval(interval);
    client.end();
    console.log('Prueba completada');
    process.exit(0);
  }, 30000);
});

client.on('error', (err) => {
  console.error('Error de conexión MQTT:', err);
  process.exit(1);
});

client.on('offline', () => {
  console.log('MQTT cliente desconectado');
});
