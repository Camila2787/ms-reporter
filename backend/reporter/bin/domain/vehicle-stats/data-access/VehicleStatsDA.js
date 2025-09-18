"use strict";

let mongoDB = undefined;
const { map, mapTo } = require("rxjs/operators");
const { of, Observable, defer } = require("rxjs");

const { CustomError } = require("@nebulae/backend-node-tools").error;

// === NUEVO: colecciones para reporter ===
const STATS_COLL = 'fleet_statistics';
const PROCESSED_COLL = 'processed_vehicles';
const STATS_ID = 'real_time_fleet_stats';


const CollectionName = 'VehicleStats';

class VehicleStatsDA {
  static start$(mongoDbInstance) {
    return Observable.create(observer => {
      if (mongoDbInstance) {
        mongoDB = mongoDbInstance;
        observer.next(`${this.name} using given mongo instance`);
      } else {
        mongoDB = require("../../../tools/mongo-db/MongoDB").singleton();
        observer.next(`${this.name} using singleton system-wide mongo instance`);
      }
      observer.next(`${this.name} started`);
      observer.complete();
    });
  }

  /**
   * Gets an user by its username
   */
  static getVehicleStats$(id, organizationId) {
    const collection = mongoDB.db.collection(CollectionName);

    const query = {
      _id: id, organizationId
    };
    return defer(() => collection.findOne(query)).pipe(
      map((res) => {
        return res !== null
          ? { ...res, id: res._id }
          : {}
      })
    );
  }

  static generateListingQuery(filter) {
    const query = {};
    if (filter.name) {
      query["name"] = { $regex: filter.name, $options: "i" };
    }
    if (filter.organizationId) {
      query["organizationId"] = filter.organizationId;
    }
    if (filter.active !== undefined) {
      query["active"] = filter.active;
    }
    return query;
  }

  static getVehicleStatsList$(filter = {}, pagination = {}, sortInput) {
    const collection = mongoDB.db.collection(CollectionName);
    const { page = 0, count = 10 } = pagination;

    const query = this.generateListingQuery(filter);    
    const projection = { name: 1, active: 1 };

    let cursor = collection
      .find(query, { projection })
      .skip(count * page)
      .limit(count);

    const sort = {};
    if (sortInput) {
      sort[sortInput.field] = sortInput.asc ? 1 : -1;
    } else {
      sort["metadata.createdAt"] = -1;
    }
    cursor = cursor.sort(sort);


    return mongoDB.extractAllFromMongoCursor$(cursor).pipe(
      map(res => ({ ...res, id: res._id }))
    );
  }

  static getVehicleStatsSize$(filter = {}) {
    const collection = mongoDB.db.collection(CollectionName);
    const query = this.generateListingQuery(filter);    
    return defer(() => collection.countDocuments(query));
  }

  /**
  * creates a new VehicleStats 
  * @param {*} id VehicleStats ID
  * @param {*} VehicleStats properties
  */
  static createVehicleStats$(_id, properties, createdBy) {

    const metadata = { createdBy, createdAt: Date.now(), updatedBy: createdBy, updatedAt: Date.now() };
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() => collection.insertOne({
      _id,
      ...properties,
      metadata,
    })).pipe(
      map(({ insertedId }) => ({ id: insertedId, ...properties, metadata }))
    );
  }

  /**
  * modifies the VehicleStats properties
  * @param {String} id  VehicleStats ID
  * @param {*} VehicleStats properties to update
  */
  static updateVehicleStats$(_id, properties, updatedBy) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.findOneAndUpdate(
        { _id },
        {
          $set: {
            ...properties,
            "metadata.updatedBy": updatedBy, "metadata.updatedAt": Date.now()
          }
        },
        {
          returnOriginal: false,
        }
      )
    ).pipe(
      map(result => result && result.value ? { ...result.value, id: result.value._id } : undefined)
    );
  }

  /**
  * modifies the VehicleStats properties
  * @param {String} id  VehicleStats ID
  * @param {*} VehicleStats properties to update
  */
  static updateVehicleStatsFromRecovery$(_id, properties, av) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.updateOne(
        {
          _id,
        },
        { $set: { ...properties } },
        {
          returnOriginal: false,
          upsert: true
        }
      )
    ).pipe(
      map(result => result && result.value ? { ...result.value, id: result.value._id } : undefined)
    );
  }

  /**
  * modifies the VehicleStats properties
  * @param {String} id  VehicleStats ID
  * @param {*} VehicleStats properties to update
  */
  static replaceVehicleStats$(_id, properties) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.replaceOne(
        { _id },
        properties,
      )
    ).pipe(
      mapTo({ id: _id, ...properties })
    );
  }

  /**
    * deletes an VehicleStats 
    * @param {*} _id  VehicleStats ID
  */
  static deleteVehicleStats$(_id) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.deleteOne({ _id })
    );
  }

  /**
    * deletes multiple VehicleStats at once
    * @param {*} _ids  VehicleStats IDs array
  */
  static deleteVehicleStatss$(_ids) {
    const collection = mongoDB.db.collection(CollectionName);
    return defer(() =>
      collection.deleteMany({ _id: { $in: _ids } })
    ).pipe(
      map(({ deletedCount }) => deletedCount > 0)
    );
  }

    // ====== NUEVO: Vista materializada (fleet_statistics) ======
  static getStats$() {
    const coll = mongoDB.db.collection(STATS_COLL);
    return defer(() => coll.findOne({ _id: STATS_ID })).pipe(
      map(doc => doc || {
        _id: STATS_ID,
        totalVehicles: 0,
        vehiclesByType: { SUV: 0, PickUp: 0, Sedan: 0 },
        vehiclesByDecade: {},
        vehiclesBySpeedClass: { Lento: 0, Normal: 0, Rapido: 0 },
        hpStats: { min: 999999, max: 0, sum: 0, count: 0, avg: 0 },
        lastUpdated: new Date().toISOString()
      })
    );
  }

  static updateStatsBatch$({ inc, min, max }) {
    const coll = mongoDB.db.collection(STATS_COLL);
    return defer(() => coll.findOneAndUpdate(
      { _id: STATS_ID },
      {
        $inc: inc,
        ...(min ? { $min: min } : {}),
        ...(max ? { $max: max } : {}),
        $set: { lastUpdated: new Date().toISOString() }
      },
      { upsert: true, returnDocument: 'after' }
    )).pipe(map(res => res && (res.value || res.lastErrorObject) ? res.value : null));
  }

  // ====== NUEVO: Idempotencia (processed_vehicles) ======
  static findExistingAids$(aidList) {
    if (!aidList || !aidList.length) return of([]);
    const coll = mongoDB.db.collection(PROCESSED_COLL);
    return defer(() => coll.find({ aid: { $in: aidList } })
      .project({ aid: 1, _id: 0 })
      .toArray())
      .pipe(map(rows => rows.map(r => r.aid)));
  }

  static insertProcessedAids$(aidList) {
    if (!aidList || !aidList.length) return of(true);
    const coll = mongoDB.db.collection(PROCESSED_COLL);
    const docs = aidList.map(aid => ({ aid }));
    return defer(() => coll.insertMany(docs, { ordered: false })).pipe(map(() => true));
  }


}
/**
 * @returns {VehicleStatsDA}
 */
module.exports = VehicleStatsDA;
