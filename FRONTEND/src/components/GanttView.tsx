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

/**
 * Utility function to generate vertical week lines and week number annotations for the Gantt chart.
 * Adds a vertical line and annotation for each ISO week between startDate and endDate.
 */
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

/**
 * Main component for displaying the global Gantt chart view.
 * Only displays the simulation Gantt (no optimized mode).
 */
const GanttView = () => {
  const { language } = useLanguage();
  const [simulationData, setSimulationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch simulation Gantt data on mount
  useEffect(() => {
    setLoading(true);
    trainApi.getAllTrainsGantt().then((data) => {
      setSimulationData(data);
      setLoading(false);
    });
  }, []);

  return (
    <>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          gutterBottom
          sx={{ mb: 3, color: "#D32F2F", letterSpacing: 1 }}
        >
          {t('global_gantt_title', language) || t('gantt_chart', language) || "Global Gantt chart for trains"}
        </Typography>
        {/* Gantt chart display */}
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
              <Typography variant="h6" color="text.secondary">Loading…</Typography>
            ) : (
              <AllTrainsGanttChart
                height={800}
                showLegend
                legendOrientation="h"
                language={language}
                getWeekLinesAndAnnotations={getWeekLinesAndAnnotations}
                data={simulationData}
              />
            )}
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default GanttView;