import { useEffect, useState } from "react";

export function HomeNavigation({
  setActiveTab,
  activeTab,
}: Readonly<{ setActiveTab: (activeTab: string) => void; activeTab: string }>) {
  useEffect(() => {
    setActiveTab(activeTab);
  }, [activeTab]);

  return (
    <nav className="home-navbar">
      <button
        className={`home-navbar-item ${activeTab === "day" ? "active" : ""}`}
        onClick={() => setActiveTab("day")}
      >
        Day
      </button>
      <button
        className={`home-navbar-item ${activeTab === "week" ? "active" : ""}`}
        onClick={() => setActiveTab("week")}
      >
        Week
      </button>
      <button
        className={`home-navbar-item ${activeTab === "recomendations" ? "active" : ""}`}
        onClick={() => setActiveTab("recomendations")}
      >
        Recommendations
      </button>
    </nav>
  );
}
