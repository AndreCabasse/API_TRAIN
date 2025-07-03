import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Typography, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Paper, Stack, Chip, Button, Tooltip, TextField
} from '@mui/material';
import TrackIcon from '@mui/icons-material/Train';
import DirectionsRailwayIcon from '@mui/icons-material/DirectionsRailway';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DownloadIcon from '@mui/icons-material/Download';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, timelineItemClasses } from '@mui/lab';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { trainApi } from '../services/api';
// import RequirementsChart from "./RequirementsChart";
import { Train } from '../types';
import Plot from "react-plotly.js";
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import type { Shape } from 'plotly.js';
dayjs.extend(isoWeek);

// Palette de rouges nuancés harmonisée avec Dashboard
const redPalette = {
  main: '#D32F2F',
  light: '#FF6659',
  lighter: '#FFEAEA',
  veryLight: '#FFF5F5',
  dark: '#9A0007',
  accent: '#FF1744',
  faded: '#f8d7da',
  faded2: '#fbe9e7',
  faded3: '#fff0f0',
};

// ----------- GanttChart avec couleurs par type -----------
const getColorForType = (type: string) => {
  switch (type) {
    case 'storage': return '#1976d2';      // bleu
    case 'testing': return '#ff9800';      // orange
    case 'pit':     return redPalette.main;      // rouge
    case 'passenger': return '#388e3c';    // vert
    default:        return '#757575';      // gris
  }
};

const statCardPalette = [
  { bg: "#1976d2", fg: "#fff" }, // Bleu vif
  { bg: "#43a047", fg: "#fff" }, // Vert vif
  { bg: "#ff9800", fg: "#fff" }, // Orange vif
];

// Génère les barres verticales pour chaque début de semaine
function getWeekLinesAndAnnotations(startDate: string, endDate: string) {
  const shapes: Partial<Shape>[] = [];
  const annotations: any[] = [];
  let current = dayjs(startDate).startOf('isoWeek');
  const end = dayjs(endDate);
  while (current.isBefore(end)) {
    shapes.push({
      type: 'line',
      x0: current.format('YYYY-MM-DDTHH:mm:ss'),
      x1: current.format('YYYY-MM-DDTHH:mm:ss'),
      yref: 'paper',
      y0: 0,
      y1: 1,
      line: {
        color: '#b71c1c',
        width: 2,
        dash: 'dot'
      },
      opacity: 0.7
    });
    annotations.push({
      x: current.format('YYYY-MM-DDTHH:mm:ss'),
      yref: 'paper',
      y: 1.04, // au-dessus du graphe
      showarrow: false,
      text: `S${current.isoWeek()}`,
      font: { color: '#b71c1c', size: 13, family: "Roboto, Arial, sans-serif" },
      bgcolor: '#fff',
      opacity: 0.9,
      xanchor: 'center'
    });
    current = current.add(1, 'week');
  }
  return { shapes, annotations };
}

