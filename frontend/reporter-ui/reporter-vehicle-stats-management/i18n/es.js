export default {
  navigation: {
    'settings': 'Configuraciones',
    'reporter-vehicle-stats-management': 'VehicleStatss',
    'reporter-vehicle-stats-dashboard': 'Dashboard de Flota'
  },
  vehicle_statss: {
    vehicle_statss: 'VehicleStatss',
    search: 'Búsqueda rápida por nombre',
    add_new_vehicle_stats: 'Agregar Nueva',
    add_new_vehicle_stats_short: 'Agregar',
    rows_per_page: 'Filas por página:',
    of: 'de',
    remove: 'Eliminar',
    table_colums: {
      name: 'Nombre',
      active: 'Activo'
    },
    remove_dialog_title: "¿Desea eliminar las vehicleStatss seleccionadas?",
    remove_dialog_description: "Esta acción no se puede deshacer",
    remove_dialog_no: "No",
    remove_dialog_yes: "Si",
    filters: {
      title: "Filtros",
      active: "Activo"
    }
  },
  vehicle_stats: {
    vehicle_statss: 'VehicleStatss',
    vehicle_stats_detail: 'Detalle de la VehicleStats',
    save: 'GUARDAR',
    basic_info: 'Información Básica',
    name: 'Nombre',
    description: 'Descripción',
    active: 'Activo',
    metadata_tab: 'Metadatos',
    metadata: {
      createdBy: 'Creado por',
      createdAt: 'Creado el',
      updatedBy: 'Modificado por',
      updatedAt: 'Modificado el',
    },
    not_found: 'Lo sentimos pero no pudimos encontrar la entidad que busca',
    internal_server_error: 'Error Interno del Servidor',
    update_success: 'VehicleStats ha sido actualizado',
    create_success: 'VehicleStats ha sido creado',
    form_validations: {
      name: {
        length: "El nombre debe tener al menos {len} caracteres",
        required: "El nombre es requerido",
      }
    },
  },

  vehicle_stats_dashboard: {
    title: 'Dashboard de Análisis de Flota',
    vehicles_by_type: 'Vehículos por Tipo',
    vehicles_by_decade: 'Vehículos por Década',
    speed_class: 'Clasificación por Velocidad',
    hp_stats: 'Potencia (HP)',

    // Tarjetas / KPIs
    total_vehicles: 'Total de Vehículos',
    last_updated: 'Última actualización',

    // Leyendas / etiquetas
    type_SUV: 'SUV',
    type_PickUp: 'PickUp',
    type_Sedan: 'Sedán',

    decade_1980s: '1980s',
    decade_1990s: '1990s',
    decade_2000s: '2000s',
    decade_2010s: '2010s',
    decade_2020s: '2020s',

    speed_Lento: 'Lento (<140 km/h)',
    speed_Normal: 'Normal (140–240 km/h)',
    speed_Rapido: 'Rápido (>240 km/h)',

    hp_min: 'Mínimo',
    hp_max: 'Máximo',
    hp_avg: 'Promedio',

    // Estados UI
    loading: 'Cargando estadísticas...',
    empty: 'Sin datos aún',
    error: 'No se pudieron cargar las estadísticas',
    refresh: 'Actualizar',
  },
};