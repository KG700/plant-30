import { useState } from "react";
import { Day } from "../components/Day";
import { Week } from "../components/Week";
import { LogoutButton } from "../components/LogoutButton";
import { HomeNavigation } from "../components/HomeNavigation";

export function Home() {
  const [isDayView, setIsDayView] = useState(true);
  const [isTodayActive, setIsTodayActive] = useState(true);

  function getDisplayDate(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };

    return date.toLocaleDateString("en-GB", options);
  }

  function getFormattedDate(date: Date){
    const now = new Date();
    const today = now.setHours(0,0,0,0);
    const yesterday = (new Date(now.setDate(now.getDate() - 1))).setHours(0,0,0,0);

    if (date.setHours(0,0,0,0) === today) return 'today';
    if (date.setHours(0,0,0,0) === yesterday) return 'yesterday';

    const day = `0${date.getDate()}`.slice(-2);
    const month = `0${date.getMonth()}`.slice(-2);
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  function getDate() {
    const now = new Date();
    if (isTodayActive) {
      return now;
    }
    return new Date(now.setDate(now.getDate() - 1))
  }

  function getWeekAgoDate(pageDate: Date) {
    return new Date(pageDate.setDate(pageDate.getDate() - 6));
  }

  return (
    <div className="App" data-testid="today-view">
      <header className="App-header">
        <LogoutButton />
        <h1>30 Plants</h1>
        <nav>
          <button className={!isTodayActive ? "active" : ""} onClick={() => setIsTodayActive(false)}>Yesterday</button>
          <button className={isTodayActive ? "active" : ""} onClick={() => setIsTodayActive(true)}>Today</button>
        </nav>
        <HomeNavigation setIsDayView={setIsDayView} />
        <p>
          Plants eaten:{" "}
          <span style={{ fontWeight: "bold" }}>
            {!isDayView && ` ${getDisplayDate(getWeekAgoDate(getDate()))} -`}
            {` ${getDisplayDate(getDate())}`}
          </span>
        </p>
        {isDayView ? <Day pageDate={getFormattedDate(getDate())}/> : <Week pageDate={getFormattedDate(getDate())}/>}
      </header>
    </div>
  );
}
