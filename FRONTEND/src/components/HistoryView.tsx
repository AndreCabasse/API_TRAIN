// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

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
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";

const SimulationSaves: React.FC<{ onLoadSimulation?: () => void }> = ({ onLoadSimulation }) => {
  const [simulations, setSimulations] = useState<any[]>([]);
  const [notConnected, setNotConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");
  const { language } = useLanguage();

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
    .then((data: any) => {
      // Ensure data is always an array
      setSimulations(Array.isArray(data) ? data : []);
    })
    .catch((e: any) => {
      setSimulations([]);
      setError(e?.response?.data?.detail || t("error_loading_saves", language));
    });
  }, [language]);

  const handleSaveSimulation = async () => {
    setError(null);
    if (!saveName.trim()) {
      setError(t("please_provide_save_name", language));
      return;
    }
    try {
      const trains = await trainApi.getTrains();
      const data = { trains, date: new Date().toISOString() };
      await userApi.saveSimulation({ name: saveName.trim(), data });
  setSaveName("");
  userApi.getMySimulations().then((data: any) => setSimulations(Array.isArray(data) ? data : []));

    } catch (e: any) {
      setError(e?.response?.data?.detail || t("error_saving_simulation", language));
    }
  };

  const handleDeleteSimulation = async (id: number) => {
    setError(null);
    try {
      await userApi.deleteSimulation(id);
      userApi.getMySimulations().then((data: any) => setSimulations(Array.isArray(data) ? data : []));
    } catch (e: any) {
      setError(e?.response?.data?.detail || t("error_deleting_save", language));
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
          t("error_restoring_simulation", language)
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
          {t("must_be_logged_in_to_access_saves", language)}
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
          {t("simulation_history", language)}
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" mb={4}>
          {t("save_restore_manage_simulations", language)}
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
            {t("save_current_simulation", language)}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" mt={2}>
            <TextField
              label={t("save_name", language)}
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
              {t("save", language)}
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
            {t("my_saves", language)}
          </Typography>
          <List>
            {simulations.length === 0 && (
              <ListItem>
                <ListItemText primary={t("no_saves", language)} />
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
                      <Tooltip title={t("load_this_save", language)}>
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
                      <Tooltip title={t("delete", language)}>
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
                          {t("latest", language)}
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {sim.data?.date && new Date(sim.data.date).toLocaleString(language)}
                        {sim.data?.trains && (
                          <> &nbsp;•&nbsp; {sim.data.trains.length} {t("trains", language)}</>
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