import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  IconButton,
  Divider,
  Menu
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { trainApi } from '../services/api';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import TrainIcon from '@mui/icons-material/Train';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

import locoImg from '../assets/Vectron.png';
import wagon1LeftImg from '../assets/wagon_1_left.png';
import wagon1RightImg from '../assets/wagon_1_right.png';
import wagon23LeftImg from '../assets/wagon_2_3_left.png';
import wagon23RightImg from '../assets/wagon_2_3_right.png';
import wagon4LeftImg from '../assets/wagon_4_left.png';
import wagon4RightImg from '../assets/wagon_4_right.png';
import cabcarLeftImg from '../assets/cabcar_left.png';
import cabcarRightImg from '../assets/cabcar_right.png';

const accentPalette = {
  main: '#D32F2F',
  light: '#FF6659',
  dark: '#9A0007',
  background: '#FFF5F5',
  card: '#FFEAEA',
  accent: '#FF1744',
  blue: '#1976d2',
  orange: '#ff9800',
  green: '#43a047'
};

const normalizeDirection = (dir: string) => {
  if (!dir) return 'left';
  const d = dir.toLowerCase();
  if (['right', 'droite', 'højre'].includes(d)) return 'right';
  return 'left';
};

const getElementImage = (element: any) => {
  if (element.type === 'locomotive') return locoImg;
  const direction = normalizeDirection(element.direction || element.sens || 'left');
  switch (element.type_wagon) {
    case '1':
      return direction === 'right' ? wagon1RightImg : wagon1LeftImg;
    case '2':
    case '3':
      return direction === 'right' ? wagon23RightImg : wagon23LeftImg;
    case '4':
      return direction === 'right' ? wagon4RightImg : wagon4LeftImg;
    case 'cabcar':
      return direction === 'right' ? cabcarRightImg : cabcarLeftImg;
    default:
      return direction === 'right' ? wagon1RightImg : wagon1LeftImg;
  }
};

const TRACK_NUMBERS = [7, 8, 9, 11, 12, 13, 14];

