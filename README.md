# TripMate — Smart Travel, Mobility & Emergency Safety Companion

**TripMate** is a high-performance, presentation-ready React web application engineered with a modern travel-tech aesthetic. It combines deep navy backgrounds, crisp surface panels, teal/emerald accents, subtle borders, and accessible typography. TripMate delivers comprehensive multi-modal travel intelligence paired with an interactive, simulated emergency safety companion.

> ⚠️ **Demonstration Notice**: TripMate operates entirely in **Demo Mode**. All GPS coordinates, transit telemetry, weather readings, and emergency SOS triggers are client-side simulations. TripMate does **NOT** transmit real SMS alerts, collect background hardware GPS telemetry, or connect to live emergency dispatch lines (911/110/112).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Local Development
```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev

# 3. Open in your browser
http://localhost:5173/
```

### 📱 Opening on Another Device / Mobile (Local Wi-Fi)
To test responsive mobile layouts on an iPhone, Android device, or tablet on the same Wi-Fi network:
```bash
npm run dev -- --host
```
Vite will print your local network address in the terminal:
```text
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.1.xxx:5173/
```
Simply open the `http://192.168.1.xxx:5173/` URL in your mobile browser.

### Production Build & Preview
```bash
# Run production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🛠 Technology Stack

- **Framework**: React 19 (JavaScript / JSX)
- **Bundler & Tooling**: Vite 8
- **Styling**: Tailwind CSS v4 + Custom Dark Navy Design Tokens
- **Icons**: Lucide React
- **Data Visualizations**: Recharts (`ResponsiveContainer`, `AreaChart`, `BarChart`, `PieChart`)
- **Mapping**: Leaflet 1.9 with CartoDB Voyager / OpenStreetMap tiles + Offline Vector Schematic Fallback
- **Micro-Interactions**: Canvas Confetti
- **Deployment**: Vercel SPA Configuration (`vercel.json`)

---

## 🌟 Core Application Features

### 1. Overview Dashboard
- **Personalized Header & Expedition Clock**: Live clock with dynamic destination indicators.
- **Start / End Journey Lifecycle**: Interactive demo journey controller. Starting an expedition activates live telemetry, records start timestamps, and unlocks progress controls; ending records the trip to recent history.
- **Interactive Route Map (`InteractiveMap`)**:
  - Live CartoDB Voyager tiles with custom waypoint markers, polylines, and popups.
  - Automatic error listener that detects missing tiles and triggers a graceful offline vector schematic fallback.
- **Summary Metrics**: Real-time cards for Journeys Completed, Total Distance (`km`/`mi` toggle), Travel Time, and Estimated CO₂ Abated. Clicking any card opens a telemetry snapshot modal.
- **Active Journey Panel**: Visual progress bar tracking multi-modal segments (Walking → Metro → Shinkansen) with a 1-click **Advance Segment** simulator.
- **Recent Journeys List**: Filterable expedition archive with date, distance, duration, and modal icons.
- **Weekly Activity & Modal Split Charts**: Interactive Recharts components displaying distance, hours, or emissions with period comparisons.
- **Contextual Travel Insights & Sustainable Tip**: Dynamic card linking directly to `#insights`, with an interactive tip adoption button.
- **Emergency Dispatch Widget**: Direct route to Safety Center and quick-call consular shortcuts.

### 2. My Journeys & Trip Chains
- **Structured Trip Chains**: Models realistic travel chains (Home → Walking → Bus → Cafe Stop → Walking → Destination) rather than isolated coordinates.
- **Filter & Search**: Instant filtering by status (In Progress, Completed, Upcoming, Draft) and transport mode (Walking, Bus, Train, Multimodal), with sorting by date, distance, duration, and title.
- **Create Journey Dialog**: Full form validation for origin, destination, travel dates, status, distance, duration, and transit mode. Includes instant local storage persistence and celebratory confetti.
- **Edit & Delete Actions**: Edit trip metadata or delete trips with accessible confirmation dialogs.
- **Empty & Error States**: Graceful empty search results and instant demo data restore shortcuts.

### 3. Trip Details
- **Expedition Switcher**: Switch between active demo expeditions (Kyoto Cultural Odyssey, Swiss Alps Traverse, Amalfi Coast Explorer, Reykjavik Aurora Route).
- **Dual Map / Schematic Modes**: Toggle between live interactive Leaflet maps and vector schematic route diagrams with telemetry coordinates.
- **Interactive Multi-Modal Timeline**:
  - Add segment dialog with type, origin, destination, distance, duration, and departure time.
  - Edit and delete individual segments with confirmation.
  - Reorder segments up and down the chain.
- **Day-by-Day Itinerary**: Expandable day schedules with checklist task toggles.
- **Gear & Packing Vault**: Categorized checklists (Documents, Electronics, Clothing, Health, Gear) with progress meters and item creation.
- **Budget & Expense Tracker**: Track expenditures against trip budget with category breakdowns.

