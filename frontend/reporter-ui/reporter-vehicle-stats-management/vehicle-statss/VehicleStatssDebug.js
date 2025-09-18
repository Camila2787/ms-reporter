import React, { useRef, useEffect, useState } from 'react';
import { FusePageCarded, FuseLoading } from '@fuse';
import { useSelector } from 'react-redux';
import withReducer from 'app/store/withReducer';
import { useQuery } from '@apollo/react-hooks';
import { 
    Card, 
    CardContent, 
    Typography, 
    Grid, 
    Box,
    Chip,
    LinearProgress,
    Divider
} from '@material-ui/core';
import { gql } from 'apollo-boost';
import reducer from '../store/reducers';

// Query simple para debugging
const DEBUG_QUERY = gql`
    query DebugQuery {
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
`;

function VehicleStatssDebug() {
    const user = useSelector(({ auth }) => auth.user);
    const pageLayout = useRef(null);
    const [fleetStats, setFleetStats] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Data load with polling for real-time updates
    const { data, loading, error } = useQuery(DEBUG_QUERY, {
        fetchPolicy: 'network-only',
        pollInterval: 2000, // Poll every 2 seconds for real-time updates
        onCompleted: (data) => {
            console.log('Debug query data received:', data);
        },
        onError: (error) => {
            console.error('Debug query error:', error);
        }
    });

    // Update state when data loads
    useEffect(() => {
        if (data && data.GetFleetStatistics) {
            console.log('Fleet statistics updated:', data.GetFleetStatistics);
            setFleetStats(data.GetFleetStatistics);
            setLastUpdate(data.GetFleetStatistics.lastUpdated);
        }
    }, [data]);
    
    if(!user.selectedOrganization){
        return (<FuseLoading />);
    }

    if (loading) {
        return <FuseLoading />;
    }

    if (error) {
        return (
            <FusePageCarded
                header={
                    <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-32 px-24 md:px-32">
                        <Typography variant="h4">Dashboard Debug - Error</Typography>
                    </div>
                }
                content={
                    <div className="p-24">
                        <Typography color="error" variant="h6" gutterBottom>
                            Error loading fleet statistics:
                        </Typography>
                        <pre style={{ fontSize: '12px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '16px' }}>
                            {JSON.stringify(error, null, 2)}
                        </pre>
                    </div>
                }
            />
        );
    }

    if (!fleetStats) {
        return (
            <FusePageCarded
                header={
                    <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-32 px-24 md:px-32">
                        <Typography variant="h4">Dashboard Debug - No Data</Typography>
                    </div>
                }
                content={
                    <div className="p-24">
                        <Typography>Estadísticas de Fleet no disponibles</Typography>
                    </div>
                }
            />
        );
    }

    return (
        <FusePageCarded
            classes={{
                content: "flex",
                header: "min-h-72 h-72 sm:h-72 sm:min-h-72"
            }}
            header={
                <div className="flex flex-col sm:flex-row space-y-16 sm:space-y-0 flex-1 w-full items-center justify-between py-32 px-24 md:px-32">
                    <Typography variant="h4" align="center" className="w-full sm:w-auto">Dashboard Debug - Funcionando</Typography>
                    <Box display="flex" alignItems="center" className="mt-16 sm:mt-0">
                        <Chip 
                            label={loading ? "Loading..." : error ? "Error" : "Live"} 
                            color={loading ? "default" : error ? "secondary" : "primary"}
                            size="small"
                            style={{ marginRight: 8 }}
                        />
                        {lastUpdate && (
                            <Chip 
                                label={`Last update: ${new Date(lastUpdate).toLocaleTimeString()}`}
                                size="small"
                            />
                        )}
                    </Box>
                </div>
            }
            content={
                <div className="p-24" style={{ maxWidth: 1200, margin: '0 auto' }}>
                    {/* Total Vehicles Card */}
                    <Card className="mb-24">
                        <CardContent>
                            <Typography variant="h3" color="primary" align="center" gutterBottom>
                                {fleetStats.totalVehicles.toLocaleString()}
                            </Typography>
                            <Typography variant="h6" align="center" color="textSecondary">
                                Total de Vehículos Procesados
                            </Typography>
                        </CardContent>
                    </Card>

                    <Grid container spacing={24}>
                        {/* Vehicles by Type */}
                        <Grid item xs={12} md={6} style={{ marginBottom: 24 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Vehículos por Tipo</Typography>
                                    <Box>
                                        <Typography variant="body1">SUV: {fleetStats.vehiclesByType?.SUV || 0}</Typography>
                                        <Typography variant="body1">PickUp: {fleetStats.vehiclesByType?.PickUp || 0}</Typography>
                                        <Typography variant="body1">Sedan: {fleetStats.vehiclesByType?.Sedan || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Vehicles by Decade */}
                        <Grid item xs={12} md={6} style={{ marginBottom: 24 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Vehículos por Década</Typography>
                                    <Box>
                                        <Typography variant="body1">1980s: {fleetStats.vehiclesByDecade?.decade1980s || 0}</Typography>
                                        <Typography variant="body1">1990s: {fleetStats.vehiclesByDecade?.decade1990s || 0}</Typography>
                                        <Typography variant="body1">2000s: {fleetStats.vehiclesByDecade?.decade2000s || 0}</Typography>
                                        <Typography variant="body1">2010s: {fleetStats.vehiclesByDecade?.decade2010s || 0}</Typography>
                                        <Typography variant="body1">2020s: {fleetStats.vehiclesByDecade?.decade2020s || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* HP Statistics */}
                        <Grid item xs={12} md={6} style={{ marginBottom: 24 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Estadísticas de HP</Typography>
                                    <Box>
                                        <Typography variant="body1">Mínimo: {fleetStats.hpStats?.min || 0}</Typography>
                                        <Typography variant="body1">Máximo: {fleetStats.hpStats?.max || 0}</Typography>
                                        <Typography variant="body1">Promedio: {fleetStats.hpStats?.avg?.toFixed(1) || 0}</Typography>
                                        <Typography variant="body1">Total: {fleetStats.hpStats?.count || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Speed Classification */}
                        <Grid item xs={12} md={6} style={{ marginBottom: 24 }}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>Clasificación de Velocidad</Typography>
                                    <Box>
                                        <Typography variant="body1">Lento: {fleetStats.vehiclesBySpeedClass?.Lento || 0}</Typography>
                                        <Typography variant="body1">Normal: {fleetStats.vehiclesBySpeedClass?.Normal || 0}</Typography>
                                        <Typography variant="body1">Rápido: {fleetStats.vehiclesBySpeedClass?.Rapido || 0}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Divider className="my-24" />
                    
                    {/* Raw Data Debug */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Raw Data (Debug)</Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Connection Status: {loading ? "Loading..." : error ? "Error" : "Connected"}
                            </Typography>
                            {error && (
                                <Typography variant="body2" color="error" gutterBottom>
                                    Error: {error.message}
                                </Typography>
                            )}
                            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                                {JSON.stringify(fleetStats, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </div>
            }
            ref={pageLayout}
            innerScroll
        />
    );
}

export default withReducer('VehicleStatsManagement', reducer)(VehicleStatssDebug);
