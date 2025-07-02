import { Box, Container, Typography, Paper } from "@mui/material";
import AllTrainsGanttChart from "./AllTrainsGanttChart";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import type { Shape } from "plotly.js";
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
            <AllTrainsGanttChart
              height={800}
              showLegend
              legendOrientation="h"
              language={language}
              getWeekLinesAndAnnotations={getWeekLinesAndAnnotations}
            />
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default GanttView;