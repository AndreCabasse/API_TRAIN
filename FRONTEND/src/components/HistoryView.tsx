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
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ReplayIcon from "@mui/icons-material/Replay";
import SaveIcon from "@mui/icons-material/Save";
import { userApi } from "../services/userApi";
import { trainApi } from "../services/api";
import api from "../services/api";

const SimulationSaves: React.FC<{ onLoadSimulation?: () => void }> = ({ onLoadSimulation }) => {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");

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

  const handleSaveSimulation = async () => {
    setError(null);
    if (!saveName.trim()) {
      setError("Please provide a name for the save.");
      return;
    }
    try {
      const trains = await trainApi.getTrains();
      const data = { trains, date: new Date().toISOString() };
      await userApi.saveSimulation({ name: saveName.trim(), data });
      setSaveName("");
      userApi.getMySimulations().then(setSimulations);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error saving simulation");
    }
  };

  const handleDeleteSimulation = async (id: number) => {
    setError(null);
    try {
      await userApi.deleteSimulation(id);
      userApi.getMySimulations().then(setSimulations);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error deleting save");
    }
  };

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
        console.error("Erreur restauration simulation", e?.response?.data, e);
      }
    }
  };

  if (notConnected) {
    return (
      <Box
        minHeight="100vh"
        sx={{
          background: "linear-gradient(135deg, #e3f2fd 0%, #f5f7fa 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Alert severity="warning" sx={{ mb: 3 }}>
          You must be logged in to access saves.
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      minHeight="100vh"
      sx={{
        background: "linear-gradient(135deg, #e3f2fd 0%, #f5f7fa 100%)",
        py: 6,
        px: 2,
      }}
    >
      <Box maxWidth={700} mx="auto">
        <Typography variant="h4" fontWeight="bold" gutterBottom align="center" color="primary">
          Simulation History
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" mb={4}>
          Save, restore and manage all your simulation states easily.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 4,
            boxShadow: "0 4px 24px 0 rgba(30,136,229,0.10)",
            background: "#ffffffcc",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Save current simulation
          </Typography>
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
              sx={{
                borderRadius: 2,
                boxShadow: 1,
                textTransform: "none",
                fontWeight: 600,
                transition: "background 0.2s",
                "&:hover": { background: "#1565c0" },
              }}
            >
              Save
            </Button>
          </Stack>
        </Paper>
        <Divider sx={{ my: 4 }} />
        <Paper
          sx={{
            p: 3,
            borderRadius: 4,
            boxShadow: "0 4px 24px 0 rgba(30,136,229,0.10)",
            background: "#ffffffcc",
          }}
        >
          <Typography variant="h6" gutterBottom>
            My saves
          </Typography>
          <List>
            {simulations.length === 0 && (
              <ListItem>
                <ListItemText primary="No saves" />
              </ListItem>
            )}
            {simulations.map((sim, idx) => {
              const isLatest = idx === 0;
              return (
                <ListItem
                  key={sim.id || idx}
                  divider
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Tooltip title="Load this save">
                        <IconButton
                          edge="end"
                          color="primary"
                          onClick={() => handleLoadSimulation(sim)}
                          sx={{
                            bgcolor: "#e3f2fd",
                            borderRadius: 2,
                            "&:hover": { bgcolor: "#bbdefb" },
                          }}
                        >
                          <ReplayIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteSimulation(sim.id)}
                          sx={{
                            bgcolor: "#ffebee",
                            borderRadius: 2,
                            "&:hover": { bgcolor: "#ffcdd2" },
                          }}
                        >
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                  sx={{
                    bgcolor: idx % 2 === 0 ? "#f5f7fa" : "#e3f2fd",
                    borderRadius: 2,
                    mb: 1,
                    boxShadow: 2,
                    transition: "background 0.2s",
                    "&:hover": {
                      bgcolor: "#bbdefb",
                    },
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" width="100%">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: "#1976d2",
                        color: "#fff",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: 18,
                        mr: 1,
                        boxShadow: 1,
                      }}
                    >
                      {sim.name?.[0]?.toUpperCase() || "S"}
                    </Box>
                    <Box flex={1}>
                      <Typography fontWeight="bold" sx={{ display: "inline" }}>
                        {sim.name}
                      </Typography>
                      {isLatest && (
                        <Box
                          component="span"
                          sx={{
                            ml: 1,
                            bgcolor: "#43a047",
                            color: "#fff",
                            px: 1,
                            py: 0.2,
                            borderRadius: 1,
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          Latest
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {sim.data?.date && new Date(sim.data.date).toLocaleString()}
                        {sim.data?.trains && (
                          <> &nbsp;•&nbsp; {sim.data.trains.length} trains</>
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </ListItem>
              );
            })}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default SimulationSaves;