import { useState } from "react";
import { getDate } from "../utils";
import { Day } from "../components/Day";
import { Week } from "../components/Week";
import { LogoutButton } from "../components/LogoutButton";
import { HomeNavigation } from "../components/HomeNavigation";
import { PageDateNavigation } from "../components/PageDateNavigation";

export function Home() {
  const [isDayView, setIsDayView] = useState(true);
  const [daysAgoActive, setDaysAgoActive] = useState(0);

  function getDisplayDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return date.toLocaleDateString("en-GB", options);
  }

  function getFormattedDate(date: Date) {
    const nowDate = new Date();
    const today = nowDate.setHours(0, 0, 0, 0);
    if (date.setHours(0, 0, 0, 0) === today) return "today";

    const yesterdayDate = new Date(nowDate.setDate(nowDate.getDate() - 1));
    const yesterday = yesterdayDate.setHours(0, 0, 0, 0);
    if (date.setHours(0, 0, 0, 0) === yesterday) return "yesterday";

    const day = `0${date.getDate()}`.slice(-2);
    const month = `0${date.getMonth() + 1}`.slice(-2);
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  return (
    <div className="App" data-testid="today-view">
      <header className="App-header">
        <LogoutButton />
        <h1>30 Plants</h1>
        <PageDateNavigation
          daysAgoActive={daysAgoActive}
          setDaysAgoActive={setDaysAgoActive}
        />
        <HomeNavigation setIsDayView={setIsDayView} />
        <p>
          <span style={{ fontWeight: "bold" }}>
            {!isDayView && ` ${getDisplayDate(getDate(daysAgoActive + 6))} -`}
            {` ${getDisplayDate(getDate(daysAgoActive))}`}
          </span>
        </p>
        {isDayView ? (
          <Day pageDate={getFormattedDate(getDate(daysAgoActive))} />
        ) : (
          <Week pageDate={getFormattedDate(getDate(daysAgoActive))} />
        )}
      </header>
    </div>
  );
}
