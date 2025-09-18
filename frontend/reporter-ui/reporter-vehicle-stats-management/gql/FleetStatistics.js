import { gql } from 'apollo-boost';

// Query para obtener estadísticas iniciales
export const GetFleetStatistics = () => ({
    query: gql`
        query GetFleetStatistics {
            getFleetStatistics {
                _id
                totalVehicles
                vehiclesByType
                vehiclesByDecade
                vehiclesBySpeedClass
                hpStats { 
                    min 
                    max 
                    sum 
                    count 
                    avg 
                }
                lastUpdated
            }
        }
    `,
    fetchPolicy: 'network-only'
});

// Subscription para actualizaciones en tiempo real
export const FleetStatisticsUpdated = () => ({
    query: gql`
        subscription FleetStatisticsUpdated {
            ReporterFleetStatisticsUpdated {
                _id
                totalVehicles
                vehiclesByType
                vehiclesByDecade
                vehiclesBySpeedClass
                hpStats { 
                    min 
                    max 
                    sum 
                    count 
                    avg 
                }
                lastUpdated
            }
        }
    `
});
