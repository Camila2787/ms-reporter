import React, { useRef, useState, useEffect } from 'react';
import { FusePageCarded } from '@fuse';
import { useSelector } from 'react-redux';
import withReducer from 'app/store/withReducer';
import VehicleStatssTable from './VehicleStatssTable';
import VehicleStatssHeader from './VehicleStatssHeader';
import reducer from '../store/reducers';
import { FuseLoading } from '@fuse';

import VehicleStatssFilterHeader from './VehicleStatssFilterHeader';
import VehicleStatssFilterContent from './VehicleStatssFilterContent';

// === Dashboard simple sin Apollo ===
import { Typography, Grid, Card, CardContent, Chip } from '@material-ui/core';

function StatsHeaderSimple() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Simular datos por ahora - puedes reemplazar con una llamada HTTP real
        const mockStats = {
          _id: "real_time_fleet_stats",
          totalVehicles: 0,
          vehiclesByType: { SUV: 0, PickUp: 0, Sedan: 0 },
          vehiclesByDecade: { "1980s": 0, "1990s": 0, "2000s": 0, "2010s": 0, "2020s": 0 },
          vehiclesBySpeedClass: { Lento: 0, Normal: 0, Rapido: 0 },
          hpStats: { min: 0, max: 0, sum: 0, count: 0, avg: 0 },
          lastUpdated: new Date().toISOString()
        };
        
        setStats(mockStats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Actualizar cada 2 segundos
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Typography variant="body2">Cargando…</Typography>;
  if (error) return <Typography color="error">Error al cargar: {error}</Typography>;
  if (!stats) return <Typography variant="body2">Sin datos</Typography>;

  const hp = stats.hpStats || {};
  const byType = stats.vehiclesByType || {};
  const byDecade = stats.vehiclesByDecade || {};
  const bySpeed = stats.vehiclesBySpeedClass || {};

  const lastUpdated = stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleString() : '';

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
              <Chip label={`1980s: ${byDecade["1980s"] || 0}`} />
              <Chip label={`1990s: ${byDecade["1990s"] || 0}`} />
              <Chip label={`2000s: ${byDecade["2000s"] || 0}`} />
              <Chip label={`2010s: ${byDecade["2010s"] || 0}`} />
              <Chip label={`2020s: ${byDecade["2020s"] || 0}`} />
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

function VehicleStatssSimple() {
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
          <StatsHeaderSimple />
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

export default withReducer('VehicleStatsManagement', reducer)(VehicleStatssSimple);
