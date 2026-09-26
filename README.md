# 🚆 Find Your Train — AI-Powered Train Tracking & Delay Prediction

A real-time train tracking and intelligent delay prediction web application. It combines an interactive MapTiler/MapLibre map with machine-learning-driven delay and root-cause predictions powered by FastAPI and LightGBM models.

---

## 🌟 Key Features

- **Interactive Geospatial Map**: Real-time visualization of train routes, checkpoints, and station markers with custom styles using MapTiler & MapLibre GL.
- **Machine Learning Delay Forecasting**: Dedicated LightGBM models predicting real-time delays and primary delay causes (weather, network congestion, etc.).
- **Real-Time Condition Updates**: Dynamic updates for train speeds, weather conditions, and congestion levels.
- **Single-Command Launch**: Orchestrated startup of both FastAPI backend and Vite frontend via `concurrently`.

---

## 📁 Project Structure

```text
├── backend/            # FastAPI ML backend service
│   ├── app/            # API routes, state managers, and ML services
│   ├── data/           # Train network & route GeoJSON data
│   ├── requirements.txt
│   └── 12301/, 36835/, 63296/, 64423/  # Pretrained ML models per train
│
├── frontend/           # React + TypeScript + Vite frontend
│   ├── src/            # Components, hooks, stores, and pages
│   ├── .env.example    # Environment variable template
│   └── package.json
│
├── .gitignore          # Root gitignore protecting secrets & build artifacts
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)

### 2. Configure Environment Variables
Inside `frontend/`, create a `.env` file (copy from `.env.example`):
```bash
cd frontend
cp .env.example .env
```
Add your free [MapTiler Cloud API Key](https://cloud.maptiler.com/account/keys/):
```env
VITE_MAPTILER_API_KEY=your_key_here
```
Add your free [Openweathermap API](https://openweathermap.org/api):
```env
VITE_OPENWEATHERMAP_API_KEY=your_key_here
```

### 3. Install Dependencies
```bash
# Backend dependencies
cd backend
pip install -r requirements.txt

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Run Both Servers (Single Command)
From the `frontend/` directory:
```bash
npm start
```
* Or from the project root:
```bash
npm.cmd --prefix frontend start
```
