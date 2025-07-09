import React from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  Tooltip,
  Box,
  Typography,
  //useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TrainIcon from "@mui/icons-material/Train";
import BarChartIcon from "@mui/icons-material/BarChart";
import BusinessIcon from "@mui/icons-material/Business";
import TimelineIcon from "@mui/icons-material/Timeline";
import MapIcon from "@mui/icons-material/Map";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import HistoryIcon from "@mui/icons-material/History";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";

/**
 * Navigation items configuration for the side navigation bar.
 * Each item contains an id, a translation key, and an icon.
 */
const navItems = [
  { id: "dashboard", labelKey: "dashboard", icon: <DashboardIcon /> },
  { id: "trains", labelKey: "trains", icon: <TrainIcon /> },
  { id: "statistics", labelKey: "statistics", icon: <BarChartIcon /> },
  { id: "depots", labelKey: "depots", icon: <BusinessIcon /> },
  { id: "gantt", labelKey: "global_gantt_title", icon: <TimelineIcon /> },
  { id: "map", labelKey: "Carte", icon: <MapIcon /> },
  { id: "game", labelKey: "game", icon: <SportsEsportsIcon /> },
  { id: "history", labelKey: "history", icon: <HistoryIcon /> },
];

interface SideNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * SideNav component.
 * Displays a vertical sidebar with navigation icons.
 * Shows the label under each icon, highlights the active tab,
 * and displays a decorative bar at the bottom.
 * Uses translations according to the selected language.
 */
const SideNav: React.FC<SideNavProps> = ({ activeTab, onTabChange }) => {
  const { language } = useLanguage();
  //const theme = useTheme();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 90,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: 90,
          boxSizing: "border-box",
          marginTop: "64px", // Offset below the main header
          height: "calc(100% - 64px)",
          background: "linear-gradient(180deg,#23272F 60%, #757575 100%)",
          borderRight: "none",
          boxShadow: "2px 0 12px 0 rgba(0,0,0,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 2,
        },
        display: { xs: "none", md: "block" }, // Hide on mobile/tablet
      }}
      open
    >
      {/* Vertical list of navigation tabs */}
      <List sx={{ width: "100%", p: 0, mt: 1 }}>
        {navItems.map((item) => (
          <Tooltip
            title={
              <Typography fontSize={14}>{t(item.labelKey, language)}</Typography>
            }
            placement="right"
            arrow
            key={item.id}
          >
            <ListItemButton
              key={item.id}
              selected={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
              sx={{
                my: 0.7,
                mx: 1,
                borderRadius: 2.5,
                background:
                  activeTab === item.id
                    ? "linear-gradient(90deg,#ff1744 0%,#fff 100%)"
                    : "rgba(255,255,255,0.04)",
                boxShadow:
                  activeTab === item.id
                    ? "0 2px 12px 0 rgba(255,23,68,0.10)"
                    : "none",
                "&:hover": {
                  background:
                    "linear-gradient(90deg,#ff1744 0%,#fff 100%)",
                  boxShadow: "0 2px 12px 0 rgba(255,23,68,0.13)",
                  transform: "scale(1.06)",
                },
                transition: "all 0.18s",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                py: 1.2,
                px: 0,
                minHeight: 56,
                gap: 0.5,
              }}
            >
              {/* Main icon for the tab */}
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  justifyContent: "center",
                  color: activeTab === item.id ? "#d32f2f" : "#fff",
                  filter: activeTab === item.id
                    ? "drop-shadow(0 0 8px #ff1744cc)"
                    : "none",
                  fontSize: 28,
                  transition: "filter 0.2s, color 0.2s",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {/* Label under the icon for clarity */}
              <Typography
                variant="caption"
                sx={{
                  color: activeTab === item.id ? "#d32f2f" : "#fff",
                  fontWeight: activeTab === item.id ? 700 : 500,
                  letterSpacing: 0.5,
                  fontSize: 11,
                  mt: 0.5,
                  textAlign: "center",
                  textShadow: activeTab === item.id
                    ? "0 1px 4px #fff"
                    : "0 1px 4px #23272F",
                  transition: "color 0.2s, text-shadow 0.2s",
                  lineHeight: 1.1,
                  userSelect: "none",
                }}
              >
                {t(item.labelKey, language)}
              </Typography>
            </ListItemButton>
          </Tooltip>
        ))}
      </List>
      {/* Decorative bottom bar to recall the main color */}
      <Box
        sx={{
          mt: "auto",
          mb: 1,
          width: "60%",
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg,#ff1744 0%,#fff 100%)",
          opacity: 0.7,
        }}
      />
    </Drawer>
  );
};

export default SideNav;