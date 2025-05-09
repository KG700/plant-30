import { getDate } from "../utils";
import { Calendar } from "../components/Calendar";

interface PageDateNavigationProps {
  daysAgoActive: number;
  setDaysAgoActive: (daysAgo: number) => void;
}

export function PageDateNavigation({
  daysAgoActive,
  setDaysAgoActive,
}: Readonly<PageDateNavigationProps>) {
  function getDateButtonLabel(date: Date) {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "numeric",
    };

    return date.toLocaleDateString("en-GB", options);
  }

  function getStaticButtonLabel(daysAgo: 0 | 1) {
    return daysAgo === 0 ? "Today" : "Yesterday";
  }

  function getNavButtons() {
    const days = [6, 5, 4, 3, 2, 1, 0];
    return (
      <div style={{ display: "flex" }}>
        <Calendar
          daysAgoActive={daysAgoActive}
          setDaysAgoActive={setDaysAgoActive}
        />
        {days.map((day: number) => (
          <button
            className={daysAgoActive === day ? "active" : ""}
            onClick={() => setDaysAgoActive(day)}
            key={day}
          >
            {day == 0 || day == 1
              ? getStaticButtonLabel(day)
              : getDateButtonLabel(getDate(day))}
          </button>
        ))}
      </div>
    );
  }

  return <nav>{getNavButtons()}</nav>;
}
