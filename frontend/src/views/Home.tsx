import { useState } from "react";
import { Day } from "../components/Day";
import { Week } from "../components/Week";
import { LogoutButton } from "../components/LogoutButton";
import { HomeNavigation } from "../components/HomeNavigation";

export function Home() {
  const [isDayView, setIsDayView] = useState(true);
  const [isTodayActive] = useState(true);

  function getFormattedDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return date.toLocaleDateString("en-GB", options);
  }

  function getDate() {
    return new Date();
  }

  function getWeekAgoDate() {
    const now = new Date();
    return new Date(now.setDate(now.getDate() - 6));
  }

  return (
    <div className="App" data-testid="today-view">
      <header className="App-header">
        <LogoutButton />
        <h1>30 Plants</h1>
        <button className={isTodayActive ? "active" : ""}>Today</button>
        <HomeNavigation setIsDayView={setIsDayView} />
        <p>
          Plants eaten:{" "}
          <span style={{ fontWeight: "bold" }}>
            {!isDayView && ` ${getFormattedDate(getWeekAgoDate())} -`}
            {` ${getFormattedDate(getDate())}`}
          </span>
        </p>
        {isDayView ? <Day /> : <Week />}
      </header>
    </div>
  );
}
