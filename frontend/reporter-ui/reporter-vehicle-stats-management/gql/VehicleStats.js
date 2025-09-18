import { gql } from 'apollo-boost';

export const ReporterVehicleStatsListing = (variables) => ({
    query: gql`
            query ReporterVehicleStatsListing($filterInput:ReporterVehicleStatsFilterInput ,$paginationInput:ReporterVehicleStatsPaginationInput,$sortInput:ReporterVehicleStatsSortInput){
                ReporterVehicleStatsListing(filterInput:$filterInput,paginationInput:$paginationInput,sortInput:$sortInput){
                    listing{
                       id,name,active,
                    },
                    queryTotalResultCount
                }
            }`,
    variables,
    fetchPolicy: 'network-only',
})

export const ReporterVehicleStats = (variables) => ({
    query: gql`
            query ReporterVehicleStats($id: ID!, $organizationId: String!){
                ReporterVehicleStats(id:$id, organizationId:$organizationId){
                    id,name,description,active,organizationId,
                    metadata{ createdBy, createdAt, updatedBy, updatedAt }
                }
            }`,
    variables,
    fetchPolicy: 'network-only',
})


export const ReporterCreateVehicleStats = (variables) => ({
    mutation: gql`
            mutation  ReporterCreateVehicleStats($input: ReporterVehicleStatsInput!){
                ReporterCreateVehicleStats(input: $input){
                    id,name,description,active,organizationId,
                    metadata{ createdBy, createdAt, updatedBy, updatedAt }
                }
            }`,
    variables
})

export const ReporterDeleteVehicleStats = (variables) => ({
    mutation: gql`
            mutation ReporterVehicleStatsListing($ids: [ID]!){
                ReporterDeleteVehicleStatss(ids: $ids){
                    code,message
                }
            }`,
    variables
})

export const ReporterUpdateVehicleStats = (variables) => ({
    mutation: gql`
            ,mutation  ReporterUpdateVehicleStats($id: ID!,$input: ReporterVehicleStatsInput!, $merge: Boolean!){
                ReporterUpdateVehicleStats(id:$id, input: $input, merge:$merge ){
                    id,organizationId,name,description,active
                }
            }`,
    variables
})

export const onReporterVehicleStatsModified = (variables) => ([
    gql`subscription onReporterVehicleStatsModified($id:ID!){
            ReporterVehicleStatsModified(id:$id){    
                id,organizationId,name,description,active,
                metadata{ createdBy, createdAt, updatedBy, updatedAt }
            }
    }`,
    { variables }
])

// Query: estado inicial del dashboard
export const GET_FLEET_STATISTICS = gql`
  query GetFleetStatistics {
    getFleetStatistics {
      _id
      totalVehicles
      vehiclesByType
      vehiclesByDecade
      vehiclesBySpeedClass
      hpStats { min max sum count avg }
      lastUpdated
    }
  }
`;

// Subscription: push del backend cada ~1s
export const ON_FLEET_STATS_UPDATED = gql`
  subscription OnFleetStats {
    ReporterFleetStatisticsUpdated {
      _id
      totalVehicles
      vehiclesByType
      vehiclesByDecade
      vehiclesBySpeedClass
      hpStats { min max sum count avg }
      lastUpdated
    }
  }
`;