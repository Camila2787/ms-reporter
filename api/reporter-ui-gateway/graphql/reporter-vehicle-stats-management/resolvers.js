const withFilter = require("graphql-subscriptions").withFilter;
const PubSub = require("graphql-subscriptions").PubSub;
const pubsub = new PubSub();
const { of } = require("rxjs");
const { tap, map, mergeMap, catchError } = require('rxjs/operators');
let broker = require("../../broker/BrokerFactory")();
broker = broker.secondaryBroker ? broker.secondaryBroker : broker;
const RoleValidator = require('../../tools/RoleValidator');
const { handleError$ } = require('../../tools/GraphqlResponseTools');

const INTERNAL_SERVER_ERROR_CODE = 1;
const PERMISSION_DENIED_ERROR_CODE = 2;
const CONTEXT_NAME = "reporter";

const READ_ROLES = ["VEHICLE_STATS_READ"];
const WRITE_ROLES = ["VEHICLE_STATS_WRITE"];

function getResponseFromBackEnd$(response) {
    return of(response)
        .pipe(
            map(resp => {
                if (resp.result.code != 200) {
                    const err = new Error();
                    err.name = 'Error';
                    err.message = resp.result.error;
                    // this[Symbol()] = resp.result.error;
                    Error.captureStackTrace(err, 'Error');
                    throw err;
                }
                return resp.data;
            })
        );
}

/**
 * Validate user roles and send request to backend handler
 * @param {object} root root of GraphQl
 * @param {object} OperationArguments arguments for query or mutation
 * @param {object} context graphQl context
 * @param { Array } requiredRoles Roles required to use the query or mutation
 * @param {string} operationType  sample: query || mutation
 * @param {string} aggregateName sample: Vehicle, Client, FixedFile 
 * @param {string} methodName method name
 * @param {number} timeout timeout for query or mutation in milliseconds
 */
function sendToBackEndHandler$(root, args, context, operationType, aggregate, methodName, timeout=2000) {
  return RoleValidator.checkPermissions$(
    (context.authToken && context.authToken.realm_access ? context.authToken.realm_access.roles : []),
    CONTEXT_NAME, methodName, 2, "Permission denied", READ_ROLES
  ).pipe(
    mergeMap(() => broker.forwardAndGetReply$(
      aggregate,
      `reporter-uigateway.graphql.${operationType}.${methodName}`,
      { root, args, jwt: context.encodedToken },
      timeout
    )),
    catchError(err => handleError$(err, methodName)),
    mergeMap(res => getResponseFromBackEnd$(res))
  );
}

function getResponseFromBackEnd$(response) {
  return of(response).pipe(
    map(resp => {
      if (resp.result.code !== 200) {
        const err = new Error(typeof resp.result.error === 'string'
          ? resp.result.error
          : JSON.stringify(resp.result.error || resp.result)
        );
        throw err;
      }
      return resp.data;
    })
  );
}

module.exports = {
  Query: {
    ReporterVehicleStatsListing(root, args, context) {
      return sendToBackEndHandler$(root, args, context, 'query', 'VehicleStats', 'ReporterVehicleStatsListing').toPromise();
    },

    ReporterVehicleStats(root, args, context) {
      return sendToBackEndHandler$(root, args, context, 'query', 'VehicleStats', 'ReporterVehicleStats').toPromise();
    },

    getFleetStatistics(root, args, context) {
      return sendToBackEndHandler$(root, args, context, 'query', 'VehicleStats', 'GetFleetStatistics').toPromise();
    }
  },

  Mutation: {
    ReporterCreateVehicleStats(root, args, context) {
      return sendToBackEndHandler$(root, args, context, 'mutation', 'VehicleStats', 'ReporterCreateVehicleStats').toPromise();
    },

    ReporterUpdateVehicleStats(root, args, context) {
      return sendToBackEndHandler$(root, args, context, 'mutation', 'VehicleStats', 'ReporterUpdateVehicleStats').toPromise();
    },

    ReporterDeleteVehicleStatss(root, args, context) {
      return sendToBackEndHandler$(root, args, context, 'mutation', 'VehicleStats', 'ReporterDeleteVehicleStatss').toPromise();
    }
  },

  Subscription: {
    ReporterVehicleStatsModified: {
      subscribe: withFilter(
        () => pubsub.asyncIterator('ReporterVehicleStatsModified'),
        (payload, variables) => {
          return payload.ReporterVehicleStatsModified.id === variables.id;
        }
      )
    },

    ReporterFleetStatisticsUpdated: {
      subscribe: () => pubsub.asyncIterator('ReporterFleetStatisticsUpdated')
    }
  }
};

// Bridge: escucha el tópico de MV del backend y empuja al GQL subscription
const eventDescriptors = [
  {
    backendEventName: "ReporterFleetStatisticsUpdated",  // <- nombre del evento del backend
    gqlSubscriptionName: "ReporterFleetStatisticsUpdated",
    dataExtractor: evt => evt.data
  }
];

eventDescriptors.forEach(descriptor => {
  broker.getMaterializedViewsUpdates$([descriptor.backendEventName]).subscribe(
    evt => {
      const payload = {};
      payload[descriptor.gqlSubscriptionName] = descriptor.dataExtractor ? descriptor.dataExtractor(evt) : evt.data;
      pubsub.publish(descriptor.gqlSubscriptionName, payload);
    },
    error => console.error(`Error listening ${descriptor.gqlSubscriptionName}`, error),
    () => console.log(`${descriptor.gqlSubscriptionName} listener STOPPED`)
  );
});