import React, { useRef, useMemo } from 'react';
import { FusePageCarded } from '@fuse';
import { useSelector } from 'react-redux';
import withReducer from 'app/store/withReducer';
import VehicleStatssTable from './VehicleStatssTable';
import VehicleStatssHeader from './VehicleStatssHeader';
import reducer from '../store/reducers';
import { FuseLoading } from '@fuse';

import VehicleStatssFilterHeader from './VehicleStatssFilterHeader';
import VehicleStatssFilterContent from './VehicleStatssFilterContent';

// === Dashboard inline ===
import { useQuery } from '@apollo/react-hooks';
import { Typography, Grid, Card, CardContent, Chip } from '@material-ui/core';
import { GET_FLEET_STATISTICS /*, ON_FLEET_STATS_UPDATED */ } from '../gql/VehicleStats';

function StatsHeaderInline() {
  const { data, loading, error /*, subscribeToMore */ } = useQuery(GET_FLEET_STATISTICS, {
    fetchPolicy: 'network-only',
    pollInterval: 2000,
  });

  const stats = data && data.getFleetStatistics;
  const hp = (stats && stats.hpStats) ? stats.hpStats : {};
  const byType = (stats && stats.vehiclesByType) ? stats.vehiclesByType : {};
  const byDecade = (stats && stats.vehiclesByDecade) ? stats.vehiclesByDecade : {};
  const bySpeed = (stats && stats.vehiclesBySpeedClass) ? stats.vehiclesBySpeedClass : {};

  const lastUpdated = useMemo(() => {
    if (!stats || !stats.lastUpdated) return '';
    try { return new Date(stats.lastUpdated).toLocaleString(); }
    catch (e) { return stats.lastUpdated; }
  }, [stats]);

  if (loading) return <Typography variant="body2">Cargando…</Typography>;
  if (error)   return <Typography color="error">Error al cargar</Typography>;
  if (!stats)  return <Typography variant="body2">Sin datos</Typography>;

  return (
    <Grid container spacing={16} style={{ marginBottom: 16 }}>
      {/* Total + last updated */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Vehículos totales</Typography>
            <Typography variant="h4">{stats.totalVehicles || 0}</Typography>
            <Typography variant="caption">Actualizado: {lastUpdated}</Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* HP stats */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Potencia (HP)</Typography>
            <Typography variant="body2">Mín: {(hp.min !== undefined && hp.min !== null) ? hp.min : '-'}</Typography>
            <Typography variant="body2">Máx: {(hp.max !== undefined && hp.max !== null) ? hp.max : '-'}</Typography>
            <Typography variant="body2">
              Prom: {(hp.avg !== undefined && hp.avg !== null) ? (hp.avg.toFixed ? hp.avg.toFixed(1) : hp.avg) : '-'}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Por Tipo */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Vehículos por tipo</Typography>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              <Chip label={`SUV: ${byType.SUV || 0}`} />
              <Chip label={`PickUp: ${byType.PickUp || 0}`} />
              <Chip label={`Sedan: ${byType.Sedan || 0}`} />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Velocidad */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Clasificación por velocidad</Typography>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              <Chip label={`Lento: ${bySpeed.Lento || 0}`} />
              <Chip label={`Normal: ${bySpeed.Normal || 0}`} />
              <Chip label={`Rápido: ${bySpeed.Rapido || 0}`} />
            </div>
          </CardContent>
        </Card>
      </Grid>

      {/* Décadas */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="subtitle2">Vehículos por década</Typography>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:8 }}>
              <Chip label={`1980s: ${byDecade._1980s || 0}`} />
              <Chip label={`1990s: ${byDecade._1990s || 0}`} />
              <Chip label={`2000s: ${byDecade._2000s || 0}`} />
              <Chip label={`2010s: ${byDecade._2010s || 0}`} />
              <Chip label={`2020s: ${byDecade._2020s || 0}`} />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function VehicleStatss() {
  const user = useSelector(({ auth }) => auth.user);
  const pageLayout = useRef(null);

  if (!user.selectedOrganization) {
    return (<FuseLoading />);
  }

  return (
    <FusePageCarded
      classes={{
        content: "flex",
        header: "min-h-72 h-72 sm:h-72 sm:min-h-72"
      }}
      header={<VehicleStatssHeader pageLayout={pageLayout} />}
      content={
        <div style={{ width: '100%' }}>
          <StatsHeaderInline />
          <VehicleStatssTable />
        </div>
      }
      leftSidebarHeader={<VehicleStatssFilterHeader />}
      leftSidebarContent={<VehicleStatssFilterContent />}
      ref={pageLayout}
      innerScroll
      leftSidebarVariant="permanent"
    />
  );
}

export default withReducer('VehicleStatsManagement', reducer)(VehicleStatss);
