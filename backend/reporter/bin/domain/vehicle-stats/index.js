"use strict";

const { Subject, of } = require('rxjs');
const { bufferTime, filter, mergeMap, map } = require('rxjs/operators');
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;
const { brokerFactory } = require('@nebulae/backend-node-tools').broker;

const VehicleStatsDA = require('./data-access/VehicleStatsDA');

const events$ = new Subject();          // <-- Todos los VehicleGenerated entran aquí
const broker = brokerFactory();

// Tópico para empujar al UI Gateway (WebSocket hacia frontend)
const MV_TOPIC = "reporter-ui-gateway-materialized-view-updates";

// Helpers para clasificaciones
const decadeOf = (year) => `${Math.floor(year / 10) * 10}s`;
const speedClass = (topSpeed) => topSpeed < 140 ? 'Lento' : (topSpeed > 240 ? 'Rapido' : 'Normal');

// ---- MQTT listener directo ----
function startMqttListener(mqttUrl = process.env.MQTT_URL, topic = process.env.MQTT_TOPIC_GENERATED || 'fleet/vehicles/generated') {
  if (!mqttUrl) {
    ConsoleLogger.w('[reporter] MQTT_URL no definido; saltando listener MQTT');
    return of(true);
  }
  
  ConsoleLogger.i(`[reporter] Subscribing MQTT ${mqttUrl} -> ${topic}`);
  
  // Suscribirse al tópico MQTT y emitir eventos al Subject
  broker.getMessageListener$(topic).subscribe(
    msg => {
      try {
        const event = JSON.parse(msg);
        ConsoleLogger.i(`[reporter] Received MQTT event: ${event.aid}`);
        events$.next(event);
      } catch (err) {
        ConsoleLogger.e('[reporter] Error parsing MQTT message:', err);
      }
    },
    err => ConsoleLogger.e('[reporter] MQTT subscription error:', err)
  );

  return of(true);
}

// ---- Opción B: puente Event Store (si tus eventos vienen del ES) ----
// En ese caso, tu VehicleStatsES.js debe hacer: events$.next(normalizedEvent);

// ====== Procesador por lotes ======
function processBatch$(batch) {
  // 1) idempotencia por aid
  const aids = [...new Set(batch.map(e => e.aid).filter(Boolean))];

  return VehicleStatsDA.findExistingAids$(aids).pipe(
    mergeMap(already => {
      const seen = new Set(already);
      const fresh = batch.filter(e => e.aid && !seen.has(e.aid));
      if (!fresh.length) return of(null); // nada que hacer

      // 2) acumuladores
      const inc = {
        totalVehicles: fresh.length,
        // estructuras anidadas se construyen dinámicamente
      };
      const vehiclesByType = {};
      const vehiclesByDecade = {};
      const vehiclesBySpeedClass = {};
      let minHp = Number.POSITIVE_INFINITY;
      let maxHp = Number.NEGATIVE_INFINITY;
      let hpSum = 0;
      let hpCount = 0;

      fresh.forEach(e => {
        const d = e.data || {};
        const type = d.type || 'Unknown';
        const year = +d.year || 0;
        const top = +d.topSpeed || 0;
        const hp = +d.hp || 0;

        vehiclesByType[type] = (vehiclesByType[type] || 0) + 1;
        const dec = decadeOf(year);
        vehiclesByDecade[dec] = (vehiclesByDecade[dec] || 0) + 1;
        const sc = speedClass(top);
        vehiclesBySpeedClass[sc] = (vehiclesBySpeedClass[sc] || 0) + 1;

        if (hp > 0) {
          hpSum += hp;
          hpCount += 1;
          if (hp < minHp) minHp = hp;
          if (hp > maxHp) maxHp = hp;
        }
      });

      // empaquetar $inc
      Object.entries(vehiclesByType).forEach(([k, v]) => inc[`vehiclesByType.${k}`] = v);
      Object.entries(vehiclesByDecade).forEach(([k, v]) => inc[`vehiclesByDecade.${k}`] = v);
      Object.entries(vehiclesBySpeedClass).forEach(([k, v]) => inc[`vehiclesBySpeedClass.${k}`] = v);
      if (hpCount > 0) {
        inc['hpStats.sum'] = hpSum;
        inc['hpStats.count'] = hpCount;
      }

      const min = (hpCount > 0) ? { 'hpStats.min': minHp } : null;
      const max = (hpCount > 0) ? { 'hpStats.max': maxHp } : null;

      // 3) update único + insert processed aids + leer doc y enviar al UI
      return VehicleStatsDA.updateStatsBatch$({ inc, min, max }).pipe(
        mergeMap(() => VehicleStatsDA.insertProcessedAids$(fresh.map(e => e.aid))),
        mergeMap(() => VehicleStatsDA.getStats$()),
        map(doc => {
          const sum = doc.hpStats?.sum || 0;
          const count = doc.hpStats?.count || 0;
          const avg = count ? (sum / count) : 0;
          return { ...doc, hpStats: { ...doc.hpStats, avg } };
        }),
        mergeMap(doc =>
          // push por WebSocket (UI Gateway escucha y publica GraphQL subscription)
          broker.send$(MV_TOPIC, 'ReporterFleetStatisticsUpdated', doc).pipe(map(() => doc))
        )
      );
    })
  );
}

const start$ =
  VehicleStatsDA.start$().pipe(
    mergeMap(() => startMqttListener()), // quítalo si usas el puente ES y no MQTT
    mergeMap(() => {
      ConsoleLogger.i('[reporter] VehicleStats domain started (batch=1s)');
      return events$
        .pipe(
          bufferTime(1000),
          filter(batch => batch.length > 0),
          mergeMap(batch => processBatch$(batch))
        );
    })
  );

module.exports = {
  start$,
  events$,      // IMPORTANTE: exportamos el Subject para el puente ES
};
