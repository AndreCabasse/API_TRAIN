// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, Circle } from "react-leaflet";
import { trainApi } from "../services/api";
import { Box, Slider, Typography, Card, CardContent, Paper, IconButton, Divider } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";

// For calculating the week number of the year
function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // @ts-ignore
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

// Automatic offset if multiple trains are at the same location
function getOffsetForTrain(trainsAtCurrent: any[], train: any) {
  const samePos = trainsAtCurrent.filter(
    t => t.pos.lat === train.pos.lat && t.pos.lon === train.pos.lon
  );
  const localIdx = samePos.findIndex(t => t.train_id === train.train_id);
  return -18 - localIdx * 22;
}

// Utility function to create a DivIcon with the train name and a vertical offset
const getTrainNameIcon = (name: string, offsetY = -18) =>
  new L.DivIcon({
    html: `<div style="
      position: relative;
      display: inline-block;
      transform: translateY(${offsetY}px);
    ">
      <div style="
        background: #fff;
        border: 2px solid #d32f2f;
        border-radius: 8px;
        padding: 2px 8px;
        font-weight: 500;
        color: #d32f2f;
        font-size: 13px;
        min-width: 30px;
        box-shadow: 0 2px 6px #0002;
        text-align: center;
        ">
        ${name}
      </div>
      <div style="
        position: absolute;
        left: 50%;
        top: 100%;
        transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 7px solid transparent;
        border-right: 7px solid transparent;
        border-top: 10px solid #d32f2f;
      "></div>
    </div>`,
    className: "",
    iconAnchor: [25, 38],
  });

const TimelapseMap: React.FC = () => {
  const [timelapseData, setTimelapseData] = useState<any[]>([]);
  const [timePoints, setTimePoints] = useState<string[]>([]);
  const [currentTimeIdx, setCurrentTimeIdx] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { language } = useLanguage();

  // Load data from the backend
  useEffect(() => {
    trainApi.getTimelapseData().then((data) => {
      setTimelapseData(data);
      const allTimes = (Array.isArray(data) ? data : []).flatMap(train =>
        Array.isArray(train.positions) ? train.positions.flatMap((p: any) => [p.debut, p.fin]) : []
      );
      const uniqueTimes = Array.from(new Set(allTimes)).sort();
      setTimePoints(uniqueTimes);
    });
  }, []);

  // Automatic animation
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

  useEffect(() => () => pause(), []);

  const currentTime = timePoints[currentTimeIdx];
  const trainsAtCurrent = timelapseData.map(train => {
    const pos = train.positions.find((p: any) => p.debut <= currentTime && currentTime <= p.fin);
    return pos ? { ...train, pos } : null;
  }).filter(Boolean);

  const allDepots = (Array.isArray(timelapseData) ? timelapseData : []).flatMap(t =>
  Array.isArray(t.positions) ? t.positions.map((p: any) => [p.lat, p.lon]) : []
  );
  const center = allDepots.length
    ? [
        allDepots.reduce((sum, [lat]) => sum + lat, 0) / allDepots.length,
        allDepots.reduce((sum, [, lon]) => sum + lon, 0) / allDepots.length,
      ]
    : [55.6, 12.4];

  // Calculate the week number of the year
  let weekStr = "";
  if (currentTime) {
    const dateObj = new Date(currentTime);
    const week = getWeekNumber(dateObj);
    weekStr = `${t("week", language)} ${week}`;
  }

  return (
    <Card
      sx={{
        mt: 4,
        mb: 4,
        borderRadius: 4,
        boxShadow: 6,
        background: "linear-gradient(135deg, #f8fafc 0%, #e3e7ed 100%)",
      }}
    >
      <CardContent>
        <Typography variant="h5" fontWeight={700} gutterBottom color="primary">
          {t("timelapse_trains_title", language)}
        </Typography>
        <Paper
          elevation={2}
          sx={{
            mb: 3,
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            background: "#fff8",
            borderRadius: 2,
          }}
        >
          <IconButton color="primary" onClick={play} size="large">
            <PlayArrowIcon />
          </IconButton>
          <IconButton color="primary" onClick={pause} size="large">
            <PauseIcon />
          </IconButton>
          <Slider
            min={0}
            max={timePoints.length - 1}
            value={currentTimeIdx}
            onChange={(_, v) => setCurrentTimeIdx(v as number)}
            sx={{
              width: 300,
              mx: 2,
              color: "#d32f2f",
              "& .MuiSlider-thumb": { boxShadow: 2 },
            }}
          />
        </Paper>
        <Divider sx={{ mb: 2 }} />
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: 3,
            border: "2px solid #e0e0e0",
            position: "relative",
            minHeight: 540,
          }}
        >
          {/* Date shown */}
          <Box
            sx={{
              position: "absolute",
              top: 32,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 3,
              px: 4,
              py: 1,
              boxShadow: 3,
              border: "2px solid #d32f2f",
              fontWeight: 700,
              fontSize: 28,
              color: "#d32f2f",
              letterSpacing: 1,
              textAlign: "center",
              minWidth: 320,
              maxWidth: "90vw",
              overflow: "hidden",
              whiteSpace: "nowrap",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <span>{currentTime ? new Date(currentTime).toLocaleString(language) : ""}</span>
            <span style={{ fontSize: 18, color: "#555", fontWeight: 500 }}>{weekStr}</span>
          </Box>
          <MapContainer center={center as [number, number]} zoom={6} style={{ height: 500, width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png" />
            {/* full trip */}
            {(Array.isArray(timelapseData) ? timelapseData : []).map((train, idx) => (
              <Polyline
                key={train.train_id + "_future"}
                positions={(Array.isArray(train.positions) ? train.positions : []).map((p: any) => [p.lat, p.lon])}
                color="#bbb"
                opacity={0.3}
                dashArray="5,10"
              />
            ))}
            {/* trip in red */}
            {(Array.isArray(timelapseData) ? timelapseData : []).map((train, idx) => {

              const pastPositions = Array.isArray(train.positions)
                ? train.positions.filter((p: any) => p.debut <= currentTime)
                : [];
              if (pastPositions.length < 2) return null;
              return (
                <Polyline
                  key={train.train_id + "_past"}
                  positions={pastPositions.map((p: any) => [p.lat, p.lon])}
                  color="#d32f2f"
                  weight={4}
                  opacity={0.8}
                />
              );
            })}
            {/* Train markers with name and offset if multiple */}
            {(Array.isArray(trainsAtCurrent) ? trainsAtCurrent : []).map((train: any, idx: number) => (
              <Marker
                key={train.train_id}
                position={[train.pos.lat, train.pos.lon]}
                icon={getTrainNameIcon(train.train_nom, getOffsetForTrain(trainsAtCurrent, train))}
              >
                <Tooltip direction="top" offset={[0, -20]}>
                  <b>{train.train_nom}</b> ({t("depot", language)}: {train.pos.depot})
                </Tooltip>
                <Circle
                  center={[train.pos.lat, train.pos.lon]}
                  radius={2500}
                  pathOptions={{ color: "#d32f2f", fillOpacity: 0.2, weight: 2 }}
                />
              </Marker>
            ))}
          </MapContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TimelapseMap;