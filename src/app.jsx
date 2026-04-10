import { useEffect, useMemo, useState } from "react";

const LEGACY_STORAGE_KEY = "travel-planner-itinerary-v1";
const DATABASE_KEY = "travel-planner-db-v1";
const THEME_KEY = "travel-planner-theme";

const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const weekdayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = startDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonthDays - i);
    cells.push({ date, currentMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({ date, currentMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (startDay + daysInMonth) + 1;
    const date = new Date(year, month + 1, nextDay);
    cells.push({ date, currentMonth: false });
  }

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

function loadDatabase() {
  try {
    const raw = localStorage.getItem(DATABASE_KEY);
    if (!raw) {
      return { users: {} };
    }

    const parsed = JSON.parse(raw);
    return {
      users: parsed?.users && typeof parsed.users === "object" ? parsed.users : {},
    };
  } catch {
    return { users: {} };
  }
}

function loadLegacyEntries() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function AuthScreen({ onAuthenticate }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    const result = onAuthenticate({
      mode,
      username: trimmedUsername,
      password: password.trim(),
    });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError("");
    setUsername("");
    setPassword("");
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Travel Planner</h1>
        {mode === "signup" && <h2 className="auth-title">Create your account</h2>}

        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter username"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) {
                  setError("");
                }
              }}
              placeholder="Enter password"
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="auth-actions">
            <button type="submit" className="primary-btn auth-submit">
              {mode === "signup" ? "Create Account" : "Log In"}
            </button>

            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setMode((prev) => (prev === "login" ? "signup" : "login"));
                setError("");
              }}
            >
              {mode === "login"
                ? "New user? Create your account"
                : "Already have an account? Log in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EntryModal({ date, entry, onClose, onSave, onDelete }) {
  const dateKey = formatDateKey(date);
  const [place, setPlace] = useState(entry?.place || "");
  const [details, setDetails] = useState(entry?.details || "");

  const dayName = weekdays[date.getDay()];
  const monthName = months[date.getMonth()];
  const fullDateLabel = `${dayName}, ${monthName} ${date.getDate()}, ${date.getFullYear()}`;

  function handleSubmit(e) {
    e.preventDefault();

    onSave({
      dateKey,
      dayName,
      fullDateLabel,
      place: place.trim(),
      details: details.trim(),
    });
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="modal-label">Selected Date</p>
            <h2>{fullDateLabel}</h2>
            <p className="modal-subtext">
              {entry
                ? "View or edit your saved itinerary."
                : "No itinerary found. Add your plan for this day."}
            </p>
          </div>

          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="entry-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Day</label>
              <input type="text" value={dayName} readOnly />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input type="text" value={dateKey} readOnly />
            </div>
          </div>

          <div className="form-group">
            <label>Place</label>
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Enter city, destination, or attraction"
              required
            />
          </div>

          <div className="form-group">
            <label>Plan Details</label>
            <textarea
              rows="8"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Write your itinerary, route, timings, places to visit, bookings, notes, and anything else..."
              required
            />
          </div>

          <div className="form-actions">
            <div>
              {entry && (
                <button
                  type="button"
                  className="delete-btn"
                  onClick={() => onDelete(dateKey)}
                >
                  Delete Entry
                </button>
              )}
            </div>

            <div className="action-group">
              <button type="button" className="secondary-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn">
                {entry ? "Save Changes" : "Add Itinerary"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || "light";
    } catch {
      return "light";
    }
  });
  const [database, setDatabase] = useState(() => loadDatabase());

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(DATABASE_KEY, JSON.stringify(database));
  }, [database]);

  const userEntries = authenticatedUser
    ? database.users[authenticatedUser]?.entries || {}
    : {};

  const weeks = useMemo(
    () => getMonthMatrix(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const selectedKey = selectedDate ? formatDateKey(selectedDate) : null;
  const selectedEntry = selectedKey ? userEntries[selectedKey] : null;

  function handleAuthenticate({ mode, username, password }) {
    const existingUser = database.users[username];

    if (mode === "signup") {
      if (existingUser) {
        return { ok: false, message: "That username already exists." };
      }

      const isFirstUser = Object.keys(database.users).length === 0;
      const legacyEntries = isFirstUser ? loadLegacyEntries() : {};
      const nextDatabase = {
        users: {
          ...database.users,
          [username]: {
            password,
            entries: legacyEntries,
          },
        },
      };

      setDatabase(nextDatabase);
      setAuthenticatedUser(username);
      return { ok: true };
    }

    if (!existingUser) {
      return { ok: false, message: "No user found! Please create an account." };
    }

    if (existingUser.password !== password) {
      return { ok: false, message: "Incorrect username or password. Try again." };
    }

    setAuthenticatedUser(username);
    return { ok: true };
  }

  function goPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  }

  function goNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  }

  function updateUserEntries(nextEntries) {
    if (!authenticatedUser) {
      return;
    }

    setDatabase((prev) => ({
      users: {
        ...prev.users,
        [authenticatedUser]: {
          ...prev.users[authenticatedUser],
          entries: nextEntries,
        },
      },
    }));
  }

  function handleSave(entry) {
    updateUserEntries({
      ...userEntries,
      [entry.dateKey]: entry,
    });
    setSelectedDate(null);
  }

  function handleDelete(dateKey) {
    const updatedEntries = { ...userEntries };
    delete updatedEntries[dateKey];
    updateUserEntries(updatedEntries);
    setSelectedDate(null);
  }

  function handleLogout() {
    setAuthenticatedUser(null);
    setSelectedDate(null);
  }

  if (!authenticatedUser) {
    return (
      <div className={`app-shell ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
        <div className="page-container">
          <header className="hero-section auth-hero">
            <div className="hero-top-row">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                aria-label="Toggle dark and light mode"
              >
                <span className={`toggle-track ${theme === "dark" ? "active" : ""}`}>
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">
                  {theme === "dark" ? "Dark" : "Light"} Mode
                </span>
              </button>
            </div>
          </header>

          <AuthScreen onAuthenticate={handleAuthenticate} />
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${theme === "dark" ? "theme-dark" : "theme-light"}`}>
      <div className="page-container">
        <header className="hero-section">
          <div className="hero-top-row">
            <div className="hero-badge">
              <span className="badge-dot" />
              Signed in as {authenticatedUser}
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="theme-toggle"
                onClick={() => setTheme((prev) => (prev === "light" ? "dark" : "light"))}
                aria-label="Toggle dark and light mode"
              >
                <span className={`toggle-track ${theme === "dark" ? "active" : ""}`}>
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">
                  {theme === "dark" ? "Dark" : "Light"} Mode
                </span>
              </button>

              <button type="button" className="secondary-btn" onClick={handleLogout}>
                Log Out
              </button>
            </div>
          </div>

          <div className="hero-content-card hero-content-card-simple">
            <div className="hero-text-block hero-text-block-centered">
              <h1>Travel Planner</h1>
              <p>
                Your itinerary is stored in local storage under your account. Click any
                date in the calendar to add, edit, or remove your plans.
              </p>
            </div>
          </div>
        </header>

        <section className={`calendar-wrapper ${selectedDate ? "blurred" : ""}`}>
          <div className="calendar-topbar">
            <div>
              <p className="section-label">Monthly View</p>
              <h2>
                {months[currentMonth]} {currentYear}
              </h2>
            </div>

            <div className="nav-buttons">
              <button className="secondary-btn" onClick={goPrevMonth}>
                ← Previous
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  setCurrentMonth(today.getMonth());
                  setCurrentYear(today.getFullYear());
                }}
              >
                Today
              </button>
              <button className="secondary-btn" onClick={goNextMonth}>
                Next →
              </button>
            </div>
          </div>

          <div className="calendar-table">
            <div className="calendar-header-row">
              {weekdayShort.map((day) => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIndex) => (
              <div className="calendar-week-row" key={weekIndex}>
                {week.map(({ date, currentMonth: isCurrentMonth }) => {
                  const key = formatDateKey(date);
                  const hasEntry = Boolean(userEntries[key]);
                  const isToday = key === formatDateKey(today);

                  return (
                    <button
                      key={key}
                      className={`calendar-cell ${
                        isCurrentMonth ? "current-month" : "outside-month"
                      } ${hasEntry ? "has-entry" : ""}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="cell-top">
                        <div className={`date-badge ${isToday ? "today" : ""}`}>
                          {date.getDate()}
                        </div>

                        {hasEntry && <span className="planned-tag">Planned</span>}
                      </div>

                      <div className="cell-content">
                        {hasEntry ? (
                          <>
                            <h3>{userEntries[key].place}</h3>
                            <p>{userEntries[key].details}</p>
                            <span className="view-plan-chip">Open plan</span>
                          </>
                        ) : (
                          <p className="empty-text">Click to add itinerary</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>

      {selectedDate && (
        <EntryModal
          date={selectedDate}
          entry={selectedEntry}
          onClose={() => setSelectedDate(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default App;
