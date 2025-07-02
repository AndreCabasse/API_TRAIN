import React, { useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { createTheme } from "@mui/material/styles";
import { UserProvider, useUser } from "./contexts/UserContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import TrainManagement from "./components/TrainManagement";
import StatisticsView from "./components/StatisticsView";
import DepotView from "./components/DepotView";
import GanttView from "./components/GanttView";
import MapView from "./components/MapView";
import SideNav from "./components/SideNav";
import GameView from "./components/GameView";
import ProfileView from "./components/ProfileView";
import LoginRegister from "./components/LoginRegister";
import HistoryView from "./components/HistoryView";
import Box from '@mui/material/Box';

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function MainApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useUser();

  if (!user) {
    // Affiche le formulaire de connexion/inscription si non connecté
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginRegister />
      </ThemeProvider>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "trains":
        return <TrainManagement />;
      case "statistics":
        return <StatisticsView />;
      case "depots":
        return <DepotView />;
      case "gantt":
        return <GanttView />;
      case "map":
        return <MapView />;
      case "game":
        return <GameView />;
      case "profile":
        return <ProfileView />;
      case "history":
        return <HistoryView />;
      default:
        return <Dashboard />;
    }
  };

return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <Box sx={{ display: "flex" }}>
        <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
        <Box
          sx={{
            flexGrow: 1,
            marginTop: 8,
            p: 2,
            minHeight: "100vh",
            position: "relative", // Ajouté
            overflow: "hidden",   // Ajouté
            backgroundImage: 'url("/FOND_DSB.jpg")',
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            transition: "background-image 0.3s",
          }}
        >
          {/* Overlay d'opacité */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              bgcolor: "rgba(255,255,255,0.65)", // Opacité blanche, ajuste la valeur si besoin
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
          {/* Contenu au-dessus de l'overlay */}
          <Box sx={{ position: "relative", zIndex: 1 }}>
            {renderContent()}
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <UserProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </UserProvider>
  );
}

export default App;