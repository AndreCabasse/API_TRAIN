import React, { useEffect, useState } from "react";
import { Box, Typography, Button, TextField, Paper, Alert } from "@mui/material";
import { useUser } from "../contexts/UserContext";
import { userApi } from "../services/userApi";

/**
 * ProfileView component.
 * Displays the user's profile information and preferences.
 * Allows editing and saving user preferences (as JSON).
 * Handles error display and authentication state.
 */
const ProfileView: React.FC = () => {
  const { user, refreshUser } = useUser();
  // Local state for preferences (editable JSON object)
  const [prefs, setPrefs] = useState<any>(user?.preferences || {});
  // Edit mode toggle
  const [edit, setEdit] = useState(false);
  // Error message state
  const [error, setError] = useState<string | null>(null);

  // Update local preferences state when user changes
  useEffect(() => {
    setPrefs(user?.preferences || {});
  }, [user]);

  /**
   * Save preferences to the backend.
   * Calls the API and refreshes user data on success.
   * Handles and displays errors if saving fails.
   */
  const handleSave = async () => {
    setError(null);
    try {
      await userApi.savePreferences(prefs);
      await refreshUser();
      setEdit(false);
    } catch (e: any) {
      setError(e?.response?.data?.detail || "Error while saving preferences");
    }
  };

  // If not authenticated, show a message
  if (!user) return <div>Not connected</div>;

  return (
    <Box maxWidth={500} mx="auto" mt={4}>
      <Paper sx={{ p: 3 }}>
        {/* User profile header */}
        <Typography variant="h5" gutterBottom>
          Profile of {user.username}
        </Typography>
        <Typography>Email: {user.email}</Typography>
        {/* Preferences section */}
        <Typography variant="h6" mt={2}>
          Preferences
        </Typography>
        {/* Editable JSON preferences field */}
        {edit ? (
          <TextField
            value={JSON.stringify(prefs, null, 2)}
            onChange={e => {
              try {
                setPrefs(JSON.parse(e.target.value));
                setError(null);
              } catch {
                setError("Invalid JSON format");
              }
            }}
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
        {/* Error message display */}
        {error && <Alert severity="error">{error}</Alert>}
        {/* Edit and Save/Cancel buttons */}
        <Button onClick={() => setEdit(!edit)} sx={{ mr: 2 }}>
          {edit ? "Cancel" : "Edit"}
        </Button>
        {edit && (
          <Button onClick={handleSave} variant="contained">
            Save
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default ProfileView;