import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Stack,
  //Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  //Tooltip as MuiTooltip,
  //IconButton,
  CircularProgress
} from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { trainApi } from '../services/api';
import { Train, Statistics } from '../types';
import TrainIcon from '@mui/icons-material/Train';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PercentIcon from '@mui/icons-material/Percent';
// import InfoIcon from '@mui/icons-material/Info';
import { Language } from '../types';
import Chip from '@mui/material/Chip';

import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { Tooltip as MuiTooltip } from '@mui/material';

// Palette de rouges nuancés
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

const COLORS = [redPalette.main, redPalette.light, '#FFBB28', '#FF8042', '#8884D8'];



const RequirementsByDayTable: React.FC<{ data: any[]; language: string }> = ({ data, language }) => (
  <TableContainer component={Paper} sx={{ mt: 3, mb: 3 }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>{t('date', language as Language) || 'Date'}</TableCell>
          <TableCell>{t('test_drivers', language as Language) || "Conducteurs d'essai"}</TableCell>
          <TableCell>{t('locomotives', language as Language) || 'Locomotives'}</TableCell>
          <TableCell>{t('details', language as Language) || 'Détails'}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.date}>
            <TableCell>{row.date}</TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" spacing={1}>
                <DirectionsRunIcon sx={{ color: '#1976d2' }} fontSize="small" />
                <b>{row.test_drivers}</b>
                {row.depots_test_drivers && row.depots_test_drivers.length > 0 && (
                  <MuiTooltip
                    title={row.depots_test_drivers.join(', ')}
                    arrow
                  >
                    <Box component="span" sx={{ ml: 1, display: 'flex', flexWrap: 'wrap' }}>
                      {row.depots_test_drivers.map((depot: string, idx: number) => (
                        <Chip
                          key={depot}
                          label={depot}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5, bgcolor: "#e3f2fd", color: "#1976d2", fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  </MuiTooltip>
                )}
              </Stack>
            </TableCell>
            <TableCell>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrainIcon sx={{ color: '#ff9800' }} fontSize="small" />
                <b>{row.locomotives}</b>
                {row.depots_locomotives && row.depots_locomotives.length > 0 && (
                  <MuiTooltip
                    title={row.depots_locomotives.join(', ')}
                    arrow
                  >
                    <Box component="span" sx={{ ml: 1, display: 'flex', flexWrap: 'wrap' }}>
                      {row.depots_locomotives.map((depot: string, idx: number) => (
                        <Chip
                          key={depot}
                          label={depot}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5, bgcolor: "#fff3e0", color: "#ff9800", fontWeight: 600 }}
                        />
                      ))}
                    </Box>
                  </MuiTooltip>
                )}
              </Stack>
            </TableCell>
            <TableCell>
              <Stack direction="row" spacing={2}>
                {row.depots_test_drivers && row.depots_test_drivers.length > 0 && (
                  <MuiTooltip title={row.depots_test_drivers.join(', ')} arrow>
                    <Box display="flex" alignItems="center">
                      <DirectionsRunIcon sx={{ color: '#1976d2', mr: 0.5 }} fontSize="small" />
                      <span style={{ fontWeight: 500 }}>{row.depots_test_drivers.join(', ')}</span>
                    </Box>
                  </MuiTooltip>
                )}
                {row.depots_locomotives && row.depots_locomotives.length > 0 && (
                  <MuiTooltip title={row.depots_locomotives.join(', ')} arrow>
                    <Box display="flex" alignItems="center">
                      <TrainIcon sx={{ color: '#ff9800', mr: 0.5 }} fontSize="small" />
                      <span style={{ fontWeight: 500 }}>{row.depots_locomotives.join(', ')}</span>
                    </Box>
                  </MuiTooltip>
                )}
                {(!row.depots_test_drivers?.length && !row.depots_locomotives?.length) && <span>-</span>}
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
// ----------- Fin tableau détaillé -----------

const StatisticsView: React.FC = () => {
  const { language } = useLanguage();
  const [trains, setTrains] = useState<Train[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [requirementsByDay, setRequirementsByDay] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, [language]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trainsData, statsData, reqByDayData] = await Promise.all([
        trainApi.getTrains(),
        trainApi.getStatistics(),
        trainApi.getRequirements()
      ]);
      setTrains(trainsData);
      setStatistics(statsData);
      setRequirementsByDay(reqByDayData);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques générales
  const totalTrains = statistics?.total_trains ?? trains.length ?? '--';
  const trainsElectriques = statistics?.trains_electriques ?? trains.filter(t => t.electrique).length ?? '--';
  const tempsMoyenAttente = statistics?.temps_moyen_attente !== undefined
    ? statistics.temps_moyen_attente.toFixed(1)
    : '--';
  const tauxOccupationGlobal = statistics?.taux_occupation_global !== undefined
    ? statistics.taux_occupation_global.toFixed(1)
    : '--';

  // Mapping dépôt
  const depotData = statistics?.stats_par_depot && typeof statistics.stats_par_depot === 'object'
    ? Object.entries(statistics.stats_par_depot).map(([name, stats]: [string, any]) => ({
        name,
        trains: stats?.nb_trains ?? 0,
        occupation: stats?.taux_occupation ?? 0
      }))
    : [];

  // Répartition par type
  const typeData = trains.reduce((acc, train) => {
    acc[train.type] = (acc[train.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(typeData).map(([name, value]) => ({
    name: t(name, language),
    value
  }));

  // Répartition par longueur
  const lengthData = trains.reduce((acc, train) => {
    const range = train.longueur < 100 ? '<100m' :
      train.longueur < 200 ? '100-200m' :
      train.longueur < 300 ? '200-300m' : '>300m';
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lengthChartData = Object.entries(lengthData).map(([range, count]) => ({
    range,
    count
  }));

  // Trains électriques
  const electricData = [
    { name: t('electric_train_short', language), value: trains.filter(t => t.electrique).length },
    { name: t('non_electric_train_short', language) || 'Non électrique', value: trains.filter(t => !t.electrique).length }
  ];

  // ----------- Bonus : graphique Requirements By Day -----------
  const requirementsChartData = requirementsByDay.map(row => ({
    date: row.date,
    test_drivers: row.test_drivers,
    locomotives: row.locomotives
  }));

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          mb: 4,
          background: `linear-gradient(120deg, ${redPalette.veryLight} 0%, ${redPalette.lighter} 100%)`,
          borderRadius: 3,
          py: 3,
          boxShadow: 2,
        }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: redPalette.main }}>
          {t('statistics', language)}
        </Typography>

        {/* ----------- Bloc Requirements By Day ----------- */}
        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ color: redPalette.accent }}>
            {t('requirements_by_day', language) || "Besoins par jour (conducteurs d'essai & locomotives)"}
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={requirementsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="test_drivers" stroke={redPalette.main} name={t('test_drivers', language) || "Conducteurs d'essai"} />
              <Line type="monotone" dataKey="locomotives" stroke={redPalette.accent} name={t('locomotives', language) || "Locomotives"} />
            </LineChart>
          </ResponsiveContainer>
          <RequirementsByDayTable data={requirementsByDay} language={language} />
        </Box>
        {/* ----------- Fin Bloc Requirements By Day ----------- */}

        <Grid container spacing={3}>
          {/* Statistiques générales */}
          <Grid item xs={12}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: 4,
              background: `linear-gradient(90deg, ${redPalette.faded2} 0%, ${redPalette.lighter} 100%)`
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: redPalette.main }}>
                  {t('overview', language) || "Vue d'ensemble"}
                </Typography>
                <Stack direction="row" spacing={4} justifyContent="center">
                  <Box textAlign="center">
                    <Avatar sx={{ bgcolor: redPalette.main, width: 56, height: 56, mx: 'auto', mb: 1 }}>
                      <TrainIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" sx={{ color: redPalette.main, fontWeight: 700 }}>
                      {totalTrains}
                    </Typography>
                    <Typography color="textSecondary">{t('total_trains', language) || "Total trains"}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Avatar sx={{ bgcolor: redPalette.light, width: 56, height: 56, mx: 'auto', mb: 1 }}>
                      <ElectricBoltIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" sx={{ color: redPalette.light, fontWeight: 700 }}>
                      {trainsElectriques}
                    </Typography>
                    <Typography color="textSecondary">{t('electric_trains', language) || "Trains électriques"}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Avatar sx={{ bgcolor: redPalette.faded, width: 56, height: 56, mx: 'auto', mb: 1 }}>
                      <AccessTimeIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" sx={{ color: redPalette.accent, fontWeight: 700 }}>
                      {tempsMoyenAttente}
                    </Typography>
                    <Typography color="textSecondary">{t('average_wait', language) || "Temps moyen d'attente (min)"}</Typography>
                  </Box>
                  <Box textAlign="center">
                    <Avatar sx={{ bgcolor: redPalette.faded2, width: 56, height: 56, mx: 'auto', mb: 1 }}>
                      <PercentIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" sx={{ color: redPalette.dark, fontWeight: 700 }}>
                      {tauxOccupationGlobal}%
                    </Typography>
                    <Typography color="textSecondary">{t('occupancy_rate', language) || "Taux d'occupation"}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Répartition par type de train */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, background: redPalette.faded3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: redPalette.main }}>
                  {t('train_type_distribution', language) || "Répartition par type de train"}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill={redPalette.main}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Trains électriques vs non électriques */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, background: redPalette.faded2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: redPalette.accent }}>
                  {t('electric_trains', language) || "Trains électriques"}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={electricData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill={redPalette.accent}
                      dataKey="value"
                    >
                      {electricData.map((entry, index) => (
                        <Cell key={`cell-electric-${index}`} fill={index === 0 ? redPalette.light : redPalette.faded} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Répartition par dépôt */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, background: redPalette.veryLight }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: redPalette.main }}>
                  {t('depot_distribution', language) || "Répartition par dépôt"}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={depotData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="trains" fill={redPalette.main} name={t('number_of_trains', language) || "Nombre de trains"} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Répartition par longueur */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, background: redPalette.faded3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: redPalette.main }}>
                  {t('length_distribution', language) || "Répartition par longueur"}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={lengthChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="count" fill={redPalette.light} name={t('number_of_trains', language) || "Nombre de trains"} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Taux d'occupation par dépôt */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 2, background: redPalette.faded2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ color: redPalette.dark }}>
                  {t('occupancy_rate_by_depot', language) || "Taux d'occupation par dépôt"}
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={depotData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip formatter={(value: any) => [`${value}%`, t('occupancy_rate', language) || "Taux d'occupation"]} />
                    <Legend />
                    <Bar dataKey="occupation" fill={redPalette.accent} name={t('occupancy_rate', language) || "Taux d'occupation (%)"} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default StatisticsView;