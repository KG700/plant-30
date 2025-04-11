import { useEffect, useState } from "react";

export function HomeNavigation({
  setIsDayView,
}: Readonly<{ setIsDayView: (isDayView: boolean) => void }>) {
  const [isDayActive, setIsDayActive] = useState(true);

  useEffect(() => {
    setIsDayView(isDayActive);
  }, [isDayActive]);

  return (
    <nav className="home-navbar">
      <button
        className={`home-navbar-item ${isDayActive ? "active" : ""}`}
        onClick={() => setIsDayActive(true)}
      >
        Day
      </button>
      <button
        className={`home-navbar-item ${!isDayActive ? "active" : ""}`}
        onClick={() => setIsDayActive(false)}
      >
        Week
      </button>
    </nav>
  );
}
