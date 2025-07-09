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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { userApi } from "../services/userApi";

/**
 * HistoryView component.
 * Displays user action history and simulation saves.
 * Allows adding, deleting, and viewing details for both.
 * Handles authentication state and error display.
 */
const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount, check authentication and fetch history/simulations
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setNotConnected(true);
      setHistory([]);
      setSimulations([]);
      return;
    }
    setNotConnected(false);
    setError(null);
    userApi.getHistory()
      .then(setHistory)
      .catch((e: any) => {
        setHistory([]);
        setError(e?.response?.data?.detail || "Error loading history");
      });
    userApi.getMySimulations()
      .then(setSimulations)
      .catch((e: any) => {
        setSimulations([]);
        setError(e?.response?.data?.detail || "Error loading saves");
      });
  }, []);

  /**
   * Add a test history entry (for demonstration)
   */
  const handleAddHistory = async () => {
    setError(null);
    try {
      await userApi.addHistory({ action: "Test historique", date: new Date().toISOString() });
      userApi.getHistory()
        .then(setHistory)
        .catch((e: any) => setError(e?.response?.data?.detail || "Error refreshing history"));
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error adding to history");
    }
  };

  /**
   * Add a test simulation save (for demonstration)
   */
  const handleSaveSimulation = async () => {
    setError(null);
    try {
      await userApi.saveSimulation({
        name: "Simulation test",
        data: { foo: "bar", date: new Date().toISOString() },
      });
      userApi.getMySimulations()
        .then(setSimulations)
        .catch((e: any) => setError(e?.response?.data?.detail || "Error refreshing saves"));
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error saving simulation");
    }
  };

  /**
   * Delete a history entry by index
   */
  const handleDeleteHistory = async (idx: number) => {
    setError(null);
    try {
      await userApi.deleteHistory(idx);
      userApi.getHistory().then(setHistory);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error deleting history");
    }
  };

  /**
   * Delete a simulation save by id
   */
  const handleDeleteSimulation = async (id: number) => {
    setError(null);
    try {
      await userApi.deleteSimulation(id);
      userApi.getMySimulations().then(setSimulations);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error deleting save");
    }
  };

  // If not authenticated, show warning
  if (notConnected) {
    return (
      <Box maxWidth={600} mx="auto" mt={4}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          You must be logged in to access history and saves.
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
      {/* User action history */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" gutterBottom>History</Typography>
          <Button onClick={handleAddHistory} variant="outlined">
            Add history (test)
          </Button>
        </Stack>
        <List>
          {history.length === 0 && <ListItem><ListItemText primary="No history" /></ListItem>}
          {history.map((item, idx) => (
            <ListItem
              key={idx}
              divider
              secondaryAction={
                <Tooltip title="Delete">
                  <IconButton edge="end" onClick={() => handleDeleteHistory(idx)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
              }
              sx={{
                bgcolor: idx % 2 === 0 ? "#fff" : "#f8d7da",
                borderRadius: 2,
                mb: 1,
                boxShadow: 1,
              }}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography fontWeight="bold">{item.action || "Action"}</Typography>
                    {item.date && (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.date).toLocaleString()}
                      </Typography>
                    )}
                  </Stack>
                }
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {Object.entries(item)
                      .filter(([k]) => k !== "action" && k !== "date")
                      .map(([k, v]) => (
                        <Typography key={k} variant="body2" sx={{ color: "#555" }}>
                          <b>{k}:</b> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                        </Typography>
                      ))}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
      {/* Simulation saves */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" gutterBottom>Simulation saves</Typography>
          <Button onClick={handleSaveSimulation} variant="outlined">
            Add save (test)
          </Button>
        </Stack>
        <List>
          {simulations.length === 0 && <ListItem><ListItemText primary="No saves" /></ListItem>}
          {simulations.map((sim, idx) => (
            <ListItem
              key={sim.id || idx}
              divider
              secondaryAction={
                <Tooltip title="Delete">
                  <IconButton edge="end" onClick={() => handleDeleteSimulation(sim.id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
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
                secondary={
                  <Box sx={{ mt: 1 }}>
                    {sim.data &&
                      Object.entries(sim.data)
                        .filter(([k]) => k !== "date")
                        .map(([k, v]) => (
                          <Typography key={k} variant="body2" sx={{ color: "#555" }}>
                            <b>{k}:</b> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                          </Typography>
                        ))}
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default HistoryView;