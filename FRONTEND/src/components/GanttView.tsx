
import { Box, Container, Typography, Paper } from "@mui/material";
import AllTrainsGanttChart from "./AllTrainsGanttChart";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { Shape } from "plotly.js";
import { useEffect, useState } from "react";
import { trainApi } from "../services/api";
dayjs.extend(isoWeek);

// Fonction utilitaire pour barres et numéros de semaine
export function getWeekLinesAndAnnotations(startDate: string, endDate: string) {
  const shapes: Partial<Shape>[] = [];
  const annotations: any[] = [];
  let current = dayjs(startDate).startOf('isoWeek');
  const end = dayjs(endDate);
  while (current.isBefore(end)) {
    shapes.push({
      type: 'line',
      x0: current.format('YYYY-MM-DDTHH:mm:ss'),
      x1: current.format('YYYY-MM-DDTHH:mm:ss'),
      yref: 'paper',
      y0: 0,
      y1: 1,
      line: {
        color: '#b71c1c',
        width: 2,
        dash: 'dot'
      },
      opacity: 0.7
    });
    annotations.push({
      x: current.format('YYYY-MM-DDTHH:mm:ss'),
      yref: 'paper',
      y: 1.04,
      showarrow: false,
      text: `S${current.isoWeek()}`,
      font: { color: '#b71c1c', size: 13, family: "Roboto, Arial, sans-serif" },
      bgcolor: '#fff',
      opacity: 0.9,
      xanchor: 'center'
    });
    current = current.add(1, 'week');
  }
  return { shapes, annotations };
}

const GanttView = () => {
  const { language } = useLanguage();
  const [mode, setMode] = useState<'simulation' | 'optimise'>('simulation');
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [optimisedData, setOptimisedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    trainApi.getAllTrainsGantt().then((data) => {
      setSimulationData(data);
      setLoading(false);
    });
    trainApi.getOptimizedTrains().then((data) => {
      setOptimisedData(data);
    });
  }, []);

  const handleModeChange = (newMode: 'simulation' | 'optimise') => {
    setMode(newMode);
  };

  const ganttData = mode === 'simulation' ? simulationData : optimisedData;

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ mb: 3, color: "#D32F2F", letterSpacing: 1 }}
        >
          {t('global_gantt_title', language) || t('gantt_chart', language) || "Diagramme de Gantt global des trains"}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <button
            onClick={() => handleModeChange('simulation')}
            style={{
              background: mode === 'simulation' ? '#D32F2F' : '#fff',
              color: mode === 'simulation' ? '#fff' : '#D32F2F',
              border: '1px solid #D32F2F',
              borderRadius: 8,
              padding: '8px 20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'all 0.2s',
            }}
          >
            Gantt simulation
          </button>
          <button
            onClick={() => handleModeChange('optimise')}
            style={{
              background: mode === 'optimise' ? '#D32F2F' : '#fff',
              color: mode === 'optimise' ? '#fff' : '#D32F2F',
              border: '1px solid #D32F2F',
              borderRadius: 8,
              padding: '8px 20px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: 16,
              transition: 'all 0.2s',
            }}
          >
            Gantt optimisé
          </button>
        </Box>
        <Paper
          sx={{
            p: { xs: 1, sm: 4 },
            mb: 4,
            borderRadius: 4,
            boxShadow: 6,
            background: "#fff",
            minHeight: 850,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            {loading ? (
              <Typography variant="h6" color="text.secondary">Chargement…</Typography>
            ) : (
              <AllTrainsGanttChart
                height={800}
                showLegend
                legendOrientation="h"
                language={language}
                getWeekLinesAndAnnotations={getWeekLinesAndAnnotations}
                data={ganttData}
              />
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default GanttView;