const GameView: React.FC = () => {
  const { language } = useLanguage();
  const [gameState, setGameState] = useState<any>({});
  const [selectedTrack, setSelectedTrack] = useState<number>(7);
  const [selectedWagonType, setSelectedWagonType] = useState<string>('1');
  const [selectedDirection, setSelectedDirection] = useState<string>('left');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [trackCount, setTrackCountState] = useState<number>(() => {
    const saved = localStorage.getItem('trackCount');
    return saved ? Number(saved) : 4;
  });
  const [coachDirection, setCoachDirection] = useState<'normal' | 'reverse'>('normal');

  // Pour le menu de déplacement de wagon
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moveMenu, setMoveMenu] = useState<{track: number, idx: number} | null>(null);

  // Pour le drag & drop
  const [dragged, setDragged] = useState<{track: number, idx: number} | null>(null);

  // Synchroniser trackCount avec localStorage
  const setTrackCount = (n: number) => {
    setTrackCountState(n);
    localStorage.setItem('trackCount', String(n));
  };

  // Charger l'état du jeu depuis l'API au montage
  useEffect(() => {
    trainApi.getGameState().then((state) => {
      setGameState(state);
      // Optionnel : setSelectedTrack selon les voies présentes
      const tracks = Object.keys(state);
      if (tracks.length > 0) setSelectedTrack(Number(tracks[0]));
    });
  }, [trackCount]); 

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddWagon = async () => {
    try {
      const result = await trainApi.addWagonToGame(selectedTrack, selectedWagonType, selectedDirection);
      setGameState(result.state);
      showSnackbar(t('wagon_added_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('wagon_add_error', language), 'error');
    }
  };

  const handleAddLocomotive = async () => {
    try {
      const result = await trainApi.addLocomotiveToGame(selectedTrack);
      setGameState(result.state);
      showSnackbar(t('locomotive_added_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('locomotive_add_error', language), 'error');
    }
  };

  // Lors du reset, remettre trackCount à 4 et l'enregistrer
  const handleResetGame = async () => {
    try {
      const result = await trainApi.resetGame();
      setGameState(result.state);
      setTrackCount(4); // <-- reset aussi le nombre de voies
      showSnackbar(t('game_reset', language), 'success');
    } catch (error: any) {
      showSnackbar(t('reset_error', language), 'error');
    }
  };

  const handleRemoveElement = async (trackNumber: number, elementIndex: number) => {
    try {
      const result = await trainApi.deleteElementFromGame(trackNumber, elementIndex);
      setGameState(result.state);
      showSnackbar(t('element_removed_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('element_remove_error', language), 'error');
    }
  };

  const handleMoveElement = async (trackNumber: number, elementIndex: number, direction: 'left' | 'right') => {
    try {
      const result = await trainApi.swapWagonInGame(trackNumber, elementIndex, direction);
      setGameState(result.state);
      showSnackbar(t('element_moved_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('element_move_error', language), 'error');
    }
  };

  const handleMoveWagonToTrack = async (trackFrom: number, wagonIdx: number, trackTo: number) => {
    try {
      const result = await trainApi.moveWagonInGame(trackFrom, wagonIdx, trackTo);
      setGameState(result.state);
      showSnackbar(t('wagon_moved_success', language) || "Wagon déplacé avec succès", 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('wagon_move_error', language) || "Erreur lors du déplacement du wagon", 'error');
    }
  };

  // Ouvre le menu de déplacement
  const handleOpenMoveMenu = (event: React.MouseEvent<HTMLElement>, track: number, idx: number) => {
    setAnchorEl(event.currentTarget);
    setMoveMenu({ track, idx });
  };
  // Ferme le menu de déplacement
  const handleCloseMoveMenu = () => {
    setAnchorEl(null);
    setMoveMenu(null);
  };
  // Sélectionne la voie de destination
  const handleSelectMoveTrack = async (toTrack: number) => {
    if (moveMenu) {
      await handleMoveWagonToTrack(moveMenu.track, moveMenu.idx, toTrack);
      handleCloseMoveMenu();
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (track: number, idx: number) => {
    setDragged({ track, idx });
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = async (toTrack: number) => {
    if (dragged && dragged.track !== toTrack) {
      await handleMoveWagonToTrack(dragged.track, dragged.idx, toTrack);
    }
    setDragged(null);
  };

  const getWagonTypeLabel = (type: string) => {
    switch (type) {
      case '1': return t('wagon_type_1', language) || 'Type 1';
      case '2': return t('wagon_type_2', language) || 'Type 2';
      case '3': return t('wagon_type_3', language) || 'Type 3';
      case '4': return t('wagon_type_4', language) || 'Type 4';
      case 'cabcar': return t('wagon_type_cabcar', language) || 'Cab Car';
      default: return t('wagon', language);
    }
  };

  // Ajout d'une Coach formation complète avec choix du sens
  const handleAddCoachFormation = async () => {
    let formation = [
      { type: 'locomotive' },
      { type: 'wagon', type_wagon: '1', direction: 'right' },
      { type: 'wagon', type_wagon: '2', direction: 'right' },
      { type: 'wagon', type_wagon: '3', direction: 'right' },
      { type: 'wagon', type_wagon: '4', direction: 'left' },
      { type: 'wagon', type_wagon: '3', direction: 'left' },
      { type: 'wagon', type_wagon: '2', direction: 'left' },
      { type: 'wagon', type_wagon: '3', direction: 'left' },
      { type: 'wagon', type_wagon: '2', direction: 'left' },
      { type: 'wagon', type_wagon: '3', direction: 'left' },
      { type: 'wagon', type_wagon: '2', direction: 'left' },
      { type: 'wagon', type_wagon: '3', direction: 'left' },
      { type: 'wagon', type_wagon: '2', direction: 'left' },
      { type: 'wagon', type_wagon: '3', direction: 'left' },
      { type: 'wagon', type_wagon: '2', direction: 'left' },
      { type: 'wagon', type_wagon: '1', direction: 'left' },
      { type: 'locomotive' }
    ];
    if (coachDirection === 'reverse') {
      formation = [...formation].reverse().map(elem => {
        if (elem.type === 'wagon') {
          return {
            type: 'wagon',
            type_wagon: elem.type_wagon as string,
            direction: elem.direction === 'left' ? 'right' : 'left'
          };
        }
        return { type: 'locomotive' };
      });
    }
    try {
      let state = gameState;
      for (const elem of formation) {
        if (elem.type === 'locomotive') {
          const result = await trainApi.addLocomotiveToGame(selectedTrack);
          state = result.state;
        } else {
          const typeWagon = elem.type_wagon as string;
          const direction = elem.direction as string;
          const result = await trainApi.addWagonToGame(selectedTrack, typeWagon, direction);
          state = result.state;
        }
      }
      setGameState(state);
      showSnackbar(t('coach_formation_added', language) || "Coach formation ajoutée !", 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('coach_formation_add_error', language) || "Erreur lors de l'ajout de la coach formation", 'error');
    }
  };

  // --- MODIFICATION : Séparation des dimensions carte/image ---
  const renderTrack = (trackNumber: number, elements: any[]) => {
    return (
      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          boxShadow: 8,
          background: 'linear-gradient(90deg, #fff 60%, #e3e7ee 100%)',
          border: `2px solid ${accentPalette.card}`,
          transition: 'box-shadow 0.2s, border-color 0.2s',
          '&:hover': { boxShadow: 16, borderColor: accentPalette.main },
          width: '100%',
        }}
        key={trackNumber}
      >
        <CardContent sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
          <Box display="flex" alignItems="center" mb={1}>
            <TrainIcon sx={{ color: accentPalette.main, mr: 1 }} />
            <Typography variant="h6" fontWeight="bold" color={accentPalette.main}>
              {t('track', language)} {trackNumber} {trackNumber === 9 && '⚡'}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2, bgcolor: accentPalette.light, height: 3, borderRadius: 2 }} />
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{
              minHeight: 140,
              border: `2px dashed ${accentPalette.light}`,
              borderRadius: 3,
              p: 2,
              background: 'rgba(255,255,255,0.85)',
              boxShadow: '0 2px 12px #d32f2f11',
              overflowX: 'auto',
              transition: 'border-color 0.2s',
              width: '100%',
              minWidth: 0,
            }}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(trackNumber)}
          >
            {elements.length === 0 ? (
              <Typography color="textSecondary">{t('empty_track', language)}</Typography>
            ) : (
              elements.map((element, index) => {
                // Séparation des dimensions carte/image
                let cardWidth = 110, cardHeight = 120;
                let imgWidth = 100, imgHeight = 80;
                if (element.type === 'locomotive') {
                  cardWidth = 200; cardHeight = 120;
                  imgWidth = 200; imgHeight = 70;
                } else if (element.type_wagon === 'cabcar') {
                  cardWidth = 200; cardHeight = 110;
                  imgWidth = 250; imgHeight = 400;
                } else if (element.type_wagon === '1') {
                  cardWidth = 180; cardHeight = 100;
                  imgWidth = 170; imgHeight = 70;
                }
                  // AJOUTE ICI POUR LES AUTRES TYPES
                else if (element.type_wagon === '2' || element.type_wagon === '3') {
                  cardWidth = 160; cardHeight = 100;
                  imgWidth = 140; imgHeight = 70;
                } else if (element.type_wagon === '4') {
                  cardWidth = 170; cardHeight = 110;
                  imgWidth = 150; imgHeight = 80;
                }

                return (
                  <Box
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(trackNumber, index)}
                    sx={{
                      width: cardWidth,
                      height: cardHeight,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.95)',
                      boxShadow: '0 2px 8px #bdbdbd55',
                      p: 0,
                      position: 'relative',
                      mx: 1,
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      '&:hover': {
                        boxShadow: '0 4px 24px #d32f2f33',
                        transform: 'scale(1.04)'
                      }
                    }}
                  >
                    {/* Icône de transfert en haut à gauche */}
                    <Tooltip title={t('move_wagon', language) || "Déplacer"}>
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          zIndex: 3,
                          background: '#fff',
                          boxShadow: 2,
                          opacity: 0.8,
                          '&:hover': { opacity: 1, color: accentPalette.blue }
                        }}
                        onClick={(e) => handleOpenMoveMenu(e, trackNumber, index)}
                      >
                        <CompareArrowsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <img
                      src={getElementImage(element)}
                      alt={element.type === 'locomotive' ? t('locomotive', language) : `${t('wagon', language)} ${element.type_wagon}`}
                      style={{
                        width: imgWidth,
                        height: imgHeight,
                        objectFit: 'contain',
                        filter: element.type === 'locomotive'
                          ? 'drop-shadow(0 0 8px #1976d2aa)'
                          : 'drop-shadow(0 0 6px #ff980088)'
                      }}
                    />
                    {element.type === 'wagon' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: accentPalette.blue,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                            textShadow: '0 1px 4px #fff',
                            mr: 1
                          }}
                        >
                          {getWagonTypeLabel(element.type_wagon)}
                        </Typography>
                      </Box>
                    )}
                    {element.type === 'locomotive' && (
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          color: accentPalette.green,
                          fontWeight: 700,
                          letterSpacing: 0.5,
                          textShadow: '0 1px 4px #fff'
                        }}
                      >
                        {t('locomotive', language)}
                      </Typography>
                    )}
                    <Tooltip title={t('delete', language)}>
                      <IconButton
                        size="small"
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          zIndex: 2,
                          background: '#fff',
                          boxShadow: 2,
                          '&:hover': { background: accentPalette.light }
                        }}
                        onClick={() => handleRemoveElement(trackNumber, index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <span>
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          zIndex: 2,
                          background: '#fff',
                          boxShadow: 2,
                          '&:hover': { background: accentPalette.blue, color: '#fff' }
                        }}
                        onClick={() => handleMoveElement(trackNumber, index, 'left')}
                        disabled={index === 0}
                      >
                        <ArrowBackIosNewIcon sx={{ fontSize: 16 }}/>
                      </IconButton>
                    </span>
                    <span>
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          bottom: 4,
                          right: 4,
                          zIndex: 2,
                          background: '#fff',
                          boxShadow: 2,
                          '&:hover': { background: accentPalette.blue, color: '#fff' }
                        }}
                        onClick={() => handleMoveElement(trackNumber, index, 'right')}
                        disabled={index === elements.length - 1}
                      >
                        <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  </Box>
                );
              })
            )}
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            {t('length', language)}: {elements.reduce((sum, e) => sum + (e.type === 'locomotive' ? 19 : 14), 0)}m / 300m
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      {/* Menu pour déplacer un wagon */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMoveMenu}
      >
        {moveMenu && TRACK_NUMBERS.slice(0, trackCount).filter(num => num !== moveMenu.track).map(num => (
          <MenuItem key={num} onClick={() => handleSelectMoveTrack(num)}>
            {t('track', language)} {num}
          </MenuItem>
        ))}
      </Menu>

      <Container
        maxWidth="xl"
        sx={{
          mt: 2,
          mb: 2,
          minHeight: '90vh',
          borderRadius: 4,
          boxShadow: 4,
          background: `linear-gradient(120deg, #fff 60%, ${accentPalette.card} 100%)`,
          p: { xs: 1, sm: 3 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          width: '100%',
        }}
      >
        {/* Titre principal */}
        <Typography variant="h4" gutterBottom fontWeight="bold" color={accentPalette.main} sx={{ letterSpacing: 1 }}>
          {t('game_title', language)}
        </Typography>

        {/* Sélecteur du nombre de voies sous le titre, aligné à gauche */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            fontWeight="bold"
            color={accentPalette.blue}
            sx={{ letterSpacing: 1, mb: 1 }}
          >
            {t('number_of_tracks', language) || "Nombre de voies"}
          </Typography>
          <FormControl
            size="small"
            sx={{
              minWidth: 80,
              maxWidth: 100,
              bgcolor: "#fff",
              borderRadius: 2,
              boxShadow: 1,
              '& .MuiSelect-select': { textAlign: 'center', fontWeight: 700, fontSize: 18, py: 1 }
            }}
          >
            <Select
              value={trackCount}
              onChange={(e) => setTrackCount(Number(e.target.value))}
              displayEmpty
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 18,
                px: 2,
                py: 0.5,
                border: `1.5px solid ${accentPalette.light}`,
                textAlign: 'center'
              }}
            >
              {[2, 3, 4, 5, 6].map((n) => (
                <MenuItem key={n} value={n} sx={{ justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                  {n}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Grid container spacing={3}>
          {/* Track display */}
          <Grid item xs={12} md={8} lg={9}>
            <Typography variant="h6" gutterBottom color={accentPalette.blue} fontWeight="bold">
              {t('track_state', language)}
            </Typography>
            <Box sx={{ width: '100%', minWidth: 0 }}>
              {Object.entries(gameState)
                .slice(0, trackCount)
                .map(([trackNumber, elements]: [string, any]) =>
                  renderTrack(parseInt(trackNumber), elements)
                )}
            </Box>
          </Grid>

          {/* Controls panel */}
          <Grid item xs={12} md={4} lg={3}>
            <Card
              sx={{
                borderRadius: 4,
                boxShadow: 10,
                background: 'linear-gradient(135deg, #fff 60%, #ffeaea 100%)',
                border: `1.5px solid ${accentPalette.light}`,
                p: 2,
                mb: 2,
                minHeight: 500,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start'
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom color={accentPalette.main} sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                  <AddCircleIcon sx={{ mr: 1, color: accentPalette.main }} />
                  {t('actions', language)}
                </Typography>

                {/* Track selection */}
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: "#23272F", bgcolor: "#fff", px: 0.5, borderRadius: 1, fontWeight: 600 }}>{t('select_track', language)}</InputLabel>
                  <Select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(Number(e.target.value))}
                    sx={{ bgcolor: "#fff", borderRadius: 2 }}
                  >
                    {TRACK_NUMBERS.slice(0, trackCount).map((trackNum) => (
                      <MenuItem key={trackNum} value={trackNum}>
                        {trackNum}{trackNum === 9 && " ⚡"}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Add wagon controls */}
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, color: accentPalette.main }}>
                  {t('add_wagon', language)}
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: "#23272F", bgcolor: "#fff", px: 0.5, borderRadius: 1, fontWeight: 600 }}>{t('wagon', language)}</InputLabel>
                      <Select
                        value={selectedWagonType}
                        onChange={(e) => setSelectedWagonType(e.target.value)}
                        sx={{ bgcolor: "#fff", borderRadius: 2 }}
                      >
                        <MenuItem value="1">{t('wagon_type_1', language) || "Type 1"}</MenuItem>
                        <MenuItem value="2">{t('wagon_type_2', language) || "Type 2"}</MenuItem>
                        <MenuItem value="3">{t('wagon_type_3', language) || "Type 3"}</MenuItem>
                        <MenuItem value="4">{t('wagon_type_4', language) || "Type 4"}</MenuItem>
                        <MenuItem value="cabcar">{t('wagon_type_cabcar', language) || "Cab Car"}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: "#23272F", bgcolor: "#fff", px: 0.5, borderRadius: 1, fontWeight: 600 }}>{t('direction', language)}</InputLabel>
                      <Select
                        value={selectedDirection}
                        onChange={(e) => setSelectedDirection(e.target.value)}
                        sx={{ bgcolor: "#fff", borderRadius: 2 }}
                      >
                        <MenuItem value="left">{t('left', language)}</MenuItem>
                        <MenuItem value="right">{t('right', language)}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleAddWagon}
                  sx={{
                    mt: 2,
                    mb: 2,
                    background: accentPalette.main,
                    color: "#fff",
                    fontWeight: "bold",
                    boxShadow: 2,
                    borderRadius: 2,
                    fontSize: 16,
                    '&:hover': { background: accentPalette.dark }
                  }}
                  startIcon={<img src={wagon1LeftImg} alt="" width={24} />}
                >
                  {t('add_wagon_button', language)}
                </Button>

                {/* Section dédiée à la formation coach */}
                <Box sx={{ mb: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 2, boxShadow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color={accentPalette.blue} sx={{ mb: 1 }}>
                    {t('add_coach_formation', language) || "Ajouter une formation complète"}
                  </Typography>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="coach-direction-label">{t('formation_direction', language) || "Sens de la formation"}</InputLabel>
                    <Select
                      labelId="coach-direction-label"
                      value={coachDirection}
                      label={t('formation_direction', language) || "Sens de la formation"}
                      onChange={e => setCoachDirection(e.target.value as 'normal' | 'reverse')}
                      sx={{ bgcolor: "#fff", borderRadius: 2 }}
                    >
                      <MenuItem value="normal">{t('normal_direction', language) || "Sens normal"}</MenuItem>
                      <MenuItem value="reverse">{t('reverse_direction', language) || "Sens inverse"}</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleAddCoachFormation}
                    sx={{
                      background: accentPalette.blue,
                      color: "#fff",
                      fontWeight: "bold",
                      boxShadow: 2,
                      borderRadius: 2,
                      fontSize: 16,
                      '&:hover': { background: accentPalette.dark }
                    }}
                    startIcon={<TrainIcon />}
                  >
                    {t('add_coach_formation', language) || "Ajouter Coach formation"}
                  </Button>
                </Box>

                {/* Add locomotive controls */}
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, color: accentPalette.blue }}>
                  {t('add_locomotive', language)}
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleAddLocomotive}
                  sx={{
                    mb: 3,
                    fontWeight: "bold",
                    boxShadow: 2,
                    borderRadius: 2,
                    fontSize: 16,
                  }}
                  startIcon={<img src={locoImg} alt="" width={24} />}
                >
                  {t('add_locomotive_button', language)}
                </Button>

                {/* Reset game button */}
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  onClick={handleResetGame}
                  sx={{
                    fontWeight: "bold",
                    borderWidth: 2,
                    borderColor: accentPalette.main,
                    borderRadius: 2,
                    fontSize: 16,
                    mb: 2,
                  }}
                  startIcon={<AutorenewIcon />}
                >
                  {t('reset', language)}
                </Button>

                {/* Game rules info box */}
                <Box sx={{ mt: 3 }}>
                  <Alert
                    severity="info"
                    sx={{
                      borderRadius: 2,
                      bgcolor: "#fff3e0",
                      color: "#d84315",
                      fontWeight: 500,
                      boxShadow: 2,
                      mb: 1
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {t('rules_title', language)}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {t('rule_1', language)}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {t('rule_2', language)}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {t('rule_3', language)}
                    </Typography>
                    <Typography variant="caption" component="div">
                      {t('rule_4', language)}
                    </Typography>
                  </Alert>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} sx={{ fontWeight: 600 }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default GameView;