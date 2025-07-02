import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Toolbar,
  Chip,
  Tooltip,
  Button
} from '@mui/material';
import {
  Train as TrainIcon,
  Schedule as ScheduleIcon,
  ShowChart as ChartIcon,
  Speed as SpeedIcon,
  FlashOn as FlashOnIcon,
  LocationOn as LocationOnIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { trainApi } from '../services/api';
import { Train, Statistics } from '../types';

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

const Dashboard: React.FC = () => {
  const { language } = useLanguage();
  const [trains, setTrains] = useState<Train[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trainsData, statsData] = await Promise.all([
        trainApi.getTrains(),
        trainApi.getStatistics()
      ]);
      setTrains(trainsData);
      setStatistics(statsData);
    } catch (err) {
      setError(t('error_loading_data', language) || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const waitingTrains = trains.filter(train => train.en_attente);
  const placedTrains = trains.filter(train => !train.en_attente);

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
          minHeight: 700,
        }}
      >
        {/* Carte d'accueil moderne */}
        <Box
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(90deg, #fff 60%, ${redPalette.lighter} 100%)`,
            boxShadow: 2,
            display: "flex",
            alignItems: "center",
            gap: 3,
            animation: "fadeInUp 0.7s",
            border: `1px solid ${redPalette.faded}`,
          }}
        >
          <TrainIcon sx={{ fontSize: 56, color: redPalette.main }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: redPalette.main, letterSpacing: 1 }}>
              {t('dashboard', language)}
            </Typography>
          </Box>
          <Box flexGrow={1} />
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{
              borderColor: redPalette.main,
              color: redPalette.main,
              background: redPalette.faded3,
              '&:hover': { borderColor: redPalette.dark, background: redPalette.lighter }
            }}
          >
            {t('refresh', language)}
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Statistiques principales */}
          <Grid item xs={12} sm={6} md={3} sx={{ animation: "fadeInUp 0.7s" }}>
            <Card
              sx={{
                background: `linear-gradient(120deg, #fff 70%, ${redPalette.faded2} 100%)`,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
                borderLeft: `6px solid ${redPalette.main}`,
                borderTop: `2px solid ${redPalette.lighter}`,
                backdropFilter: "blur(6px)",
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.04)',
                  boxShadow: 10,
                  background: `linear-gradient(120deg, #fff 60%, ${redPalette.faded} 100%)`,
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <TrainIcon sx={{ mr: 2, fontSize: 44, color: redPalette.main, filter: "drop-shadow(0 2px 8px #d32f2f33)" }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {t('train_list', language)}
                    </Typography>
                    <Typography variant="h4" sx={{ color: redPalette.dark, fontWeight: 700 }}>
                      {statistics?.total_trains || trains.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{ animation: "fadeInUp 0.8s" }}>
            <Card
              sx={{
                background: `linear-gradient(120deg, #fff 70%, ${redPalette.faded} 100%)`,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
                borderLeft: `6px solid ${redPalette.accent}`,
                borderTop: `2px solid ${redPalette.lighter}`,
                backdropFilter: "blur(6px)",
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.04)',
                  boxShadow: 10,
                  background: `linear-gradient(120deg, #fff 60%, ${redPalette.lighter} 100%)`,
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ScheduleIcon sx={{ mr: 2, fontSize: 44, color: redPalette.accent, filter: "drop-shadow(0 2px 8px #ff174433)" }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {t('waiting_trains', language)}
                    </Typography>
                    <Typography variant="h4" sx={{ color: redPalette.accent, fontWeight: 700 }}>
                      {waitingTrains.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{ animation: "fadeInUp 0.9s" }}>
            <Card
              sx={{
                background: `linear-gradient(120deg, #fff 70%, ${redPalette.faded3} 100%)`,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
                borderLeft: `6px solid ${redPalette.dark}`,
                borderTop: `2px solid ${redPalette.lighter}`,
                backdropFilter: "blur(6px)",
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.04)',
                  boxShadow: 10,
                  background: `linear-gradient(120deg, #fff 60%, ${redPalette.faded2} 100%)`,
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ChartIcon sx={{ mr: 2, fontSize: 44, color: redPalette.dark, filter: "drop-shadow(0 2px 8px #9a000733)" }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {t('average_wait', language)}
                    </Typography>
                    <Typography variant="h4" sx={{ color: redPalette.dark, fontWeight: 700 }}>
                      {statistics?.temps_moyen_attente?.toFixed(1) || 0} {t('minutes', language)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3} sx={{ animation: "fadeInUp 1s" }}>
            <Card
              sx={{
                background: `linear-gradient(120deg, #fff 70%, ${redPalette.lighter} 100%)`,
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.10)",
                borderLeft: `6px solid ${redPalette.main}`,
                borderTop: `2px solid ${redPalette.faded}`,
                backdropFilter: "blur(6px)",
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.04)',
                  boxShadow: 10,
                  background: `linear-gradient(120deg, #fff 60%, ${redPalette.faded3} 100%)`,
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center">
                  <SpeedIcon sx={{ mr: 2, fontSize: 44, color: redPalette.main, filter: "drop-shadow(0 2px 8px #d32f2f33)" }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {t('occupancy_rate', language)}
                    </Typography>
                    <Typography variant="h4" sx={{ color: redPalette.main, fontWeight: 700 }}>
                      {statistics?.taux_occupation_global?.toFixed(1) || 0}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Tableau des trains placés */}
          <Grid item xs={12} sx={{ animation: "fadeInUp 1.1s" }}>
            <Card
              sx={{
                background: "rgba(255,255,255,0.95)",
                boxShadow: 3,
                borderRadius: 3,
                border: `1px solid ${redPalette.lighter}`,
                overflow: "hidden",
                p: 1.5,
              }}
            >
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6" gutterBottom sx={{ color: redPalette.main, fontWeight: 700, mb: 2 }}>
                  {t('placed_trains', language)}
                </Typography>
                {placedTrains.length > 0 ? (
                  <TableContainer
                    component={Paper}
                    sx={{
                      maxHeight: 320,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.85)",
                      boxShadow: "0 2px 12px 0 rgba(255,23,68,0.04)",
                      border: `1px solid ${redPalette.faded2}`,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ background: redPalette.lighter }}>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('train_name', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('train_type', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('track', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('depot', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('length', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('arrival_time', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('departure_time', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.main, fontWeight: 700, border: 0 }}>{t('electric_train', language)}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {placedTrains.map((train) => (
                          <TableRow
                            key={train.id}
                            hover
                            sx={{
                              transition: "background 0.2s",
                              '&:hover': { background: redPalette.faded2 },
                              borderBottom: `1px solid ${redPalette.faded3}`,
                            }}
                          >
                            <TableCell>
                              <Tooltip title={train.nom}>
                                <span style={{ display: "flex", alignItems: "center" }}>
                                  {train.electrique && <FlashOnIcon sx={{ fontSize: 16, color: redPalette.accent, mr: 0.5 }} />}
                                  <Typography component="span" sx={{ fontWeight: 600 }}>
                                    {train.nom}
                                  </Typography>
                                  {train.en_attente && (
                                    <Chip
                                      label={t('waiting', language)}
                                      sx={{
                                        background: redPalette.accent,
                                        color: '#fff',
                                        ml: 1,
                                        fontSize: 10,
                                        height: 20,
                                        px: 0.5,
                                        borderRadius: 1,
                                      }}
                                      size="small"
                                    />
                                  )}
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={t(train.type, language)}
                                size="small"
                                sx={{
                                  background: train.type === "testing" ? redPalette.light :
                                    train.type === "pit" ? redPalette.main :
                                      train.type === "passenger" ? "#388e3c" : "#1976d2",
                                  color: "#fff",
                                  fontWeight: 600,
                                  fontSize: 12,
                                  px: 1,
                                  borderRadius: 1,
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.voie !== null ? train.voie : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.depot}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.longueur} {t('meters', language)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {new Date(train.arrivee).toLocaleString(language)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {new Date(train.depart).toLocaleString(language)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.electrique ? t('yes', language) : t('no', language)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Box display="flex" alignItems="center" justifyContent="center" minHeight={80}>
                    <Typography color="textSecondary" sx={{ fontStyle: "italic" }}>
                      {t('no_placed_trains', language)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Trains en attente */}
          {waitingTrains.length > 0 && (
            <Grid item xs={12} sx={{ animation: "fadeInUp 1.2s" }}>
              <Card
                sx={{
                  background: redPalette.faded3,
                  boxShadow: 3,
                  borderRadius: 3,
                  border: `1px solid ${redPalette.lighter}`,
                  overflow: "hidden",
                  p: 1.5,
                }}
              >
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: redPalette.accent, fontWeight: 700, mb: 2 }}>
                    {t('waiting_trains', language)}
                  </Typography>
                  <TableContainer
                    component={Paper}
                    sx={{
                      maxHeight: 200,
                      borderRadius: 2,
                      background: "rgba(255,255,255,0.85)",
                      boxShadow: "0 2px 12px 0 rgba(255,23,68,0.04)",
                      border: `1px solid ${redPalette.faded2}`,
                    }}
                  >
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow sx={{ background: redPalette.lighter }}>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('train_name', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('depot', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('length', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('arrival_time', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('departure_time', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('wait_start', language)}</TableCell>
                          <TableCell sx={{ color: redPalette.accent, fontWeight: 700, border: 0 }}>{t('wait_end', language)}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {waitingTrains.map((train) => (
                          <TableRow
                            key={train.id}
                            hover
                            sx={{
                              transition: "background 0.2s",
                              '&:hover': { background: redPalette.faded },
                              borderBottom: `1px solid ${redPalette.faded3}`,
                            }}
                          >
                            <TableCell>
                              <Tooltip title={train.nom}>
                                <span style={{ display: "flex", alignItems: "center" }}>
                                  {train.electrique && <FlashOnIcon sx={{ fontSize: 16, color: redPalette.accent, mr: 0.5 }} />}
                                  <Typography component="span" sx={{ fontWeight: 600 }}>
                                    {train.nom}
                                  </Typography>
                                  {train.en_attente && (
                                    <Chip
                                      label={t('waiting', language)}
                                      sx={{
                                        background: redPalette.accent,
                                        color: '#fff',
                                        ml: 1,
                                        fontSize: 10,
                                        height: 20,
                                        px: 0.5,
                                        borderRadius: 1,
                                      }}
                                      size="small"
                                    />
                                  )}
                                </span>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.depot}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.longueur} {t('meters', language)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {new Date(train.arrivee).toLocaleString(language)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {new Date(train.depart).toLocaleString(language)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.debut_attente ? new Date(train.debut_attente).toLocaleString(language) : '-'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 500 }}>
                                {train.fin_attente ? new Date(train.fin_attente).toLocaleString(language) : '-'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Trains électriques */}
          <Grid item xs={12} md={6} sx={{ animation: "fadeInUp 1.3s" }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, #fff 60%, ${redPalette.lighter} 100%)`,
                boxShadow: 4,
                borderLeft: `6px solid ${redPalette.accent}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 8,
                  background: `linear-gradient(135deg, #fff 60%, ${redPalette.faded} 100%)`,
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <FlashOnIcon sx={{ fontSize: 36, color: redPalette.accent, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: redPalette.accent, fontWeight: 700 }}>
                    {t('electric_train', language)}
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ color: redPalette.accent, fontWeight: 700 }}>
                  {statistics?.trains_electriques || trains.filter(t => t.electrique).length}
                </Typography>
                <Typography color="textSecondary">
                  {t('electric_train_count', language)} {statistics?.total_trains || trains.length} {t('total', language)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Répartition par dépôt */}
          <Grid item xs={12} md={6} sx={{ animation: "fadeInUp 1.4s" }}>
            <Card
              sx={{
                background: `linear-gradient(135deg, #fff 60%, ${redPalette.lighter} 100%)`,
                boxShadow: 4,
                borderLeft: `6px solid ${redPalette.main}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'scale(1.03)',
                  boxShadow: 8,
                  background: `linear-gradient(135deg, #fff 60%, ${redPalette.faded2} 100%)`,
                }
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={1}>
                  <LocationOnIcon sx={{ fontSize: 32, color: redPalette.main, mr: 1 }} />
                  <Typography variant="h6" sx={{ color: redPalette.main, fontWeight: 700 }}>
                    {t('depot_distribution', language)}
                  </Typography>
                </Box>
                {statistics?.stats_par_depot && Object.entries(statistics.stats_par_depot).map(([depot, stats]: [string, any]) => (
                  <Box key={depot} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography sx={{ color: redPalette.dark }}>{depot}</Typography>
                    <Typography sx={{ color: redPalette.main, fontWeight: 700 }}>
                      {stats.nb_trains || 0} {t('trains', language)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default Dashboard;