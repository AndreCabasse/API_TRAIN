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

// Fix for default Leaflet marker icons (using CDN URLs)
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Depot interface for type safety
interface Depot {
  depot: string;
  lat: number;
  lon: number;
}

/**
 * Component to animate the map view to a given position.
 * Used to center the map on a selected depot.
 */
const FlyToDepot: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  React.useEffect(() => {
    map.flyTo(position, 10, { duration: 1.2 });
  }, [position, map]);
  return null;
};

/**
 * Utility function to arrange trains in a circle around the depot marker.
 * This prevents marker overlap when multiple trains are at the same depot.
 */
function getTrainPosition(
  depotLat: number,
  depotLon: number,
  index: number,
  total: number
): [number, number] {
  const radius = 0.01; // ~1km radius for train markers
  const angle = (2 * Math.PI * index) / total;
  const lat = depotLat + radius * Math.cos(angle);
  const lon = depotLon + radius * Math.sin(angle);
  return [lat, lon];
}

/**
 * Main MapView component.
 * Displays a map with depot locations and train positions.
 * Allows switching between a single depot view and a global view of all trains.
 * Shows depot and train details, and provides a legend for map symbols.
 */
const MapView: React.FC = () => {
  const { language } = useLanguage();
  const [depots, setDepots] = useState<Depot[]>([]);
  const [selectedDepot, setSelectedDepot] = useState<string>('');
  const [depotInfo, setDepotInfo] = useState<any>(null);
  const [allTrains, setAllTrains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapKey, setMapKey] = useState(0); // Used to force map rerender
  const [showAll, setShowAll] = useState(false); // Toggle between single depot and global view

  // Load depot list on mount
  useEffect(() => {
    loadDepots();
    // eslint-disable-next-line
  }, []);

  // Load info for selected depot when changed (unless in global view)
  useEffect(() => {
    if (selectedDepot && !showAll) {
      loadDepotInfo(selectedDepot);
    }
    // eslint-disable-next-line
  }, [selectedDepot, showAll]);

  // Load all trains for all depots when switching to global view
  useEffect(() => {
    if (showAll) {
      loadAllTrains();
    }
    // eslint-disable-next-line
  }, [showAll]);

  /**
   * Fetch the list of depots from the API.
   * Sets the first depot as selected by default.
   */
  const loadDepots = async () => {
    try {
      setLoading(true);
      const data = await trainApi.getDepots();
      setDepots(data);
      if (data.length > 0) {
        setSelectedDepot(data[0].depot);
      }
    } catch (error) {
      console.error('Error loading depots:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch detailed info for a specific depot, including its trains.
   */
  const loadDepotInfo = async (depotName: string) => {
    try {
      setLoading(true);
      const info = await trainApi.getDepotInfo(depotName);
      setDepotInfo(info);
    } catch (error) {
      console.error('Error loading depot info:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch all trains for all depots for the global map view.
   * Each train is associated with its depot's coordinates.
   */
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
      console.error('Error loading all trains:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while fetching data
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }
  // Show message if no depots are available
  if (!depots.length) return <div>No geolocated depot found</div>;

  // Compute the map center as the average of all depot coordinates
  const center = [
    depots.reduce((sum, d) => sum + d.lat, 0) / depots.length,
    depots.reduce((sum, d) => sum + d.lon, 0) / depots.length,
  ] as [number, number];

  // Find the selected depot object for coordinates
  const selectedDepotObj = depots.find((d) => d.depot === selectedDepot);
  const selectedPosition: [number, number] = selectedDepotObj
    ? [selectedDepotObj.lat, selectedDepotObj.lon]
    : center;

  // Custom icons for train and depot markers
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
  // Custom blue, larger icon for depots
  const depotIcon = new L.Icon({
    iconUrl: '/building.svg', // Place your SVG or PNG in the public/ folder
    iconSize: [38, 38],
    iconAnchor: [19, 38],
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
          {t('depot_map', language) || "Depot map"}
        </Typography>

        {/* Legend for map symbols */}
        <Box mb={2}>
          <Card sx={{ p: 1.5, borderRadius: 2, background: red[50], display: 'inline-block', boxShadow: 1 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              {/* Depot legend */}
              <Box display="flex" alignItems="center" gap={1}>
                <TrainIcon sx={{ color: blue[700], fontSize: 28 }} />
                <Typography variant="body2">{t('depots', language) || "Depot"}</Typography>
              </Box>
              {/* Train legend */}
              <Box display="flex" alignItems="center" gap={1}>
                <img src="/Train.png" alt="Train" width={22} style={{ filter: 'grayscale(0%)' }} />
                <Typography variant="body2">{t('trains', language) || "Train"}</Typography>
              </Box>
              {/* Electric train legend */}
              <Box display="flex" alignItems="center" gap={1}>
                <FlashOnIcon sx={{ color: red[400], fontSize: 20 }} />
                <Typography variant="body2">{t('electric_train_short', language) || "Electric"}</Typography>
              </Box>
              {/* Waiting train legend */}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip size="small" label={t('waiting', language) || "Waiting"} sx={{ background: red[100], color: red[700] }} />
                <Typography variant="body2">{t('waiting', language) || "Waiting"}</Typography>
              </Box>
              {/* Placed train legend */}
              <Box display="flex" alignItems="center" gap={1}>
                <Chip size="small" label={t('placed', language) || "Placed"} sx={{ background: red[200], color: red[900] }} />
                <Typography variant="body2">{t('placed', language) || "Placed"}</Typography>
              </Box>
            </Stack>
          </Card>
        </Box>

        <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          {/* Map section */}
          <Box flex={2} minWidth={0} sx={{ position: 'relative' }}>
            {/* Buttons for recentering and toggling global view */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000, display: 'flex', gap: 1 }}>
              <Tooltip title={t('center_on_depot', language) || "Center on depot"}>
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
              <Tooltip title={t('show_all_trains', language) || "Show all trains"}>
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
                  {/* Animate map to selected depot */}
                  {!showAll && selectedDepot && (
                    <FlyToDepot position={selectedPosition} />
                  )}
                  {/* OpenStreetMap tile layer */}
                  <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
                  {/* Render depot markers (large blue icons) */}
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
                  {/* Show all trains on the map if global view is enabled */}
                  {showAll
                    ? allTrains.map((train, idx) => {
                        // Compute train marker position (circle around depot if no lat/lon)
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
                    // Show only trains for the selected depot
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

          {/* Depot information panel (hidden in global view) */}
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
                  {/* Depot selection dropdown */}
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
                      {t('select_depot', language) || "Select a depot"}
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

                  {/* Depot details and train list */}
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

                      {/* Table of trains in the depot */}
                      {depotInfo.trains.length > 0 ? (
                        <TableContainer
                          component={Paper}
                          sx={{ maxHeight: 300, background: red[50] }}
                        >
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow sx={{ background: red[100] }}>
                                <TableCell sx={{ color: red[700], fontWeight: 700 }}>
                                  {t('train_name', language) || "Name"}
                                </TableCell>
                                <TableCell sx={{ color: red[700], fontWeight: 700 }}>
                                  {t('train_type', language) || "Type"}
                                </TableCell>
                                <TableCell sx={{ color: red[700], fontWeight: 700 }}>
                                  {t('track', language) || "Track"}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {depotInfo.trains.map((train: any) => (
                                <TableRow key={train.id} hover>
                                  <TableCell>
                                    {/* Electric icon if train is electric */}
                                    {train.electrique && (
                                      <span style={{ marginRight: 4 }}>⚡</span>
                                    )}
                                    {train.nom}
                                    {/* Status chip: waiting or placed */}
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
                            "No trains in this depot"}
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