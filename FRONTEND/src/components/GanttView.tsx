import { Box, Container, Typography, Paper, Button } from "@mui/material";
import AllTrainsGanttChart from "./AllTrainsGanttChart";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { Shape } from "plotly.js";
import { useEffect, useState } from "react";
import { trainApi } from "../services/api";
dayjs.extend(isoWeek);

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
      text: `W${current.isoWeek()}`,
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
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [optimizedData, setOptimizedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOptimized, setShowOptimized] = useState(false);
  const [modifications, setModifications] = useState<any[]>([]);

  // Charger le Gantt simulation au montage
  useEffect(() => {
    setLoading(true);
    trainApi.getAllTrainsGantt().then((data) => {
      setSimulationData(data);
      setLoading(false);
    });
  }, []);

  // Charger le Gantt optimisé à la demande
  const loadOptimized = async () => {
    setLoading(true);
    const res = await trainApi.getAllTrainsGanttOptimized();
    setOptimizedData(res.gantt || []);
    setModifications(res.modifications || []);
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3, color: "#D32F2F", letterSpacing: 1 }}>
        {t('global_gantt_title', language) || t('gantt_chart', language) || "Global Gantt chart for trains"}
      </Typography>
      <Box mb={2}>
        <Button
          variant={showOptimized ? "contained" : "outlined"}
          color="error"
          onClick={async () => {
            if (!optimizedData.length) await loadOptimized();
            setShowOptimized((v) => !v);
          }}
        >
          {showOptimized ? t("show_simulation_gantt", language) : t("show_optimized_gantt", language) || "Afficher le Gantt optimisé"}
        </Button>
      </Box>
      <Paper sx={{ p: { xs: 1, sm: 4 }, mb: 4, borderRadius: 4, boxShadow: 6, background: "#fff", minHeight: 850 }}>
        <Box sx={{ flexGrow: 1 }}>
          {loading ? (
            <Typography variant="h6" color="text.secondary">Loading…</Typography>
          ) : (
            <AllTrainsGanttChart
              height={800}
              showLegend
              legendOrientation="h"
              language={language}
              getWeekLinesAndAnnotations={getWeekLinesAndAnnotations}
              data={showOptimized ? optimizedData : simulationData}
              optimized={showOptimized}
            />
          )}
        </Box>
      </Paper>
      {showOptimized && modifications.length > 0 && (
        <Paper sx={{ mt: 2, p: 2, borderRadius: 2, background: "#FFF5F5" }}>
          <Typography variant="h6" color="error" gutterBottom>
            {t("optimized_changes", language) || "Modifications apportées par l'optimisation"}
          </Typography>
          <ul>
            {modifications.map((mod: any, idx: number) => (
              <li key={idx}>
                {mod.train ? (
                  <>
                    <b>{mod.train}</b> : {mod.description || `déplacé de ${mod.from} à ${mod.to}`}
                  </>
                ) : (
                  JSON.stringify(mod)
                )}
              </li>
            ))}
          </ul>
        </Paper>
      )}
    </Container>
  );
};

export default GanttView;