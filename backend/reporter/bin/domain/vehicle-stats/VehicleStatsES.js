'use strict'

const { iif, Subject, interval } = require("rxjs");
const { tap, bufferTime, filter, mergeMap, map, catchError } = require('rxjs/operators');
const { ConsoleLogger } = require('@nebulae/backend-node-tools').log;
const { brokerFactory } = require("@nebulae/backend-node-tools").broker;

const VehicleStatsDA = require("./data-access/VehicleStatsDA");
const broker = brokerFactory();
const { events$ } = require('./index');
/**
 * Singleton instance
 * @type { VehicleStatsES }
 */
let instance;

class VehicleStatsES {

    constructor() {
        // Ya no necesitamos nuestro propio Subject, usamos el del dominio
    }


    /**     
     * Generates and returns an object that defines the Event-Sourcing events handlers.
     * 
     * The map is a relationship of: AGGREGATE_TYPE VS { EVENT_TYPE VS  { fn: rxjsFunction, instance: invoker_instance } }
     * 
     * ## Example
     *  { "User" : { "UserAdded" : {fn: handleUserAdded$, instance: classInstance } } }
     */
    generateEventProcessorMap() {
        return {
            Vehicle: {
                Generated: {
                    fn: instance.handleVehicleGenerated$,
                    instance,
                    processOnlyOnSync: false
                }
            }
        }
    };

    /**
     * Handle Vehicle Generated events from MQTT
     * @param {*} event Vehicle Generated Event
     */
    handleVehicleGenerated$({ etv, aid, av, data, user, timestamp }) {
        ConsoleLogger.i(`Received Vehicle Generated event: aid=${aid}, timestamp=${timestamp}`);
        
        // Emitir el evento al Subject del dominio para procesamiento por lotes
        events$.next({ etv, aid, av, data, user, timestamp });
        
        return [];
    }
     
    /**
     * Using the VehicleStatsModified events restores the MaterializedView
     * This is just a recovery strategy
     * @param {*} VehicleStatsModifiedEvent VehicleStats Modified Event
     */
    handleVehicleStatsModified$({ etv, aid, av, data, user, timestamp }) {
        const aggregateDataMapper = [
            /*etv=0 mapper*/ () => { throw new Error('etv 0 is not an option') },
            /*etv=1 mapper*/ (eventData) => { return { ...eventData, modType: undefined }; }
        ];
        delete aggregateDataMapper.modType;
        const aggregateData = aggregateDataMapper[etv](data);
        return iif(
            () => (data.modType === 'DELETE'),
            VehicleStatsDA.deleteVehicleStats$(aid),
            VehicleStatsDA.updateVehicleStatsFromRecovery$(aid, aggregateData, av)
        ).pipe(
            tap(() => ConsoleLogger.i(`VehicleStatsES.handleVehicleStatsModified: ${data.modType}: aid=${aid}, timestamp=${timestamp}`))
        )
    }
}


/**
 * @returns {VehicleStatsES}
 */
module.exports = () => {
    if (!instance) {
        instance = new VehicleStatsES();
        ConsoleLogger.i(`${instance.constructor.name} Singleton created`);
    }
    return instance;
};