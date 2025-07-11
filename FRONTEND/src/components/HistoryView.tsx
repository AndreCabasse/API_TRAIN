import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
  IconButton,
  Stack,
  Tooltip,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@mui/icons-material/Save";
import { userApi } from "../services/userApi";
import { trainApi } from "../services/api"; // ajoute ce import en haut
import api from "../services/api";

/**
 * SimulationSaves component.
 * Allows the user to save the current simulation with a custom name,
 * view all their saves, load or delete them.
 */
const SimulationSaves: React.FC<{ onLoadSimulation?: () => void }> = ({ onLoadSimulation }) => {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");

  // Fetch all simulation saves on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotConnected(true);
      setSimulations([]);
      return;
    }
    setNotConnected(false);
    setError(null);
    userApi.getMySimulations()
      .then(setSimulations)
      .catch((e: any) => {
        setSimulations([]);
        setError(e?.response?.data?.detail || "Error loading saves");
      });
  }, []);

  // Save the current simulation with a custom name
    const handleSaveSimulation = async () => {
      setError(null);
      if (!saveName.trim()) {
        setError("Please provide a name for the save.");
        return;
      }
      try {
        // Fetch the real train list from the backend
        const trains = await trainApi.getTrains();
        const data = { trains, date: new Date().toISOString() };
        await userApi.saveSimulation({ name: saveName.trim(), data });
        setSaveName("");
        userApi.getMySimulations().then(setSimulations);
      } catch (e: any) {
        setError(e?.response?.data?.detail || "Error saving simulation");
      }
    };

  // Delete a simulation save by id
  const handleDeleteSimulation = async (id: number) => {
    setError(null);
    try {
      await userApi.deleteSimulation(id);
      userApi.getMySimulations().then(setSimulations);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error deleting save");
    }
  };

  // Load a simulation: store in localStorage and switch to trains tab
  //const handleLoadSimulation = (sim: any) => {
  //  if (sim?.data) {
   //   localStorage.setItem("loadedSimulation", JSON.stringify(sim.data));
  //    if (onLoadSimulation) onLoadSimulation();
   // }
  //};

const handleLoadSimulation = async (sim: any) => {
  if (sim?.data?.trains) {
    try {
      await api.post("/restore-simulation", { trains: sim.data.trains });
      if (onLoadSimulation) onLoadSimulation();
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
        e?.response?.data?.detail ||
        e?.message ||
        "Erreur lors de la restauration de la simulation"
      );
      // Affiche aussi l’erreur dans la console pour debug
      console.error("Erreur restauration simulation", e?.response?.data, e);
    }
  }
};
  // If not authenticated, show warning
  if (notConnected) {
    return (
      <Box maxWidth={600} mx="auto" mt={4}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You must be logged in to access saves.
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {/* Save simulation form */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Save current simulation</Typography>
        <Stack direction="row" spacing={2} alignItems="center" mt={2}>
          <TextField
            label="Save name"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            size="small"
            sx={{ flex: 1 }}
          />
          <Button
            onClick={handleSaveSimulation}
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </Stack>
      </Paper>
      {/* Simulation saves list */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>My saves</Typography>
        <List>
          {simulations.length === 0 && <ListItem><ListItemText primary="No saves" /></ListItem>}
          {simulations.map((sim, idx) => (
            <ListItem
              key={sim.id || idx}
              divider
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Load this save">
                    <IconButton edge="end" color="primary" onClick={() => handleLoadSimulation(sim)}>
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton edge="end" onClick={() => handleDeleteSimulation(sim.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
              sx={{
                bgcolor: idx % 2 === 0 ? "#fff" : "#fbe9e7",
                borderRadius: 2,
                mb: 1,
                boxShadow: 1,
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography fontWeight="bold">{sim.name}</Typography>
                    {sim.data?.date && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(sim.data.date).toLocaleString()}
                      </Typography>
                    )}
                  </Stack>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default SimulationSaves;