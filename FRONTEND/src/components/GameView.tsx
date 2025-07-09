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
  Divider
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

// Import images from Layouts folder
import locoImg from '../assets/Vectron.png';
import wagon1LeftImg from '../assets/wagon_1_left.png';
import wagon1RightImg from '../assets/wagon_1_right.png';
import wagon23LeftImg from '../assets/wagon_2_3_left.png';
import wagon23RightImg from '../assets/wagon_2_3_right.png';
import wagon4LeftImg from '../assets/wagon_4_left.png';
import wagon4RightImg from '../assets/wagon_4_right.png';

// Color palette for UI accents
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

/**
 * Normalize the direction string to 'left' or 'right'
 */
const normalizeDirection = (dir: string) => {
  if (!dir) return 'left';
  const d = dir.toLowerCase();
  if (['right', 'droite', 'højre'].includes(d)) return 'right';
  return 'left';
};

/**
 * Get the image for a train element (locomotive or wagon) based on its type and direction
 */
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
    default:
      return direction === 'right' ? wagon1RightImg : wagon1LeftImg;
  }
};

/**
 * Main GameView component for the interactive train composition game.
 * Allows adding/removing/moving wagons and locomotives on tracks.
 */
const GameView: React.FC = () => {
  const { language } = useLanguage();
  const [gameState, setGameState] = useState<any>({});
  const [selectedTrack, setSelectedTrack] = useState<number>(7);
  const [selectedWagonType, setSelectedWagonType] = useState<string>('1');
  const [selectedDirection, setSelectedDirection] = useState<string>('left');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load the game state from the API on mount
  useEffect(() => {
    loadGameState();
  }, []);

  /**
   * Fetch the current game state from the backend API
   */
  const loadGameState = async () => {
    try {
      const state = await trainApi.getGameState();
      setGameState(state);
    } catch (error) {
      console.error('Error loading game state:', error);
    }
  };

  /**
   * Show a snackbar notification
   */
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * Add a wagon to the selected track with the selected type and direction
   */
  const handleAddWagon = async () => {
    try {
      const result = await trainApi.addWagonToGame(selectedTrack, selectedWagonType, selectedDirection);
      setGameState(result.state);
      showSnackbar(t('wagon_added_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('wagon_add_error', language), 'error');
    }
  };

  /**
   * Add a locomotive to the selected track
   */
  const handleAddLocomotive = async () => {
    try {
      const result = await trainApi.addLocomotiveToGame(selectedTrack);
      setGameState(result.state);
      showSnackbar(t('locomotive_added_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('locomotive_add_error', language), 'error');
    }
  };

  /**
   * Reset the game state to its initial state
   */
  const handleResetGame = async () => {
    try {
      const result = await trainApi.resetGame();
      setGameState(result.state);
      showSnackbar(t('game_reset', language), 'success');
    } catch (error: any) {
      showSnackbar(t('reset_error', language), 'error');
    }
  };

  /**
   * Remove an element (wagon or locomotive) from a track at a given index
   */
  const handleRemoveElement = async (trackNumber: number, elementIndex: number) => {
    try {
      const result = await trainApi.deleteElementFromGame(trackNumber, elementIndex);
      setGameState(result.state);
      showSnackbar(t('element_removed_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('element_remove_error', language), 'error');
    }
  };

  /**
   * Move an element left or right within a track
   */
  const handleMoveElement = async (trackNumber: number, elementIndex: number, direction: 'left' | 'right') => {
    try {
      const result = await trainApi.swapWagonInGame(trackNumber, elementIndex, direction);
      setGameState(result.state);
      showSnackbar(t('element_moved_success', language), 'success');
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || t('element_move_error', language), 'error');
    }
  };

  /**
   * Get the label for a wagon type, translated
   */
  const getWagonTypeLabel = (type: string) => {
    switch (type) {
      case '1': return t('wagon_type_1', language) || 'Type 1';
      case '2': return t('wagon_type_2', language) || 'Type 2';
      case '3': return t('wagon_type_3', language) || 'Type 3';
      case '4': return t('wagon_type_4', language) || 'Type 4';
      default: return t('wagon', language);
    }
  };

  /**
   * Render a single track with its elements (wagons/locomotives)
   */
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
          >
            {/* Show message if track is empty */}
            {elements.length === 0 ? (
              <Typography color="textSecondary">{t('empty_track', language)}</Typography>
            ) : (
              elements.map((element, index) => (
                <Box
                  key={index}
                  sx={{
                    width: element.type === 'locomotive' ? 150 : 110,
                    height: 120,
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
                  {/* Train element image */}
                  <img
                    src={getElementImage(element)}
                    alt={element.type === 'locomotive' ? t('locomotive', language) : `${t('wagon', language)} ${element.type_wagon}`}
                    style={{
                      width: element.type === 'locomotive' ? 150 : 110,
                      height: 80,
                      objectFit: 'contain',
                      filter: element.type === 'locomotive' ? 'drop-shadow(0 0 8px #1976d2aa)' : 'drop-shadow(0 0 6px #ff980088)'
                    }}
                  />
                  {/* Wagon type label */}
                  {element.type === 'wagon' && (
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 0.5,
                        color: accentPalette.blue,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textShadow: '0 1px 4px #fff'
                      }}
                    >
                      {getWagonTypeLabel(element.type_wagon)}
                    </Typography>
                  )}
                  {/* Locomotive label */}
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
                  {/* Delete button */}
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
                  {/* Move left button */}
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
                  {/* Move right button */}
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
              ))
            )}
          </Box>
          {/* Track length indicator */}
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
            {t('length', language)}: {elements.reduce((sum, e) => sum + (e.type === 'locomotive' ? 19 : 14), 0)}m / 300m
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
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
        <Typography variant="h4" gutterBottom fontWeight="bold" color={accentPalette.main} sx={{ letterSpacing: 1 }}>
          {t('game_title', language)}
        </Typography>

        <Grid container spacing={3}>
          {/* Track display */}
          <Grid item xs={12} md={8} lg={9}>
            <Typography variant="h6" gutterBottom color={accentPalette.blue} fontWeight="bold">
              {t('track_state', language)}
            </Typography>
            <Box sx={{ width: '100%', minWidth: 0 }}>
              {Object.entries(gameState).map(([trackNumber, elements]: [string, any]) =>
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
                    onChange={(e) => setSelectedTrack(e.target.value as number)}
                    sx={{ bgcolor: "#fff", borderRadius: 2 }}
                  >
                    <MenuItem value={7}>7</MenuItem>
                    <MenuItem value={8}>8</MenuItem>
                    <MenuItem value={9}>9 ⚡</MenuItem>
                    <MenuItem value={11}>11</MenuItem>
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