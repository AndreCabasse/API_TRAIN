// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

import React, { useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../utils/translations";
import { trainApi } from "../services/api";

/**
 * RequirementsChart component.
 * Fetches and displays the daily requirements for test drivers and locomotives as a grouped bar chart.
 * Handles loading state, API errors, and supports internationalization.
 */
const RequirementsChart: React.FC = () => {
  const { language } = useLanguage();
  // State for requirements data fetched from the API
  const [data, setData] = useState<any[]>([]);
  // Loading state for API call
  const [loading, setLoading] = useState(true);

  // Fetch requirements data on mount
  useEffect(() => {
    trainApi.getRequirements()
      .then((res) => {
        // Accept both array and object API responses
        if (Array.isArray(res)) {
          setData(res);
        } else if (res && typeof res === "object") {
          setData(Object.values(res));
        } else {
          setData([]);
        }
      })
      .catch((err) => {
        // Log and handle API errors
        console.error("Erreur API requirements", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Show loading spinner while fetching data
  if (loading) return <div>Loading...</div>;
  // Show message if no requirements data is available
  if (!data.length) return <div>{t('no_requirements', language) || "Aucun besoin à afficher"}</div>;

  // Extract chart data arrays from API response
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
        // Group bars by date
        barmode: "group",
        // Chart title and axis labels (translated)
        title: t("requirements_by_day", language) || "Besoins par jour",
        xaxis: { title: t("Date", language) || "Date" },
        yaxis: { title: t("quantity", language) || "Quantité" },
        legend: { orientation: "h" },
        // Chart appearance
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