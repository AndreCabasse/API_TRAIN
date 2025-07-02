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

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(e?.response?.data?.detail || "Erreur lors du chargement de l'historique");
      });
    userApi.getMySimulations()
      .then(setSimulations)
      .catch((e: any) => {
        setSimulations([]);
        setError(e?.response?.data?.detail || "Erreur lors du chargement des sauvegardes");
      });
  }, []);

  // Ajout d'un historique (test)
  const handleAddHistory = async () => {
    setError(null);
    try {
      await userApi.addHistory({ action: "Test historique", date: new Date().toISOString() });
      userApi.getHistory()
        .then(setHistory)
        .catch((e: any) => setError(e?.response?.data?.detail || "Erreur lors du rafraîchissement de l'historique"));
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de l'ajout à l'historique");
    }
  };

  // Ajout d'une sauvegarde (test)
  const handleSaveSimulation = async () => {
    setError(null);
    try {
      await userApi.saveSimulation({
        name: "Simulation test",
        data: { foo: "bar", date: new Date().toISOString() },
      });
      userApi.getMySimulations()
        .then(setSimulations)
        .catch((e: any) => setError(e?.response?.data?.detail || "Erreur lors du rafraîchissement des sauvegardes"));
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la sauvegarde de la simulation");
    }
  };

  // Suppression d'un historique
  const handleDeleteHistory = async (idx: number) => {
    setError(null);
    try {
      await userApi.deleteHistory(idx);
      userApi.getHistory().then(setHistory);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la suppression de l'historique");
    }
  };

  // Suppression d'une sauvegarde
  const handleDeleteSimulation = async (id: number) => {
    setError(null);
    try {
      await userApi.deleteSimulation(id);
      userApi.getMySimulations().then(setSimulations);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la suppression de la sauvegarde");
    }
  };

  if (notConnected) {
    return (
      <Box maxWidth={600} mx="auto" mt={4}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Vous devez être connecté pour accéder à l’historique et aux sauvegardes.
        </Alert>
      </Box>
    );
  }

  return (
    <Box maxWidth={600} mx="auto" mt={4}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" gutterBottom>Historique</Typography>
          <Button onClick={handleAddHistory} variant="outlined">
            Ajouter un historique (test)
          </Button>
        </Stack>
        <List>
          {history.length === 0 && <ListItem><ListItemText primary="Aucun historique" /></ListItem>}
          {history.map((item, idx) => (
            <ListItem
              key={idx}
              divider
              secondaryAction={
                <Tooltip title="Supprimer">
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
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" gutterBottom>Sauvegardes de simulations</Typography>
          <Button onClick={handleSaveSimulation} variant="outlined">
            Ajouter une sauvegarde (test)
          </Button>
        </Stack>
        <List>
          {simulations.length === 0 && <ListItem><ListItemText primary="Aucune sauvegarde" /></ListItem>}
          {simulations.map((sim, idx) => (
            <ListItem
              key={sim.id || idx}
              divider
              secondaryAction={
                <Tooltip title="Supprimer">
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