### 4. Travel Insights & Eco-Mobility
- **Dynamic Metric Aggregation**: All stats derive dynamically from `journeys` data in state and `localStorage`:
  - Total Distance (`km` or `mi` dynamically converted).
  - Total Travel Time & Average Trip Duration.
  - Journey Count & Active Multi-Modal Chains.
  - Estimated Net CO₂ Footprint and Total CO₂ Abated vs Private Car.
- **Interactive Date Range Filters**:
  - All Time, Last 7 Days, Last 30 Days, Last 90 Days, Oct 2026, and Custom Range with start/end date pickers.
- **Documented Emission Factors (UK DEFRA 2024 / EEA Standards)**:
  - Transparent benchmark coefficients: Walking ($0\text{ g/km}$), Bicycle ($0\text{ g/km}$), Rail ($35\text{ g/km}$), Bus ($89\text{ g/km}$), Ferry ($112\text{ g/km}$), Private Car ($171\text{ g/km}$), Flight ($244\text{ g/km}$).
  - Configurable Factors Modal allowing users to inspect or customize emission values.
- **Transport Mode Breakdown**: Recharts donut chart with segment count, distance, and CO₂ toggles.
- **Daily Distance Time-Series**: Recharts AreaChart with gradient styling and metric selectors.
- **Equivalent Distance Comparison**: Recharts BarChart comparing actual emissions against hypothetical private car and flight travel.
- **Dynamic Sustainability Recommendations**: Rule-based green transit recommendations based on active data.
- **CSV Activity Export**: One-click download generating a formatted `.csv` report of all journeys and segment telemetry.

### 5. Safety Center & ICE Vault
- **Accidental Activation Guard**: SOS trigger prompts a two-step confirmation modal with a 5-second cancelable countdown timer.
- **Simulated Emergency Session**:
  - High-visibility pulsating emergency session banner.
  - Live elapsed session timer updating every second.
  - Mock dispatch payload manifest with mock coordinates, embassy contacts, and alert status.
  - Prominent **End Emergency Session** action that returns the app safely to idle state.
- **Trusted Contact Management (ICE)**: Add, edit, and remove emergency contacts with phone numbers, relations, and notification toggles.
- **Consular & Embassy Directory**: Searchable directory for host countries (Japan, Switzerland, Italy, Iceland) with emergency hotlines and addresses.
- **"I'm Safe" Check-In Simulator**: Log non-emergency safety check-in pings with battery status and custom notes.

### 6. Saved Places & Geofencing
- **Geofencing Safe Zones**: Create and inspect saved places with names, categories (Hotel, Tourist Spot, Checkpoint, Dining, Transit Hub), coordinates, and perimeter radii ($100\text{m}$ to $1,500\text{m}$).
- **Interactive Map Perimeters**: Leaflet map displays color-coded circular geofence perimeters.
- **Simulate Entry / Exit Actions**: Generate visible demo geofence events with contextual notifications and event log history.
- **Event History Log**: Filterable chronological log of simulated perimeter triggers.

### 7. Settings & Data Portability
- **Measurement Preferences**: Toggle between Kilometers (`km`) and Miles (`mi`), Celsius (`°C`) and Fahrenheit (`°F`).
- **Currency Configuration**: USD (`$`), EUR (`€`), JPY (`¥`), GBP (`£`).
- **Emergency Beacon Sensitivity**: Standard (5s window), High Alert (3s window), or Discreet.
- **Data Export & Backup**: Download complete companion state as clean JSON backup.
- **Reset Demo Data**: Restore default seed journeys and clear browser local storage modifications.

---

## ☁️ Deployment & Vercel Configuration

TripMate is packaged with `vercel.json` for client-side single page app (SPA) routing:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Deploying to Vercel
1. Install Vercel CLI (or connect via GitHub):
   ```bash
   npm i -g vercel
   ```
2. Run deployment:
   ```bash
   vercel
   ```
3. Build Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

---

## ⚠️ Demo Limitations & Compliance Disclaimers

1. **Client-Side Simulation**: All analytics, waypoints, and transit statuses run client-side in React state and `localStorage`.
2. **No Actual Emergency Dispatch**: The SOS simulator does not dial 911, contact local emergency services, or transmit actual cellular SMS messages.
3. **Mock Telemetry**: Coordinates and route trajectories are curated demo representations of Kyoto, Switzerland, Amalfi, and Reykjavik. Real hardware GPS background tracking is not performed.
4. **Emissions Modeling**: Carbon values are estimated using standard published DEFRA 2024 emission factors, not measured vehicle sensor outputs.
5. **Browser Persistence**: Custom journeys, edited segments, and contacts persist in the user's browser via `localStorage`. Clearing browser data or clicking "Reset Demo Data" in Settings restores default seed data.
