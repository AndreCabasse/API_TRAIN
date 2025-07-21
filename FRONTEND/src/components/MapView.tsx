// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
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
  Stack,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { red, blue } from '@mui/material/colors';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimelapseMap from "./TimelapseMap";
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

function getTrainPosition(
  depotLat: number,
  depotLon: number,
  index: number,
  total: number
): [number, number] {
  let radius = 0.01;
  if (total > 10) radius = 0.015;
  if (total > 20) radius = 0.02;
  if (total > 40) radius = 0.03;
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
  const [showTimelapse, setShowTimelapse] = useState(false);

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
      console.error('Error loading depots:', error);
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
      console.error('Error loading depot info:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }
  if (!depots.length) return <div>No geolocated depot found</div>;

  const center = [
    depots.reduce((sum, d) => sum + d.lat, 0) / depots.length,
    depots.reduce((sum, d) => sum + d.lon, 0) / depots.length,
  ] as [number, number];

  const selectedDepotObj = depots.find((d) => d.depot === selectedDepot);
  const selectedPosition: [number, number] = selectedDepotObj
    ? [selectedDepotObj.lat, selectedDepotObj.lon]
    : center;

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
  const depotIcon = new L.Icon({
    iconUrl: '/building.svg',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    className: 'depot-marker-custom',
  });

  // Décalage pour rendre le marker dépôt toujours visible même avec cluster
  const DEPOT_MARKER_OFFSET = 0.00018;

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
        
        <Box mb={2}>
          <Card sx={{ p: 1.5, borderRadius: 2, background: red[50], display: 'inline-block', boxShadow: 1 }}>
            <Stack direction="row" spacing={3} alignItems="center">
              <Box display="flex" alignItems="center" gap={1}>
                <TrainIcon sx={{ color: blue[700], fontSize: 28 }} />
                <Typography variant="body2">{t('depots', language) || "Depot"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <img src="/Train.png" alt="Train" width={22} style={{ filter: 'grayscale(0%)' }} />
                <Typography variant="body2">{t('trains', language) || "Train"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <FlashOnIcon sx={{ color: red[400], fontSize: 20 }} />
                <Typography variant="body2">{t('electric_train_short', language) || "Electric"}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip size="small" label={t('waiting', language) || "Waiting"} sx={{ background: red[100], color: red[700] }} />
                <Typography variant="body2">{t('waiting', language) || "Waiting"}</Typography>
              </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip size="small" label={t('placed', language) || "Placed"} sx={{ background: red[200], color: red[900] }} />
                  <Typography variant="body2">{t('placed', language) || "Placed"}</Typography>
                </Box>
              </Stack>
            </Card>
            <Tooltip title={t('timelapse', language) || "Timelapse"}>
              <IconButton
                sx={{
                  background: showTimelapse ? red[200] : red[50],
                  color: red[700],
                  '&:hover': { background: red[100] },
                  fontSize: 28,
                  ml: 2,
                  height: 48, // pour bien centrer verticalement
                  width: 48
                }}
                onClick={() => setShowTimelapse((v) => !v)}
              >
                <AccessTimeIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>


        {/* Affichage conditionnel : timelapse ou carte classique */}
        {showTimelapse ? (
          <TimelapseMap />
        ) : (
          <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
            <Box flex={2} minWidth={0} sx={{ position: 'relative' }}>
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
                    {!showAll && selectedDepot && (
                      <FlyToDepot position={selectedPosition} />
                    )}
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    {/* Affichage des dépôts et trains */}
                    {showAll ? (
                      <>
                        {depots.map((depot) => {
                          const trains = allTrains.filter(t => t.depotName === depot.depot);
                          // Décalage du marker dépôt si cluster
                          const depotMarkerPos: [number, number] =
                            trains.length > 5
                              ? [depot.lat + DEPOT_MARKER_OFFSET, depot.lon]
                              : [depot.lat, depot.lon];
                          return (
                            <React.Fragment key={`depot-group-${depot.depot}`}>
                              {/* Dépôt toujours visible */}
                              <Marker
                                key={`depot-${depot.depot}`}
                                position={depotMarkerPos}
                                icon={depotIcon}
                                zIndexOffset={1000}
                              >
                                <Popup>
                                  <b style={{ color: blue[700] }}>{depot.depot}</b>
                                </Popup>
                                {/* Badge nombre de trains */}
                                <LeafletTooltip
                                  direction="top"
                                  offset={[0, -38]}
                                  permanent
                                  className="depot-train-count-tooltip"
                                >
                                  <span
                                    style={{
                                      background: red[700],
                                      color: "#fff",
                                      borderRadius: 12,
                                      padding: "2px 8px",
                                      fontWeight: 700,
                                      fontSize: 13,
                                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                                    }}
                                  >
                                    {trains.length}
                                  </span>
                                </LeafletTooltip>
                              </Marker>
                              {trains.length > 5 && (
                                <Marker
                                  key={`cluster-${depot.depot}`}
                                  position={[depot.lat, depot.lon]}
                                  icon={L.divIcon({
                                    className: 'custom-cluster-icon',
                                    html: `<div class="custom-cluster-icon-inner">${trains.length}</div>`,
                                    iconSize: [38, 38],
                                    iconAnchor: [19, 38],
                                  })}
                                  zIndexOffset={500}
                                >
                                  <Popup minWidth={220} maxWidth={320}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: red[700] }}>
                                      {t('trains', language)} ({trains.length})
                                    </Typography>
                                    <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                                      <List dense>
                                        {trains.map((train: any) => (
                                          <ListItem key={train.id} sx={{ p: 0.5 }}>
                                            <ListItemText
                                              primary={
                                                <>
                                                  {train.electrique && <span style={{ marginRight: 4 }}>⚡</span>}
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
                                                </>
                                              }
                                              secondary={
                                                <>
                                                  {t(train.type, language)} — {train.voie !== null ? `${t('track', language)} ${train.voie}` : t('waiting', language)}
                                                </>
                                              }
                                            />
                                          </ListItem>
                                        ))}
                                      </List>
                                    </Box>
                                  </Popup>
                                  <LeafletTooltip direction="top" offset={[0, -10]}>
                                    {t('trains', language)}: {trains.length}
                                  </LeafletTooltip>
                                </Marker>
                              )}
                              {trains.length <= 5 &&
                                trains.map((train: any, idx: number) => {
                                  const position: [number, number] =
                                    train.lat && train.lon
                                      ? [train.lat, train.lon]
                                      : getTrainPosition(depot.lat, depot.lon, idx, trains.length);
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
                                      <LeafletTooltip direction="top" offset={[0, -10]}>{train.nom}</LeafletTooltip>
                                    </Marker>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                      </>
                    ) : (
                      depotInfo && selectedDepotObj && depotInfo.trains && depotInfo.trains.length > 0 && (
                        <>
                          {/* Dépôt toujours visible, même avec cluster */}
                          <Marker
                            key={`depot-${selectedDepotObj.depot}`}
                            position={
                              depotInfo.trains.length > 4
                                ? [selectedDepotObj.lat + DEPOT_MARKER_OFFSET, selectedDepotObj.lon]
                                : [selectedDepotObj.lat, selectedDepotObj.lon]
                            }
                            icon={depotIcon}
                            zIndexOffset={1000}
                          >
                            <Popup>
                              <b style={{ color: blue[700] }}>{selectedDepotObj.depot}</b>
                              <br />
                              <span style={{ color: blue[400] }}>
                                {t('track', language)}s: {depotInfo.numeros_voies.join(', ')}
                              </span>
                            </Popup>
                            {/* Badge nombre de trains */}
                            <LeafletTooltip
                              direction="top"
                              offset={[0, -38]}
                              permanent
                              className="depot-train-count-tooltip"
                            >
                              <span
                                style={{
                                  background: red[700],
                                  color: "#fff",
                                  borderRadius: 12,
                                  padding: "2px 8px",
                                  fontWeight: 700,
                                  fontSize: 13,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                                }}
                              >
                                {depotInfo.trains.length}
                              </span>
                            </LeafletTooltip>
                          </Marker>
                          {depotInfo.trains.length > 4 ? (
                            <>
                              {/* Cluster marker */}
                              <Marker
                                key={`cluster-${selectedDepotObj.depot}`}
                                position={[selectedDepotObj.lat, selectedDepotObj.lon]}
                                icon={L.divIcon({
                                  className: 'custom-cluster-icon',
                                  html: `<div class="custom-cluster-icon-inner">${depotInfo.trains.length}</div>`,
                                  iconSize: [38, 38],
                                  iconAnchor: [19, 38],
                                })}
                                zIndexOffset={500}
                              >
                                <Popup minWidth={220} maxWidth={320}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: red[700] }}>
                                    {t('trains', language)} ({depotInfo.trains.length})
                                  </Typography>
                                  <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
                                    <List dense>
                                      {depotInfo.trains.map((train: any) => (
                                        <ListItem key={train.id} sx={{ p: 0.5 }}>
                                          <ListItemText
                                            primary={
                                              <>
                                                {train.electrique && <span style={{ marginRight: 4 }}>⚡</span>}
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
                                              </>
                                            }
                                            secondary={
                                              <>
                                                {t(train.type, language)} — {train.voie !== null ? `${t('track', language)} ${train.voie}` : t('waiting', language)}
                                              </>
                                            }
                                          />
                                        </ListItem>
                                      ))}
                                    </List>
                                  </Box>
                                </Popup>
                                <LeafletTooltip direction="top" offset={[0, -10]}>
                                  {t('trains', language)}: {depotInfo.trains.length}
                                </LeafletTooltip>
                              </Marker>
                            </>
                          ) : (
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
                                  <LeafletTooltip direction="top" offset={[0, -10]}>{train.nom}</LeafletTooltip>
                                </Marker>
                              );
                            })
                          )}
                        </>
                      )
                    )}
                  </MapContainer>
                </CardContent>
              </Card>
            </Box>

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

                        {depotInfo.trains.length > 20 ? (
                          <Box sx={{ maxHeight: 300, overflowY: 'auto', background: red[50], borderRadius: 2 }}>
                            <List dense>
                              {depotInfo.trains.map((train: any) => (
                                <ListItem key={train.id}>
                                  <ListItemText
                                    primary={
                                      <>
                                        {train.electrique && <span style={{ marginRight: 4 }}>⚡</span>}
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
                                      </>
                                    }
                                    secondary={
                                      <>
                                        {t(train.type, language)} — {train.voie !== null ? `${t('track', language)} ${train.voie}` : t('waiting', language)}
                                      </>
                                    }
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        ) : depotInfo.trains.length > 0 ? (
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
        )}
      </Container>
      {/* Astuce CSS pour le badge sur le marker dépôt */}
      <style>
        {`
        .leaflet-tooltip.depot-train-count-tooltip {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0;
        }
        `}
      </style>
    </>
  );
};

export default MapView;
