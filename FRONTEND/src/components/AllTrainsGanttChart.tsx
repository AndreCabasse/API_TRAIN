import Plot from "react-plotly.js";
import { useEffect, useState } from "react";
import { trainApi } from "../services/api";
import type { Shape } from "plotly.js";
import { t, Language } from "../utils/translations";

// Palette de rouges harmonisée
const redPalette = {
  main: "#D32F2F",
  light: "#FF6659",
  lighter: "#FFEAEA",
  veryLight: "#FFF5F5",
  dark: "#9A0007",
  accent: "#FF1744",
  faded: "#f8d7da",
  faded2: "#fbe9e7",
  faded3: "#fff0f0",
};

type GanttTrain = {
  train_id: number;
  train_nom: string;
  depot: string;
  voie: number | null;
  debut: string;
  fin: string;
  type: string;
  electrique: boolean;
  waiting?: boolean;
};

const DEPOT_COLORS = [
  "#D32F2F", // rouge principal
  "#FF6659", // rouge clair
  "#ff9800", // orange
  "#388e3c", // vert
  "#7b1fa2", // violet
  "#0097a7", // bleu canard
  "#c2185b", // rose foncé
  "#fbc02d", // jaune
];
const depotColorMap = new Map<string, string>();
function getColorForDepot(depot: string) {
  if (!depotColorMap.has(depot)) {
    depotColorMap.set(depot, DEPOT_COLORS[depotColorMap.size % DEPOT_COLORS.length]);
  }
  return depotColorMap.get(depot)!;
}

interface AllTrainsGanttChartProps {
  height?: number;
  showLegend?: boolean;
  legendOrientation?: "h" | "v";
  language: string;
  getWeekLinesAndAnnotations?: (startDate: string, endDate: string) => { shapes: Partial<Shape>[]; annotations: any[] };
}

const AllTrainsGanttChart = ({
  height = 800,
  showLegend = true,
  legendOrientation = "h",
  language,
  getWeekLinesAndAnnotations,
}: AllTrainsGanttChartProps) => {
  const [data, setData] = useState<GanttTrain[]>([]);
  useEffect(() => {
    trainApi.getAllTrainsGantt().then(setData);
  }, []);

  // Pour n'afficher chaque dépôt qu'une seule fois dans la légende
  const depotFirstIndex = new Map<string, number>();
  data.forEach((d, i) => {
    if (!depotFirstIndex.has(d.depot)) {
      depotFirstIndex.set(d.depot, i);
    }
  });

  // Effet zebra sur les lignes
  const yCategories = Array.from(new Set(data.map(d => d.train_nom)));
  const zebraShapes = yCategories.map((train, idx) => ({
    type: "rect" as const,
    xref: "paper" as const,
    yref: "y" as const,
    x0: 0,
    x1: 1,
    y0: train,
    y1: train,
    fillcolor: idx % 2 === 0 ? redPalette.veryLight : "#fff",
    opacity: 0.5,
    layer: "below" as const,
    line: { width: 0 },
  }));

  // Barres plus fines si beaucoup de trains
  const barWidth = yCategories.length > 25 ? 12 : 22;

  const plotData = data.map((d, i) => ({
    x: [d.debut, d.fin],
    y: [d.train_nom, d.train_nom],
    mode: "lines",
    line: {
      width: barWidth,
      color: getColorForDepot(d.depot),
      shape: "hv",
      dash: "solid",
    },
    marker: {
      line: { color: "#222", width: 2 }
    },
    name: d.depot,
    text: `<b>${t("train_name", language as Language)}:</b> ${d.train_nom}<br>` +
          `<b>${t("depot", language as Language)}:</b> ${d.depot}<br>` +
          `<b>${t("track", language as Language)}:</b> ${d.voie ?? t("waiting", language as Language)}`,
    hoverinfo: "text",
    showlegend: depotFirstIndex.get(d.depot) === i,
  }));

  // Calcul période affichée pour les semaines
  const minDate = data.length ? data.reduce((min, d) => d.debut < min ? d.debut : min, data[0].debut) : "";
  const maxDate = data.length ? data.reduce((max, d) => d.fin > max ? d.fin : max, data[0].fin) : "";

  // Génère shapes et annotations de semaine si la fonction est fournie
  const weekShapesAndAnnotations = getWeekLinesAndAnnotations && minDate && maxDate
    ? getWeekLinesAndAnnotations(minDate, maxDate)
    : { shapes: [], annotations: [] };

  return (
    <Plot
      data={plotData}
      layout={{
        title: {
          text: t("gantt_chart", language as Language),
          font: { size: 26, color: redPalette.main, family: "Roboto, Arial, sans-serif" },
          x: 0.5,
        },
        yaxis: {
          type: "category",
          title: t("trains", language as Language),
          tickfont: { size: 16, color: "#222" },
          automargin: true,
        },
        xaxis: {
          title: t("date_and_time", language as Language) || t("Date", language as Language),
          tickformat: "%d/%m %H:%M",
          tickangle: yCategories.length > 12 ? -30 : 0,
          automargin: true,
          tickfont: { size: 15, color: "#222" },
        },
        legend: {
          orientation: legendOrientation,
          y: -0.18,
          x: 0.5,
          xanchor: "center",
          font: { size: 15 },
          bgcolor: "#fff",
          bordercolor: "#ccc",
          borderwidth: 1,
          itemwidth: 80,
          itemsizing: "constant",
          title: { text: t("legend", language as Language) }
        },
        height,
        margin: { l: 120, r: 40, t: 80, b: 120 },
        plot_bgcolor: redPalette.veryLight,
        paper_bgcolor: redPalette.lighter,
        showlegend: showLegend,
        shapes: [...zebraShapes, ...(weekShapesAndAnnotations.shapes ?? [])],
        annotations: weekShapesAndAnnotations.annotations ?? [],
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", borderRadius: 16, boxShadow: "0 2px 16px #bbb" }}
    />
  );
};

export default AllTrainsGanttChart;