import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import { trainApi } from "../services/api";

const RequirementsChart: React.FC = () => {
  const { language } = useLanguage();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainApi.getRequirements()
      .then((res) => {
        console.log("API requirements response", res); // debug
        if (Array.isArray(res)) {
          setData(res);
        } else if (res && typeof res === "object") {
          setData(Object.values(res));
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        console.error("Erreur API requirements", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data.length) return <div>{t('no_requirements', language) || "Aucun besoin à afficher"}</div>;

  const dates = data.map(d => d.date);
  const testDrivers = data.map(d => d.test_drivers);
  const locomotives = data.map(d => d.locomotives);

  return (
    <Plot
      data={[
        {
          x: dates,
          y: testDrivers,
          type: "bar",
          name: t("test_drivers", language) || "Conducteurs d'essai",
          marker: { color: "#1976d2" }
        },
        {
          x: dates,
          y: locomotives,
          type: "bar",
          name: t("locomotives", language) || "Locomotives",
          marker: { color: "#ff9800" }
        }
      ]}
      layout={{
        barmode: "group",
        title: t("requirements_by_day", language) || "Besoins par jour",
        xaxis: { title: t("Date", language) || "Date" },
        yaxis: { title: t("quantity", language) || "Quantité" },
        legend: { orientation: "h" },
        height: 400,
        margin: { l: 60, r: 30, t: 60, b: 60 },
        plot_bgcolor: "#f3f6fa",
        paper_bgcolor: "#e3e7ee",
      }}
      config={{ responsive: true, displayModeBar: false }}
      style={{ width: "100%", borderRadius: 12, boxShadow: "0 2px 12px #bbb" }}
    />
  );
};

export default RequirementsChart;