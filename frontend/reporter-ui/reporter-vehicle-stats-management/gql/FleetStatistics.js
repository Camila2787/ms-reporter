import { gql } from 'apollo-boost';

// Query para obtener estadísticas iniciales
export const GetFleetStatistics = () => ({
    query: gql`
        query GetFleetStatistics {
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

// Subscription para actualizaciones en tiempo real
export const FleetStatisticsUpdated = () => ({
    query: gql`
        subscription FleetStatisticsUpdated {
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