const GanttChart: React.FC<{
  depot: string,
  startDate: string,
  endDate: string,
  onExport?: () => void
}> = ({ depot, startDate, endDate, onExport }) => {
  const { language } = useLanguage();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plotRef, setPlotRef] = useState<any>(null);

  useEffect(() => {
    if (!depot) return;
    setLoading(true);
    setError(null);
    trainApi.getGantt(depot)
      .then((allData) => {
        // Filtre par période sélectionnée
        const filtered = allData.filter((d: any) => {
          const debut = new Date(d.debut);
          const fin = new Date(d.fin);
          return (!startDate || debut >= new Date(startDate)) &&
                 (!endDate || fin <= new Date(endDate));
        });
        setData(filtered);
      })
      .catch(() => setError(t('error_loading_gantt', language) || 'Erreur lors du chargement du Gantt'))
      .finally(() => setLoading(false));
  }, [depot, language, startDate, endDate]);

  if (!depot) return null;
  if (loading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (error) return <Typography color="error">{error}</Typography>;
  if (!data.length) return <Typography color="textSecondary">{t('no_gantt', language) || "Aucun Gantt à afficher"}</Typography>;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(language, {
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  };

  const hoverTemplate =
    ` <span style="font-weight:bold;color:#1976d2;">${t('train', language)}:</span> <span style="font-weight:bold;">%{customdata[6]}</span> %{customdata[4]}<br>
      <span style="color:#388e3c;">${t('track', language)}:</span> %{customdata[1]}<br>
      <span style="color:#ff9800;">${t('train_type', language)}:</span> %{customdata[2]}<br>
      <span style="color:#222;">${t('time', language)}:</span> %{customdata[0]}<br>
      <span style="color:#d32f2f;">${t('length', language)}:</span> %{customdata[5]} m
  <extra></extra>`;

  const plotData = data.map((d: any) => ({
    type: "scatter" as const,
    mode: "lines" as const,
    x: [d.debut, d.fin],
    y: [t('track', language) + ' ' + d.voie, t('track', language) + ' ' + d.voie],
    line: {
      width: 24,
      color: getColorForType(d.type),
      shape: "linear"
    },
    marker: {
      color: getColorForType(d.type),
      line: { color: "#222", width: 2 }
    },
    text: d.train_nom,
    customdata: [[
      `${formatDate(d.debut)} → ${formatDate(d.fin)}`, // 0: horaires
      d.voie,                                          // 1: voie
      t(d.type, language),                             // 2: type
      d.train_id,                                      // 3: id
      d.electrique ? "⚡" : "",                        // 4: electrique
      d.longueur || "",                                // 5: longueur
      d.train_nom,                                     // 6: nom du train
    ]],
    hovertemplate: hoverTemplate,
    showlegend: false,
  }));

  // Export du diagramme
  const handleExport = () => {
    if (plotRef && plotRef.downloadImage) {
      plotRef.downloadImage({format: 'png', filename: `gantt_${depot}`});
    }
    if (onExport) onExport();
  };

  // Ajout des barres verticales de semaine
const { shapes: weekShapes, annotations: weekAnnotations } = getWeekLinesAndAnnotations(startDate, endDate);

  return (
    <Box sx={{
      position: 'relative',
      bgcolor: "rgba(255,255,255,0.95)",
      borderRadius: 5,
      boxShadow: 6,
      p: 2,
      mb: 3,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 12 }
    }}>
      <Button
        variant="contained"
        color="primary"
        startIcon={<DownloadIcon />}
        sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}
        onClick={handleExport}
      >
        {t('export_diagram', language) || "Exporter"}
      </Button>
      <Plot
        data={plotData as any}
        layout={{
          title: {
            text: `${t('gantt_chart', language) || "Gantt"} - ${depot}`,
            font: { color: "#222", size: 22, family: "Roboto, Arial, sans-serif" }
          },
          yaxis: {
            automargin: true,
            title: t('track', language),
            type: "category",
            tickfont: { color: "#222", size: 16, family: "Roboto, Arial, sans-serif" },
            gridcolor: "#e0e0e0",
            zeroline: false,
          },
          xaxis: {
            type: "date",
            title: t('Time', language),
            tickformat: "%a %d/%m %H:%M",
            showgrid: true,
            gridcolor: "#e0e0e0",
            zeroline: false,
            tickfont: { color: "#222", size: 15, family: "Roboto, Arial, sans-serif" },
            tickangle: -35,
            ticklabelmode: "period",
            automargin: true,
          },
          height: 440,
          margin: { l: 100, r: 30, t: 60, b: 80 },
          plot_bgcolor: "#f8fafc",
          paper_bgcolor: "#e3e7ee",
          hoverlabel: {
            bgcolor: "#fff",
            bordercolor: "#1976d2",
            font: { color: "#222", size: 15 }
          },
          shapes: weekShapes, // <--- Ajout des barres verticales
          annotations: weekAnnotations,
        }}
        style={{ width: "100%", height: 440, borderRadius: 16, boxShadow: "0 2px 16px #bbb" }}
        config={{ responsive: true, displayModeBar: false }}
        ref={(node) => setPlotRef(node)}
      />
    </Box>
  );
};
// ----------- End GanttChart -----------

