import { gql } from 'apollo-boost';

// Query para obtener estadísticas iniciales - Versión nueva
export const GetFleetStatistics = () => ({
    query: gql`
        query GetFleetStatisticsNew {
            GetFleetStatistics {
                _id
                totalVehicles
                vehiclesByType {
                    SUV
                    PickUp
                    Sedan
                }
                vehiclesByDecade {
                    decade1980s
                    decade1990s
                    decade2000s
                    decade2010s
                    decade2020s
                }
                vehiclesBySpeedClass {
                    Lento
                    Normal
                    Rapido
                }
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

// Subscription para actualizaciones en tiempo real - Versión nueva
export const FleetStatisticsUpdated = () => ({
    query: gql`
        subscription FleetStatisticsUpdatedNew {
            FleetStatisticsUpdated {
                _id
                totalVehicles
                vehiclesByType {
                    SUV
                    PickUp
                    Sedan
                }
                vehiclesByDecade {
                    decade1980s
                    decade1990s
                    decade2000s
                    decade2010s
                    decade2020s
                }
                vehiclesBySpeedClass {
                    Lento
                    Normal
                    Rapido
                }
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
