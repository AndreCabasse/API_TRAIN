import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  Toolbar,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import { red, blue } from '@mui/material/colors';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { trainApi } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import MapIcon from '@mui/icons-material/Map';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import TrainIcon from '@mui/icons-material/Train';

// Fix pour les icônes Leaflet par défaut (utilisation des URLs CDN)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Depot {
  depot: string;
  lat: number;
  lon: number;
}

const FlyToDepot: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(position, 10, { duration: 1.2 });
  }, [position, map]);
  return null;
};

// Fonction utilitaire pour placer les trains en cercle autour du dépôt
function getTrainPosition(
  depotLat: number,
  depotLon: number,
  index: number,
  total: number
): [number, number] {
  const radius = 0.01; // ~1km
  const angle = (2 * Math.PI * index) / total;
  const lat = depotLat + radius * Math.cos(angle);
  const lon = depotLon + radius * Math.sin(angle);
  return [lat, lon];
}

const MapView: React.FC = () => {
  const { language } = useLanguage();
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>('');
  const [depotInfo, setDepotInfo] = useState<any>(null);
  const [allTrains, setAllTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadDepots();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedDepot && !showAll) {
      loadDepotInfo(selectedDepot);
    }
    // eslint-disable-next-line
  }, [selectedDepot, showAll]);

  useEffect(() => {
    if (showAll) {
      loadAllTrains();
    }
    // eslint-disable-next-line
  }, [showAll]);

  const loadDepots = async () => {
    try {
      setLoading(true);
      const data = await trainApi.getDepots();
      setDepots(data);
      if (data.length > 0) {
        setSelectedDepot(data[0].depot);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des dépôts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepotInfo = async (depotName: string) => {
    try {
      setLoading(true);
      const info = await trainApi.getDepotInfo(depotName);
      setDepotInfo(info);
    } catch (error) {
      console.error('Erreur lors du chargement des infos du dépôt:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charge tous les trains de tous les dépôts pour l'affichage global
  const loadAllTrains = async () => {
    try {
      setLoading(true);
      const allTrainsArr: any[] = [];
      for (const depot of depots) {
        const info = await trainApi.getDepotInfo(depot.depot);
        if (info && info.trains) {
          info.trains.forEach((train: any, idx: number) => {
            allTrainsArr.push({
              ...train,
              depotLat: depot.lat,
              depotLon: depot.lon,
              depotName: depot.depot,
              idx,
              total: info.trains.length
            });
          });
        }
      }
      setAllTrains(allTrainsArr);
    } catch (error) {
      console.error('Erreur lors du chargement de tous les trains:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }
  if (!depots.length) return <div>Aucun dépôt géolocalisé</div>;

  const center = [
    depots.reduce((sum, d) => sum + d.lat, 0) / depots.length,
    depots.reduce((sum, d) => sum + d.lon, 0) / depots.length,
  ] as [number, number];

  const selectedDepotObj = depots.find((d) => d.depot === selectedDepot);
  const selectedPosition: [number, number] = selectedDepotObj
    ? [selectedDepotObj.lat, selectedDepotObj.lon]
    : center;

  // Icônes personnalisées pour les trains
  const electricTrainIcon = new L.Icon({
    iconUrl: '/Train.png',
    iconSize: [20, 20],
    iconAnchor: [16, 32],
    className: 'electric-train-icon'
  });
  const dieselTrainIcon = new L.Icon({
    iconUrl: '/Train.png',
    iconSize: [20, 20],
    iconAnchor: [16, 32],
    className: 'diesel-train-icon'
  });
  // Icône personnalisée BLEUE et plus grande pour les dépôts
  const depotIcon = new L.Icon({
    iconUrl: '/building.svg', // Place ton SVG ou PNG dans le dossier public/
    iconSize: [38, 38],    // Ajuste la taille selon ton image
    iconAnchor: [19, 38],  // Centre l’icône sur la pointe
    className: 'depot-marker-custom',
  });

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          gutterBottom
          sx={{ color: red[700], fontWeight: 700 }}
        >
          {t('depot_map', language) || "Carte des dépôts"}
        </Typography>

        {/* Légende */}
        <Box mb={2}>
          <Card sx={{ p: 1.5, borderRadius: 2, background: red[50], display: 'inline-block', boxShadow: 1 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <TrainIcon sx={{ color: blue[700], fontSize: 28 }} />
                <Typography variant="body2">{t('depots', language) || "Dépôt"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <img src="/Train.png" alt="Train" width={22} style={{ filter: 'grayscale(0%)' }} />
                <Typography variant="body2">{t('trains', language) || "Train"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <FlashOnIcon sx={{ color: red[400], fontSize: 20 }} />
                <Typography variant="body2">{t('electric_train_short', language) || "Électrique"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip size="small" label={t('waiting', language) || "En attente"} sx={{ background: red[100], color: red[700] }} />
                <Typography variant="body2">{t('waiting', language) || "En attente"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip size="small" label={t('placed', language) || "En place"} sx={{ background: red[200], color: red[900] }} />
                <Typography variant="body2">{t('placed', language) || "En place"}</Typography>
              </Box>
            </Stack>
          </Card>
        </Box>

        <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          {/* Carte */}
          <Box flex={2} minWidth={0} sx={{ position: 'relative' }}>
            {/* Boutons de recentrage et vue globale */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 1 }}>
              <Tooltip title={t('center_on_depot', language) || "Recentrer sur le dépôt"}>
                <IconButton
                  sx={{
                    background: red[100],
                    color: red[700],
                    '&:hover': { background: red[200] }
                  }}
                  onClick={() => setMapKey((k) => k + 1)}
                  disabled={showAll}
                >
                  <CenterFocusStrongIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('show_all_trains', language) || "Voir tous les trains"}>
                <IconButton
                  sx={{
                    background: showAll ? red[200] : red[50],
                    color: red[700],
                    '&:hover': { background: red[100] }
                  }}
                  onClick={() => setShowAll((v) => !v)}
                >
                  <MapIcon />
                </IconButton>
              </Tooltip>
            </Box>
            <Card
              sx={{
                border: `2px solid ${red[500]}`,
                boxShadow: 6,
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ background: red[50] }}>
                <MapContainer
                  key={mapKey}
                  center={showAll ? center : selectedPosition}
                  zoom={showAll ? 6 : 10}
                  style={{
                    height: 500,
                    width: '100%',
                    borderRadius: 12,
                    border: `2px solid ${red[200]}`,
                    boxShadow: '0 4px 24px rgba(200,0,0,0.08)',
                  }}
                >
                  {/* FlyTo sur le dépôt sélectionné */}
                  {!showAll && selectedDepot && (
                    <FlyToDepot position={selectedPosition} />
                  )}
                  <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
                  {/* Dépôts en BLEU et plus gros */}
                  {depots.map((depot) => (
                    <Marker
                      key={depot.depot}
                      position={[depot.lat, depot.lon]}
                      icon={depotIcon}
                    >
                      <Popup>
                        <b style={{ color: blue[700] }}>{depot.depot}</b>
                        <br />
                        <span style={{ color: blue[400] }}>
                          {t('track', language)}s: {depotInfo && depotInfo.depot === depot.depot ? depotInfo.numeros_voies.join(', ') : ''}
                        </span>
                      </Popup>
                    </Marker>
                  ))}
                  {/* Affichage de tous les trains en même temps si showAll */}
                  {showAll
                    ? allTrains.map((train, idx) => {
                        const position: [number, number] =
                          train.lat && train.lon
                            ? [train.lat, train.lon]
                            : getTrainPosition(train.depotLat, train.depotLon, train.idx, train.total);
                        return (
                          <Marker
                            key={`train-${train.id}-all`}
                            position={position}
                            icon={train.electrique ? electricTrainIcon : dieselTrainIcon}
                          >
                            <Popup>
                              <b>{train.nom}</b>
                              <br />
                              {t(train.type, language)}
                              <br />
                              {train.voie ? `${t('track', language)}: ${train.voie}` : t('waiting', language)}
                              <br />
                              {train.arrivee && (
                                <>
                                  {t('arrival_time', language)}:{" "}
                                  {new Date(train.arrivee).toLocaleString(language)}
                                  <br />
                                </>
                              )}
                              {train.depart && (
                                <>
                                  {t('departure_time', language)}:{" "}
                                  {new Date(train.depart).toLocaleString(language)}
                                </>
                              )}
                              <br />
                              <span style={{ color: blue[700] }}>{train.depotName}</span>
                            </Popup>
                          </Marker>
                        );
                      })
                    : depotInfo && selectedDepotObj && depotInfo.trains && depotInfo.trains.length > 0 &&
                      depotInfo.trains.map((train: any, idx: number) => {
                        const position: [number, number] =
                          train.lat && train.lon
                            ? [train.lat, train.lon]
                            : getTrainPosition(selectedDepotObj.lat, selectedDepotObj.lon, idx, depotInfo.trains.length);
                        return (
                          <Marker
                            key={`train-${train.id}`}
                            position={position}
                            icon={train.electrique ? electricTrainIcon : dieselTrainIcon}
                          >
                            <Popup>
                              <b>{train.nom}</b>
                              <br />
                              {t(train.type, language)}
                              <br />
                              {train.voie ? `${t('track', language)}: ${train.voie}` : t('waiting', language)}
                              <br />
                              {train.arrivee && (
                                <>
                                  {t('arrival_time', language)}:{" "}
                                  {new Date(train.arrivee).toLocaleString(language)}
                                  <br />
                                </>
                              )}
                              {train.depart && (
                                <>
                                  {t('departure_time', language)}:{" "}
                                  {new Date(train.depart).toLocaleString(language)}
                                </>
                              )}
                            </Popup>
                          </Marker>
                        );
                      })}
                </MapContainer>
              </CardContent>
            </Card>
          </Box>

          {/* Informations du dépôt */}
          {!showAll && (
            <Box flex={1} minWidth={320}>
              <Card
                sx={{
                  border: `2px solid ${red[500]}`,
                  borderRadius: 3,
                  boxShadow: 4,
                }}
              >
                <CardContent sx={{ background: red[50] }}>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel
                      sx={{
                        color: red[700],
                        pl: 1.5,
                        background: red[50],
                        borderRadius: 1,
                        mt: '-1px',
                      }}
                    >
                      {t('select_depot', language) || "Sélectionner un dépôt"}
                    </InputLabel>
                    <Select
                      value={selectedDepot}
                      onChange={(e) => setSelectedDepot(e.target.value)}
                      sx={{
                        color: red[800],
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: red[300] },
                      }}
                    >
                      {depots.map((depot) => (
                        <MenuItem key={depot.depot} value={depot.depot}>
                          {depot.depot}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {depotInfo && (
                    <>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ color: red[700] }}
                      >
                        {depotInfo.name || selectedDepot}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="textSecondary"
                        gutterBottom
                      >
                        {t('track', language)}s: {depotInfo.numeros_voies.join(', ')}
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{ mt: 2, mb: 1, color: red[800] }}
                      >
                        {t('trains', language) || "Trains"} ({depotInfo.trains.length})
                      </Typography>

                      {depotInfo.trains.length > 0 ? (
                        <TableContainer
                          component={Paper}
                          sx={{ maxHeight: 300, background: red[50] }}
                        >
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow sx={{ background: red[100] }}>
                                <TableCell sx={{ color: red[700], fontWeight: 700 }}>
                                  {t('train_name', language) || "Nom"}
                                </TableCell>
                                <TableCell sx={{ color: red[700], fontWeight: 700 }}>
                                  {t('train_type', language) || "Type"}
                                </TableCell>
                                <TableCell sx={{ color: red[700], fontWeight: 700 }}>
                                  {t('track', language) || "Voie"}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {depotInfo.trains.map((train: any) => (
                                <TableRow key={train.id} hover>
                                  <TableCell>
                                    {train.electrique && (
                                      <span style={{ marginRight: 4 }}>⚡</span>
                                    )}
                                    {train.nom}
                                    <Chip
                                      label={
                                        train.en_attente
                                          ? t('waiting', language)
                                          : train.voie
                                          ? t('placed', language)
                                          : ''
                                      }
                                      size="small"
                                      color={train.en_attente ? "warning" : "success"}
                                      sx={{
                                        ml: 1,
                                        fontSize: 10,
                                        background: train.en_attente
                                          ? red[100]
                                          : red[200],
                                        color: red[900],
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell>{t(train.type, language)}</TableCell>
                                  <TableCell>
                                    {train.voie !== null
                                      ? train.voie
                                      : t('waiting', language)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography color="textSecondary">
                          {t('no_trains_in_depot', language) ||
                            "Aucun train dans ce dépôt"}
                        </Typography>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </Container>
    </>
  );
};

export default MapView;