// ----------- Timeline moderne avec @mui/lab -----------
const ModernTimeline: React.FC<{ trains: Train[] }> = ({ trains }) => {
  const { language } = useLanguage();
  if (!trains.length) return null;
  // Tri par date d'arrivée
  const sorted = [...trains].sort((a, b) => new Date(a.arrivee).getTime() - new Date(b.arrivee).getTime());
  return (
    <Paper sx={{
      p: 2,
      borderRadius: 5,
      bgcolor: "rgba(255,255,255,0.95)",
      mb: 3,
      boxShadow: 4,
      transition: 'box-shadow 0.2s',
      '&:hover': { boxShadow: 10 }
    }}>
      <Typography variant="h6" gutterBottom color={redPalette.main}>
        {t('timeline_arrivals', language) || "Arrivées prochaines"}
      </Typography>
      <Timeline
        sx={{
          [`& .${timelineItemClasses.root}:before`]: { flex: 0, padding: 0 },
        }}
      >
        {sorted.map(train => (
          <TimelineItem key={train.id}>
            <TimelineSeparator>
              <Tooltip title={t(train.type, language)} arrow>
                <TimelineDot sx={{ bgcolor: getColorForType(train.type) }} />
              </Tooltip>
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Tooltip
                title={
                  <Box>
                    <Typography variant="subtitle2">{train.nom}</Typography>
                    <Typography variant="body2">{t(train.type, language)}</Typography>
                    <Typography variant="body2">{t('arrival', language)}: {dayjs(train.arrivee).format('DD/MM HH:mm')}</Typography>
                  </Box>
                }
                arrow
                placement="top"
              >
                <span>
                  <b>{train.nom}</b> — {dayjs(train.arrivee).format('DD/MM HH:mm')}
                </span>
              </Tooltip>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </Paper>
  );
};
// ----------- End Timeline -----------

// Nouveau StatCard plus grand et vertical
const StatCard = ({
  icon,
  label,
  value,
  color,
  fgColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  color: string;
  fgColor: string;
}) => (
  <Paper
    elevation={8}
    sx={{
      p: 3,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      bgcolor: color,
      minWidth: 180,
      minHeight: 110,
      flexGrow: 1,
      borderRadius: 4,
      boxShadow: 16,
      border: `2px solid #fff`,
      transition: 'box-shadow 0.2s, transform 0.2s',
      '&:hover': {
        boxShadow: 24,
        transform: 'scale(1.05)'
      }
    }}
  >
    <Box sx={{ color: fgColor, mb: 1 }}>{icon}</Box>
    <Typography
      variant="subtitle2"
      sx={{
        color: fgColor,
        opacity: 0.98,
        textAlign: 'center',
        textShadow: '0 2px 8px #0008, 0 1px 0 #fff',
        fontWeight: 700,
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="h3"
      fontWeight="bold"
      sx={{
        color: fgColor,
        textAlign: 'center',
        textShadow: '0 2px 12px #000b, 0 1px 0 #fff',
        letterSpacing: 1,
        mt: 1,
      }}
    >
      {value}
    </Typography>
  </Paper>
);

// ----------- DepotView principal -----------
const DepotView: React.FC = () => {
  const { language } = useLanguage();
  const [trains, setTrains] = useState<Train[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>('');
  const [depots, setDepots] = useState<any[]>([]);
  const [depotInfo, setDepotInfo] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres période
  const [startDate, setStartDate] = useState<string>(dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm'));
  const [endDate, setEndDate] = useState<string>(dayjs().add(2, 'day').format('YYYY-MM-DDTHH:mm'));

  // Chargement des dépôts
  useEffect(() => {
    trainApi.getDepots()
      .then(setDepots)
      .catch(() => setError(t('error_loading_depots', language) || 'Erreur lors du chargement des dépôts'))
      .finally(() => setLoading(false));
  }, [language]);

  // Chargement des infos du dépôt et des trains
  useEffect(() => {
    if (!selectedDepot) return;
    setLoading(true);
    setError(null);
    Promise.all([
      trainApi.getDepotInfo(selectedDepot),
      trainApi.getTrains()
    ])
      .then(([info, trainsData]) => {
        setDepotInfo(info);
        setTrains(trainsData);
      })
      .catch(() => setError(t('error_loading_data', language) || 'Erreur lors du chargement des données'))
      .finally(() => setLoading(false));
  }, [selectedDepot, language]);

  const depotTrains = trains.filter(train => train.depot === selectedDepot);
  const depotTrainsEnAttente = depotTrains.filter(train => train.en_attente);

  // ----------- Ajout bouton plage maximale -----------
  const setFullDateRange = () => {
    if (depotTrains.length === 0) return;
    const arrivees = depotTrains.map(t => dayjs(t.arrivee).valueOf());
    const departs = depotTrains.map(t => dayjs(t.depart).valueOf());
    const minArrivee = dayjs(Math.min(...arrivees));
    const maxDepart = dayjs(Math.max(...departs));
    setStartDate(minArrivee.subtract(2, 'day').format('YYYY-MM-DDTHH:mm'));
    setEndDate(maxDepart.add(2, 'day').format('YYYY-MM-DDTHH:mm'));
  };

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          mb: 4,
          minHeight: '100vh',
          borderRadius: 3,
          boxShadow: 2,
          background: `linear-gradient(120deg, ${redPalette.veryLight} 0%, ${redPalette.lighter} 100%)`,
          p: { xs: 1, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
          sx={{
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 3,
            boxShadow: 2,
            p: 2,
          }}
        >
          <Typography variant="h4" fontWeight="bold" color={redPalette.main}>
            {t('depots', language)}
          </Typography>
          <FormControl sx={{ minWidth: 220 }}>
            <InputLabel>{t('select_depot', language)}</InputLabel>
            <Select
              value={selectedDepot}
              onChange={(e) => setSelectedDepot(e.target.value)}
              label={t('select_depot', language)}
              sx={{
                background: 'rgba(255,255,255,0.98)',
                borderRadius: 2,
              }}
            >
              {depots.map((d) => (
                <MenuItem key={d.depot} value={d.depot}>{d.depot}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        {/* Filtres période */}
        <Box
          display="flex"
          gap={2}
          alignItems="center"
          mb={2}
          sx={{
            background: 'rgba(255,255,255,0.92)',
            borderRadius: 3,
            boxShadow: 1,
            p: 2,
          }}
        >
          <TextField
            label={t('start_date', language) || "Début"}
            type="datetime-local"
            size="small"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ background: 'white', borderRadius: 2 }}
          />
          <TextField
            label={t('end_date', language) || "Fin"}
            type="datetime-local"
            size="small"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ background: 'white', borderRadius: 2 }}
          />
          <Button
            variant="outlined"
            onClick={setFullDateRange}
            sx={{
              borderColor: redPalette.light,
              color: redPalette.main,
              fontWeight: 600,
              '&:hover': {
                background: redPalette.faded3,
                borderColor: redPalette.main,
              },
            }}
          >
            {t('full_range', language) || "Plage maximale"}
          </Button>
        </Box>
        {error && <Typography color="error">{error}</Typography>}
        {loading && <Box display="flex" justifyContent="center"><CircularProgress /></Box>}
        {!loading && selectedDepot && depotInfo && (
          <Grid container spacing={3}>
            {/* Gantt uniquement */}
            <Grid item xs={12}>
              <GanttChart depot={selectedDepot} startDate={startDate} endDate={endDate} />
            </Grid>
            {/* Timeline moderne */}
            <Grid item xs={12}>
              <ModernTimeline trains={depotTrains} />
            </Grid>
            {/* Statistiques du dépôt avec icônes */}
            <Grid item xs={12} md={6}>
              <Stack direction="row" spacing={2} mb={2} sx={{ width: '100%' }}>
                <StatCard
                  icon={<TrackIcon fontSize="large" />}
                  label={t('number_of_tracks', language) || "Nombre de voies"}
                  value={depotInfo.nb_voies !== undefined && depotInfo.nb_voies !== null ? depotInfo.nb_voies : <span style={{ opacity: 0.5 }}>?</span>}
                  color={statCardPalette[0].bg}
                  fgColor={statCardPalette[0].fg}
                />
                <StatCard
                  icon={<DirectionsRailwayIcon fontSize="large" />}
                  label={t('number_of_trains', language) || "Nombre de trains"}
                  value={depotTrains.length}
                  color={statCardPalette[1].bg}
                  fgColor={statCardPalette[1].fg}
                />
                <StatCard
                  icon={<HourglassEmptyIcon fontSize="large" />}
                  label={t('number_of_waiting_trains', language) || "Trains en attente"}
                  value={depotTrainsEnAttente.length}
                  color={statCardPalette[2].bg}
                  fgColor={statCardPalette[2].fg}
                />
              </Stack>
              <Box
                p={2}
                border={1}
                borderColor="grey.200"
                borderRadius={3}
                bgcolor="rgba(255,255,255,0.98)"
                boxShadow={2}
              >
                <Typography variant="h6" gutterBottom color={redPalette.main}>
                  {t('depot_stats', language) || "Statistiques détaillées"}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t('depot_name', language) || "Dépôt"} : <b>{selectedDepot}</b>
                </Typography>
              </Box>
            </Grid>
            {/* Liste des trains en attente */}
            <Grid item xs={12} md={6}>
              <Box
                p={2}
                border={1}
                borderColor="grey.200"
                borderRadius={3}
                bgcolor="rgba(255,255,255,0.98)"
                boxShadow={2}
              >
                <Typography variant="h6" gutterBottom color={redPalette.accent}>
                  {t('waiting_trains', language) || "Trains en attente"}
                </Typography>
                {depotTrainsEnAttente.length === 0 ? (
                  <Typography color="textSecondary">{t('no_waiting_trains', language) || "Aucun train en attente"}</Typography>
                ) : (
                  depotTrainsEnAttente.map(train => (
                    <Tooltip
                      key={train.id}
                      title={
                        <Box>
                          <Typography variant="subtitle2">{train.nom}</Typography>
                          <Typography variant="body2">{t(train.type, language)}</Typography>
                          <Typography variant="body2">{t('length', language)}: {train.longueur} m</Typography>
                        </Box>
                      }
                      arrow
                    >
                      <Chip
                        label={`${train.nom} (${t(train.type, language)})`}
                        sx={{
                          mr: 1,
                          mb: 1,
                          bgcolor: getColorForType(train.type),
                          color: "#fff",
                          fontWeight: 500,
                          borderRadius: 2,
                          boxShadow: 1,
                          '&:hover': {
                            filter: 'brightness(1.15)',
                            boxShadow: '0 2px 8px #b71c1c33',
                          },
                        }}
                      />
                    </Tooltip>
                  ))
                )}
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default DepotView;