import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from "react-leaflet";
import { trainApi } from "../services/api";
import { Box, Slider, Typography, Card, CardContent } from "@mui/material";
import "leaflet/dist/leaflet.css";

const TimelapseMap: React.FC = () => {
  const [timelapseData, setTimelapseData] = useState<any[]>([]);
  const [timePoints, setTimePoints] = useState<string[]>([]);
  const [currentTimeIdx, setCurrentTimeIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les données du backend
  useEffect(() => {
    trainApi.getTimelapseData().then((data) => {
      setTimelapseData(data);
      // Extraire tous les instants uniques
      const allTimes = data.flatMap(train =>
        train.positions.flatMap((p: any) => [p.debut, p.fin])
      );
      const uniqueTimes = Array.from(new Set(allTimes)).sort();
      setTimePoints(uniqueTimes);
    });
  }, []);

  // Animation automatique
  const play = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setCurrentTimeIdx(idx => {
        if (idx < timePoints.length - 1) return idx + 1;
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return idx;
      });
    }, 800);
  };
  const pause = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  // Nettoyage à la destruction
  useEffect(() => () => pause(), []);

  // Afficher les trains présents à l’instant courant
  const currentTime = timePoints[currentTimeIdx];
  const trainsAtCurrent = timelapseData.map(train => {
    const pos = train.positions.find((p: any) => p.debut <= currentTime && currentTime <= p.fin);
    return pos ? { ...train, pos } : null;
  }).filter(Boolean);

  // Centre de la carte
  const allDepots = timelapseData.flatMap(t => t.positions.map((p: any) => [p.lat, p.lon]));
  const center = allDepots.length
    ? [
        allDepots.reduce((sum, [lat]) => sum + lat, 0) / allDepots.length,
        allDepots.reduce((sum, [, lon]) => sum + lon, 0) / allDepots.length,
      ]
    : [55.6, 12.4];

  return (
    <Card sx={{ mt: 3, mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Timelapse des trains sur la carte
        </Typography>
        <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
          <button onClick={play}>▶️</button>
          <button onClick={pause}>⏸️</button>
          <Slider
            min={0}
            max={timePoints.length - 1}
            value={currentTimeIdx}
            onChange={(_, v) => setCurrentTimeIdx(v as number)}
            sx={{ width: 300 }}
          />
          <Typography variant="body2">{currentTime && new Date(currentTime).toLocaleString()}</Typography>
        </Box>
        <MapContainer center={center as [number, number]} zoom={6} style={{ height: 500, width: "100%" }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          {trainsAtCurrent.map((train: any, idx: number) => (
            <Marker key={train.train_id} position={[train.pos.lat, train.pos.lon]}>
              <Tooltip>{train.train_nom} ({train.pos.depot})</Tooltip>
            </Marker>
          ))}
          {/* Optionnel : tracer les trajets */}
          {timelapseData.map((train, idx) => (
            <Polyline
              key={train.train_id}
              positions={train.positions.map((p: any) => [p.lat, p.lon])}
              color="#d32f2f"
              opacity={0.3}
            />
          ))}
        </MapContainer>
      </CardContent>
    </Card>
  );
};

export default TimelapseMap;