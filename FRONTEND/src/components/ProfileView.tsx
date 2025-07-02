import React, { useEffect, useState } from "react";
import { Box, Typography, Button, TextField, Paper, Alert } from "@mui/material";
import { useUser } from "../contexts/UserContext";
import { userApi } from "../services/userApi";

const ProfileView: React.FC = () => {
  const { user, refreshUser } = useUser();
  const [prefs, setPrefs] = useState<any>(user?.preferences || {});
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrefs(user?.preferences || {});
  }, [user]);

  const handleSave = async () => {
    setError(null);
    try {
      await userApi.savePreferences(prefs);
      await refreshUser();
      setEdit(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Erreur lors de la sauvegarde");
    }
  };

  if (!user) return <div>Non connecté</div>;

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Profil de {user.username}</Typography>
        <Typography>Email: {user.email}</Typography>
        <Typography variant="h6" mt={2}>Préférences</Typography>
        {edit ? (
          <TextField
            value={JSON.stringify(prefs, null, 2)}
            onChange={e => setPrefs(JSON.parse(e.target.value))}
            multiline
            fullWidth
            minRows={4}
            sx={{ mb: 2 }}
          />
        ) : (
          <pre style={{ background: "#f5f5f5", padding: 10, borderRadius: 4 }}>
            {JSON.stringify(prefs, null, 2)}
          </pre>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        <Button onClick={() => setEdit(!edit)} sx={{ mr: 2 }}>
          {edit ? "Annuler" : "Modifier"}
        </Button>
        {edit && (
          <Button onClick={handleSave} variant="contained">
            Sauvegarder
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default ProfileView;