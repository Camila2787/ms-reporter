import React, { useMemo, useRef } from 'react';
import { useQuery, useSubscription } from '@apollo/react-hooks';
import { FusePageCarded } from '@fuse';
import { Card, CardContent, Typography, Grid, Divider } from '@material-ui/core';
import { Doughnut, Bar } from 'react-chartjs-2';
import { GET_FLEET_STATISTICS, ON_FLEET_STATS_UPDATED } from '../gql/VehicleStats';
import { FuseLoading } from '@fuse';

// Helpers
const toPairs = (obj = {}) => Object.entries(obj || {});
const fmt = (n) => new Intl.NumberFormat().format(n || 0);

function StatsHeader({ stats }) {
  const { totalVehicles = 0, hpStats = {}, lastUpdated } = stats || {};
  const avg = hpStats?.avg || 0;

  return (
    <Grid container spacing={16}>
      <Grid item xs={12} md={4}>
        <Card><CardContent>
          <Typography variant="subtitle2" color="textSecondary">Total vehículos</Typography>
          <Typography variant="h4">{fmt(totalVehicles)}</Typography>
          <Typography variant="caption" color="textSecondary">{lastUpdated ? new Date(lastUpdated).toLocaleString() : '-'}</Typography>
        </CardContent></Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card><CardContent>
          <Typography variant="subtitle2" color="textSecondary">Potencia (HP)</Typography>
          <Typography variant="body2">Min: {fmt(hpStats?.min)}</Typography>
          <Typography variant="body2">Max: {fmt(hpStats?.max)}</Typography>
          <Typography variant="body2">Avg: {avg.toFixed(1)}</Typography>
        </CardContent></Card>
      </Grid>
    </Grid>
  );
}

function DoughnutByType({ vehiclesByType = {}, total = 0 }) {
  const labels = Object.keys(vehiclesByType);
  const counts = Object.values(vehiclesByType);
  const data = {
    labels,
    datasets: [{ data: counts }]
  };
  return (
    <Card><CardContent>
      <Typography variant="subtitle1">Vehículos por Tipo</Typography>
      <Doughnut data={data} />
      <Divider style={{ margin: '16px 0' }} />
      {labels.map((l, i) => {
        const pct = total ? ((counts[i] / total) * 100).toFixed(1) : 0;
        return <Typography key={l} variant="body2">{l}: {fmt(counts[i])} ({pct}%)</Typography>
      })}
    </CardContent></Card>
  );
}

function BarByDecade({ vehiclesByDecade = {} }) {
  const entries = toPairs(vehiclesByDecade).sort(([a], [b]) => a.localeCompare(b));
  const labels = entries.map(([k]) => k);
  const values = entries.map(([,v]) => v);
  const data = {
    labels,
    datasets: [{ label: 'Vehículos', data: values }]
  };
  return (
    <Card><CardContent>
      <Typography variant="subtitle1">Vehículos por Década</Typography>
      <Bar data={data} />
    </CardContent></Card>
  );
}

function SpeedClassification({ vehiclesBySpeedClass = {}, total = 0 }) {
  const order = ['Lento', 'Normal', 'Rapido'];
  return (
    <Card><CardContent>
      <Typography variant="subtitle1">Clasificación por Velocidad</Typography>
      {order.map(k => {
        const n = vehiclesBySpeedClass?.[k] || 0;
        const pct = total ? ((n / total) * 100).toFixed(1) : 0;
        return <Typography key={k} variant="body2">{k}: {fmt(n)} ({pct}%)</Typography>;
      })}
    </CardContent></Card>
  );
}

export default function VehicleStatsDashboard() {
  const pageLayout = useRef(null);

  // 1) carga inicial
  const { data, loading } = useQuery(GET_FLEET_STATISTICS, {
    fetchPolicy: 'network-only'
  });

  // 2) live updates (si WS está ok)
  const live = useSubscription(ON_FLEET_STATS_UPDATED);

  const stats = useMemo(() => {
    // prioridad a lo más nuevo (subscription), si no, query inicial
    const s = live?.data?.ReporterFleetStatisticsUpdated || data?.getFleetStatistics;
    return s || null;
  }, [live, data]);

  if (loading && !stats) return <FuseLoading />;

  return (
    <FusePageCarded
      classes={{
        content: "p-24",
        header: "min-h-72 h-72 sm:h-72 sm:min-h-72"
      }}
      header={
        <div className="p-24">
          <Typography variant="h5">Dashboard de Análisis de Flota</Typography>
        </div>
      }
      content={
        !stats ? (
          <Typography variant="body1">Sin datos todavía…</Typography>
        ) : (
          <Grid container spacing={16}>
            <Grid item xs={12}>
              <StatsHeader stats={stats} />
            </Grid>

            <Grid item xs={12} md={6}>
              <DoughnutByType vehiclesByType={stats.vehiclesByType} total={stats.totalVehicles} />
            </Grid>

            <Grid item xs={12} md={6}>
              <BarByDecade vehiclesByDecade={stats.vehiclesByDecade} />
            </Grid>

            <Grid item xs={12} md={6}>
              <SpeedClassification vehiclesBySpeedClass={stats.vehiclesBySpeedClass} total={stats.totalVehicles} />
            </Grid>
          </Grid>
        )
      }
      ref={pageLayout}
      innerScroll
    />
  );
}
