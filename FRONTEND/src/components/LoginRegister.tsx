import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Tabs, Tab, Alert, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { userApi } from "../services/userApi";
import { useUser } from "../contexts/UserContext";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
// Importe une image de fond (mets ton image dans /src/assets par exemple)
import bgImage from "../assets/FOND_DSB.jpg"; // adapte le chemin selon ton image

const LoginRegister: React.FC = () => {
  const { refreshUser } = useUser();
  const { language, setLanguage } = useLanguage();
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    setError(null);
    try {
      await userApi.login(form.username, form.password);
      await refreshUser();
    } catch (e: any) {
      setError(e?.response?.data?.detail || t("login_error", language));
    }
  };

  const handleRegister = async () => {
    setError(null);
    try {
      await userApi.register(form.username, form.email, form.password);
      await userApi.login(form.username, form.password);
      await refreshUser();
    } catch (e: any) {
      setError(e?.response?.data?.detail || t("register_error", language));
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Paper sx={{ p: 4, minWidth: 320, opacity: 0.97 }}>
        <Box display="flex" justifyContent="flex-end" mb={1}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="lang-select-label">{t("language", language)}</InputLabel>
            <Select
              labelId="lang-select-label"
              value={language}
              label={t("language", language)}
              onChange={e => setLanguage(e.target.value as any)}
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="da">Dansk</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: 700 }}>
          {t("welcome_title", language)}
        </Typography>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label={t("login_tab", language)} />
          <Tab label={t("register_tab", language)} />
        </Tabs>
        <Box mt={2}>
          <TextField
            label={t("username", language)}
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            autoComplete="username"
          />
          {tab === 1 && (
            <TextField
              label={t("email", language)}
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
              autoComplete="email"
            />
          )}
          <TextField
            label={t("password", language)}
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2 }}
            autoComplete={tab === 0 ? "current-password" : "new-password"}
          />
          {error && <Alert severity="error">{error}</Alert>}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={tab === 0 ? handleLogin : handleRegister}
            sx={{ mt: 2 }}
          >
            {tab === 0 ? t("login_button", language) : t("register_button", language)}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginRegister;