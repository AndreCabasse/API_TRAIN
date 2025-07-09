import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Typography,
  Box,
  Chip,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr, enUS, da } from 'date-fns/locale';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../utils/translations';
import { trainApi } from '../services/api';
import { Train, TrainFormData } from '../types';
import { userApi } from '../services/userApi';

// Harmonized red palette for consistent theming
const redPalette = {
  main: '#D32F2F',
  light: '#FF6659',
  dark: '#9A0007',
  background: '#FFF5F5',
  card: '#FFEAEA',
  accent: '#FF1744'
};

/**
 * TrainManagement component.
 * Allows users to view, add, edit, delete, and import trains.
 * Handles simulation reset, Excel import, and displays feedback via Snackbar.
 * Uses MUI components for UI and supports internationalization.
 */
const TrainManagement: React.FC = () => {
  const { language } = useLanguage();
  const [trains, setTrains] = useState<Train[]>([]);
  const [depots, setDepots] = useState<{ depot: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrain, setEditingTrain] = useState<Train | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Form state for adding/editing a train
  const [formData, setFormData] = useState<TrainFormData>({
    nom: '',
    wagons: 1,
    locomotives: 1,
    arrivee: new Date().toISOString(),
    depart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    depot: '',
    type: 'storage',
    electrique: false,
    locomotive_cote: 'left'
  });

  // On mount: load last simulation or fallback to current trains, and load depots
  useEffect(() => {
    const fetchLastSimulation = async () => {
      try {
        const sims = await userApi.getMySimulations();
        if (sims.length > 0) {
          const last = sims[sims.length - 1];
          if (last.data?.trains) {
            setTrains(last.data.trains);
            return;
          }
        }
        await loadTrains(); // fallback if no saved simulation
      } catch {
        await loadTrains();
      }
    };
    fetchLastSimulation();
    loadDepots();
    // eslint-disable-next-line
  }, []);

  /**
   * Save the current simulation to the backend (auto-save after changes).
   */
  const saveCurrentSimulation = async (trainsToSave: Train[]) => {
    try {
      await userApi.saveSimulation({
        name: "Simulation auto",
        data: { trains: trainsToSave, date: new Date().toISOString() },
      });
    } catch {
      // Optionally show an error
    }
  };

  /**
   * Load all trains from the API.
   */
  const loadTrains = async () => {
    try {
      setLoading(true);
      const data = await trainApi.getTrains();
      setTrains(data);
    } catch (error) {
      showSnackbar(t('load_trains_error', language) || 'Error loading trains', 'error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load all depots from the API.
   * Sets the default depot in the form if not already set.
   */
  const loadDepots = async () => {
    try {
      const data = await trainApi.getDepots();
      setDepots(data);
      if (!formData.depot && data.length > 0) {
        setFormData((prev) => ({ ...prev, depot: data[0].depot }));
      }
    } catch (error) {
      showSnackbar(t('load_depots_error', language) || 'Error loading depots', 'error');
    }
  };

  /**
   * Show a snackbar message (success or error).
   */
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * Open the dialog to add a new train.
   * Resets the form to default values.
   */
  const handleAddTrain = () => {
    setEditingTrain(null);
    setFormData({
      nom: '',
      wagons: 1,
      locomotives: 1,
      arrivee: new Date().toISOString(),
      depart: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      depot: depots.length > 0 ? depots[0].depot : '',
      type: 'storage',
      electrique: false,
      locomotive_cote: 'left'
    });
    setOpenDialog(true);
  };

  /**
   * Open the dialog to edit an existing train.
   * Pre-fills the form with the train's data.
   */
  const handleEditTrain = (train: Train) => {
    setEditingTrain(train);
    setFormData({
      nom: train.nom,
      wagons: train.wagons,
      locomotives: train.locomotives,
      arrivee: train.arrivee,
      depart: train.depart,
      depot: train.depot,
      type: train.type,
      electrique: train.electrique,
      locomotive_cote: train.locomotive_cote || 'left'
    });
    setOpenDialog(true);
  };

  /**
   * Delete a train by ID, with confirmation dialog.
   * Updates the train list and saves the new simulation.
   */
  const handleDeleteTrain = async (trainId: number, trainName: string) => {
    if (window.confirm(`${t('delete_train_confirm', language) || 'Delete train'} "${trainName}" ?`)) {
      try {
        await trainApi.deleteTrain(trainId);
        const updatedTrains = await trainApi.getTrains();
        setTrains(updatedTrains);
        await saveCurrentSimulation(updatedTrains);
        showSnackbar(`${t('train_deleted', language) || 'Train deleted'} "${trainName}"`, 'success');
      } catch (error) {
        showSnackbar(t('delete_error', language) || 'Error while deleting', 'error');
      }
    }
  };

  /**
   * Handle form submission for adding or editing a train.
   * Validates input, updates the backend, and refreshes the train list.
   */
  const handleSubmit = async () => {
    if (!formData.nom || formData.wagons < 1 || formData.locomotives < 0) {
      showSnackbar(t('fill_all_fields', language) || 'Please fill all fields', 'error');
      return;
    }
    if (new Date(formData.arrivee) >= new Date(formData.depart)) {
      showSnackbar(t('departure_after_arrival', language) || 'Departure time must be after arrival', 'error');
      return;
    }
    try {
      if (editingTrain) {
        await trainApi.updateTrain(editingTrain.id, formData);
        showSnackbar(t('train_modified', language) || 'Train updated', 'success');
      } else {
        await trainApi.addTrain(formData);
        showSnackbar(t('train_added', language) || 'Train added', 'success');
      }
      // Add to user history
      await userApi.addHistory({
        action: t('add_train_action', language) || 'Add train',
        train: formData.nom,
        date: new Date().toISOString()
      });
      setOpenDialog(false);
      const updatedTrains = await trainApi.getTrains();
      setTrains(updatedTrains);
      await saveCurrentSimulation(updatedTrains);
    } catch (error: any) {
      // Handle depot conflict error with suggestions
      if (error && error.isDepotConflict && error.depots_disponibles) {
        showSnackbar(
          `${t('no_track_available', language) || 'No track available for'} ${formData.depot}.\n` +
          `${t('suggested_depots', language) || 'Suggested depots'}: ${error.depots_disponibles.join(', ')}`,
          'error'
        );
      } else {
        showSnackbar(t('save_error', language) || 'Error while saving', 'error');
      }
    }
  };

  /**
   * Handle Excel file import for trains.
   * Accepts .xlsx, .xls, or .csv files and updates the train list.
   */
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const formData = new FormData();
      formData.append('file', e.target.files[0]);
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/import-trains-excel`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (data.imported?.length) {
          showSnackbar(`${t('import_success', language) || 'Import success'}: ${data.imported.join(', ')}`, 'success');
        }
        if (data.errors?.length) {
          showSnackbar(`${t('import_error', language) || 'Import error'}: ${data.errors.join('\n')}`, 'error');
        }
        await loadTrains();
      } catch (err) {
        showSnackbar(t('import_error', language) || 'Import error', 'error');
      }
    }
  };

  /**
   * Reset the simulation to its initial state, with confirmation.
   */
  const handleResetSimulation = async () => {
    if (window.confirm(t('reset_confirm', language) || 'Are you sure you want to reset?')) {
      try {
        await trainApi.resetSimulation();
        await loadTrains();
        showSnackbar(t('simulation_reset', language) || 'Simulation reset', 'success');
      } catch (error) {
        showSnackbar(t('reset_error', language) || 'Reset error', 'error');
      }
    }
  };

  /**
   * Get the correct locale for date pickers based on the selected language.
   */
  const getDateLocale = () => {
    switch (language) {
      case 'en': return enUS;
      case 'da': return da;
      default: return fr;
    }
  };

  /**
   * Format a date string to a readable local string (Copenhagen time).
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen' });
  };

  // Debug: log train arrival dates for troubleshooting
  trains.forEach(train => {
    console.log(
      "DEBUG ARRIVEE RAW:", train.arrivee,
      "PARSED:", new Date(train.arrivee),
      "LOCALE:", new Date(train.arrivee).toLocaleString('fr-FR')
    );
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={getDateLocale()}>
      <>
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          {/* Header with actions: refresh, reset, import, add */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="bold" color={redPalette.dark}>
              {t('train_list', language)}
            </Typography>
            <Box>
              {/* Refresh trains button */}
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadTrains}
                sx={{
                  mr: 1,
                  borderColor: redPalette.main,
                  color: redPalette.main,
                  '&:hover': { borderColor: redPalette.dark, background: redPalette.background }
                }}
              >
                {t('refresh', language)}
              </Button>
              {/* Reset simulation button */}
              <Button
                variant="outlined"
                color="error"
                sx={{
                  mr: 1,
                  borderColor: redPalette.main,
                  color: redPalette.main,
                  '&:hover': { borderColor: redPalette.dark, background: redPalette.background }
                }}
                onClick={handleResetSimulation}
              >
                {t('reset_simulation', language)}
              </Button>
              {/* Import Excel file button */}
              <Button
                variant="outlined"
                component="label"
                sx={{
                  mr: 1,
                  borderColor: redPalette.main,
                  color: redPalette.main,
                  '&:hover': { borderColor: redPalette.dark, background: redPalette.background }
                }}
              >
                {t('import_excel', language)}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  hidden
                  onChange={handleImportExcel}
                />
              </Button>
              {/* Add new train button */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddTrain}
                sx={{
                  background: redPalette.main,
                  color: "#fff",
                  boxShadow: 2,
                  '&:hover': { background: redPalette.dark }
                }}
              >
                {t('add_train', language)}
              </Button>
            </Box>
          </Box>

          {/* Loading indicator */}
          {loading && (
            <Box display="flex" justifyContent="center" alignItems="center" my={2}>
              <Typography color={redPalette.main} fontWeight="bold">
                {t('loading', language) || 'Chargement...'}
              </Typography>
            </Box>
          )}

          {/* Main trains table */}
          <TableContainer component={Paper} sx={{
            borderRadius: 3,
            boxShadow: 4,
            background: redPalette.background
          }}>
            <Table>
              <TableHead>
                <TableRow sx={{ background: redPalette.light }}>
                  <TableCell sx={{ color: redPalette.dark }}>{t('train_name', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('wagons', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('locomotives', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('length', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('arrival_time', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('departure_time', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('select_depot', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('train_type', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('status', language)}</TableCell>
                  <TableCell sx={{ color: redPalette.dark }}>{t('actions', language)}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trains.map((train) => (
                  <TableRow key={train.id} hover sx={{
                    background: train.en_attente ? redPalette.card : "#fff",
                    transition: "background 0.2s"
                  }}>
                    {/* Train name and electric icon */}
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        {train.electrique && <span style={{ marginRight: 8, color: redPalette.accent }} title={t('electric_train', language)}>⚡</span>}
                        <Typography fontWeight="bold">{train.nom}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{train.wagons}</TableCell>
                    <TableCell>{train.locomotives}</TableCell>
                    <TableCell>{train.longueur}m</TableCell>
                    <TableCell>{formatDateTime(train.arrivee)}</TableCell>
                    <TableCell>{formatDateTime(train.depart)}</TableCell>
                    <TableCell>{train.depot}</TableCell>
                    {/* Train type chip */}
                    <TableCell>
                      <Chip
                        label={t(train.type, language)}
                        size="small"
                        sx={{
                          bgcolor:
                            train.type === 'testing'
                              ? redPalette.light
                              : train.type === 'pit'
                              ? redPalette.main
                              : train.type === 'passenger'
                              ? '#388e3c'
                              : "#bdbdbd",
                          color: train.type === 'storage' ? "#333" : "#fff",
                          fontWeight: "bold"
                        }}
                      />
                    </TableCell>
                    {/* Status chip: waiting, placed, or track */}
                    <TableCell>
                      {train.en_attente ? (
                        <Chip label={t('waiting', language)} color="warning" size="small" sx={{ fontWeight: "bold" }} />
                      ) : train.voie ? (
                        <Chip label={`${t('track', language)} ${train.voie}`} sx={{ bgcolor: redPalette.main, color: "#fff", fontWeight: "bold" }} size="small" />
                      ) : (
                        <Chip label={t('placed', language)} color="default" size="small" />
                      )}
                    </TableCell>
                    {/* Edit and delete actions */}
                    <TableCell>
                      <IconButton onClick={() => handleEditTrain(train)} size="small" sx={{ color: redPalette.main }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteTrain(train.id, train.nom)}
                        size="small"
                        sx={{ color: redPalette.dark, ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Dialog for adding/editing a train */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth
            PaperProps={{
              sx: {
                borderRadius: 4,
                boxShadow: 8,
                background: redPalette.background,
                border: `2px solid ${redPalette.light}`
              }
            }}
          >
            <DialogTitle sx={{ bgcolor: redPalette.main, color: "#fff", fontWeight: "bold" }}>
              {editingTrain ? t('modify_train', language) : t('add_train', language)}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {/* Train name input */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('train_name', language)}
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    sx={{ bgcolor: "#fff" }}
                  />
                </Grid>
                {/* Wagons input */}
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('wagons', language)}
                    value={formData.wagons}
                    onChange={(e) => setFormData({ ...formData, wagons: parseInt(e.target.value) || 0 })}
                    sx={{ bgcolor: "#fff" }}
                  />
                </Grid>
                {/* Locomotives input */}
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('locomotives', language)}
                    value={formData.locomotives}
                    onChange={(e) => setFormData({ ...formData, locomotives: parseInt(e.target.value) || 0 })}
                    sx={{ bgcolor: "#fff" }}
                  />
                </Grid>
                {/* Arrival DateTimePicker */}
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label={t('arrival_time', language)}
                    value={formData.arrivee ? new Date(formData.arrivee) : null}
                    onChange={(date) => {
                      if (date) {
                        setFormData({ ...formData, arrivee: date.toISOString() });
                      }
                    }}
                    slotProps={{ textField: { fullWidth: true, sx: { bgcolor: "#fff" } } }}
                  />
                </Grid>
                {/* Departure DateTimePicker */}
                <Grid item xs={12} md={6}>
                  <DateTimePicker
                    label={t('departure_time', language)}
                    value={formData.depart ? new Date(formData.depart) : null}
                    onChange={(date) => {
                      if (date) {
                        setFormData({ ...formData, depart: date.toISOString() });
                      }
                    }}
                    slotProps={{ textField: { fullWidth: true, sx: { bgcolor: "#fff" } } }}
                  />
                </Grid>
                {/* Depot selection */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ pl: 1, bgcolor: "#fff" }}>{t('select_depot', language)}</InputLabel>
                    <Select
                      value={formData.depot}
                      onChange={(e) => setFormData({ ...formData, depot: e.target.value })}
                      sx={{ bgcolor: "#fff" }}
                    >
                      {depots.map((d) => (
                        <MenuItem key={d.depot} value={d.depot}>{d.depot}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* Train type selection */}
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ pl: 1, bgcolor: "#fff" }}>{t('train_type', language)}</InputLabel>
                    <Select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      sx={{ bgcolor: "#fff" }}
                    >
                      <MenuItem value="storage">{t('storage', language)}</MenuItem>
                      <MenuItem value="testing">{t('testing', language)}</MenuItem>
                      <MenuItem value="pit">{t('pit', language)}</MenuItem>
                      <MenuItem value="passenger">{t('passenger', language)}</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Locomotive side selection (only if 1 locomotive) */}
                {formData.locomotives === 1 && (
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth>
                      <InputLabel sx={{ pl: 1, bgcolor: "#fff" }}>{t('locomotive_side', language)}</InputLabel>
                      <Select
                        value={formData.locomotive_cote}
                        onChange={(e) => setFormData({ ...formData, locomotive_cote: e.target.value as any })}
                        sx={{ bgcolor: "#fff" }}
                      >
                        <MenuItem value="left">{t('left', language)}</MenuItem>
                        <MenuItem value="right">{t('right', language)}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {/* Electric checkbox */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.electrique}
                        onChange={(e) => setFormData({ ...formData, electrique: e.target.checked })}
                        sx={{
                          color: redPalette.main,
                          '&.Mui-checked': { color: redPalette.main }
                        }}
                      />
                    }
                    label={<span style={{ color: redPalette.dark }}>{t('electric_train', language)}</span>}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            {/* Dialog actions: cancel and submit */}
            <DialogActions sx={{ bgcolor: "#fff", borderTop: `1px solid ${redPalette.light}` }}>
              <Button onClick={() => setOpenDialog(false)} sx={{ color: redPalette.main }}>
                {t('cancel', language)}
              </Button>
              <Button onClick={handleSubmit} variant="contained" sx={{
                background: redPalette.main,
                color: "#fff",
                fontWeight: "bold",
                '&:hover': { background: redPalette.dark }
              }}>
                {editingTrain ? t('apply_changes', language) : t('submit_train', language)}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Snackbar for feedback messages */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert severity={snackbar.severity} sx={{
              bgcolor: snackbar.severity === 'error' ? redPalette.light : "#43a047",
              color: "#fff",
              fontWeight: "bold"
            }}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </>
    </LocalizationProvider>
  );
};

export default TrainManagement;