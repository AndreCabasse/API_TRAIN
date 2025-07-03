import React, { useState } from "react";
import { Box, Button, TextField, Typography, Tabs, Tab, Alert, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { userApi } from "../services/userApi";
import { useUser } from "../contexts/UserContext";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import bgImage from "../assets/FOND_DSB.jpg";
import dsbLogo from "../assets/DSB1.png";

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
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "row",
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Bandeau vertical à gauche pour le login/register */}
      <Box
        sx={{
          width: { xs: "100vw", sm: 420 },
          minWidth: 320,
          maxWidth: 480,
          height: "100vh",
          background: `rgba(40, 40, 50, 0.55)`,
          boxShadow: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderTopRightRadius: 40,
          borderBottomRightRadius: 40,
          backdropFilter: "blur(10px)",
          position: "relative",
          overflow: "hidden",
          borderRight: "1.5px solid rgba(255,255,255,0.18)",
        }}
      >
        {/* Effet décoratif de bulles/flou */}
        {/* Léger effet de halo blanc pour la profondeur */}
        <Box sx={{
          position: "absolute",
          top: -60,
          left: -60,
          width: 180,
          height: 180,
          bgcolor: "rgba(255,255,255,0.08)",
          borderRadius: "50%",
          filter: "blur(18px)",
          zIndex: 0,
        }} />
        <Box sx={{
          position: "absolute",
          bottom: -40,
          right: -40,
          width: 120,
          height: 120,
          bgcolor: "rgba(255,255,255,0.10)",
          borderRadius: "50%",
          filter: "blur(14px)",
          zIndex: 0,
        }} />
        <Box display="flex" justifyContent="flex-end" width="100%" mb={1} pr={2} zIndex={1}>
          <FormControl size="small" sx={{ minWidth: 110 }}>
            <InputLabel id="lang-select-label" sx={{ color: "#fff" }}>{t("language", language)}</InputLabel>
            <Select
              labelId="lang-select-label"
              value={language}
              label={t("language", language)}
              onChange={e => setLanguage(e.target.value as any)}
              sx={{ color: "#fff", '.MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                '.MuiSvgIcon-root': { color: '#fff' },
                '& .MuiInputLabel-root': { color: '#fff' } }}
            >
              <MenuItem value="fr">Français</MenuItem>
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="da">Dansk</MenuItem>
            </Select>
          </FormControl>
        </Box>
        {/* Logo DSB centré */}
        <Box sx={{ width: 110, height: 110, mb: 1.5, mt: -2, zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={dsbLogo} alt="DSB logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }} />
        </Box>
        <Typography variant="h4" align="center" sx={{ mb: 2, fontWeight: 800, letterSpacing: 1, color: "#fff", zIndex: 1, textShadow: "0 2px 8px rgba(0,0,0,0.22)" }}>
          {t("welcome_title", language)}
        </Typography>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          centered
          sx={{ mb: 2, width: "100%", zIndex: 1,
            '& .MuiTab-root': { color: '#e3e3e3', fontWeight: 600 },
            '& .Mui-selected': { color: '#fff' },
            '& .MuiTabs-indicator': { background: '#fff' },
          }}
        >
          <Tab label={t("login_tab", language)} sx={{ width: "50%" }} />
          <Tab label={t("register_tab", language)} sx={{ width: "50%" }} />
        </Tabs>
        <Box mt={1} width="85%" zIndex={1}>
          <TextField
            label={t("username", language)}
            name="username"
            value={form.username}
            onChange={handleChange}
            fullWidth
            sx={{ mb: 2, borderRadius: 2, background: "rgba(30,30,40,0.85)",
              input: { color: '#ffe082' },
              label: { color: '#ffe082', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.45)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
            }}
            InputLabelProps={{ style: { color: '#ffe082', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.45)' } }}
            autoComplete="username"
          />
          {tab === 1 && (
            <TextField
              label={t("email", language)}
              name="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2, borderRadius: 2, background: "rgba(30,30,40,0.85)",
                input: { color: '#ffe082' },
                label: { color: '#ffe082', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.45)' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
              }}
              InputLabelProps={{ style: { color: '#ffe082', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.45)' } }}
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
            sx={{ mb: 2, borderRadius: 2, background: "rgba(30,30,40,0.85)",
              input: { color: '#ffe082' },
              label: { color: '#ffe082', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.45)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
            }}
            InputLabelProps={{ style: { color: '#ffe082', fontWeight: 700, textShadow: '0 1px 8px rgba(0,0,0,0.45)' } }}
            autoComplete={tab === 0 ? "current-password" : "new-password"}
          />
          {error && <Alert severity="error" sx={{ mb: 1, background: 'rgba(255,0,0,0.13)', color: '#fff', fontWeight: 600 }}>{error}</Alert>}
          <Button
            variant="contained"
            color="error"
            fullWidth
            onClick={tab === 0 ? handleLogin : handleRegister}
            sx={{ mt: 1, py: 1.2, fontWeight: 700, fontSize: "1.1rem", borderRadius: 2, boxShadow: 2, background: 'linear-gradient(90deg,#d32f2f,#ff1744)', color: '#fff', backdropFilter: 'blur(2px)' }}
          >
            {tab === 0 ? t("login_button", language) : t("register_button", language)}
          </Button>
        </Box>
      </Box>
      {/* Partie droite vide, laisse voir le fond */}
      <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
    </Box>
  );
};

export default LoginRegister;