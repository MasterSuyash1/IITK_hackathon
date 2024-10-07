# TokenTitans - Optimizing Public Transportation Efficiency

## Team Members:
- **Suyash Srivastav**  
- **Yadvendra Garg**  
- **Arpit Mishra**  
- **Md Sadiq Hasan Ansari**

This project is developed as part of the **BuzzOnEarth India Hackathon 2024**. The goal of this project is to design an AI-based system that optimizes public transportation schedules and routes to reduce fuel consumption, minimize carbon emissions, and improve the convenience of city residents.

## Problem Statement

**Objective**:  
The current public transportation systems often suffer from inefficient scheduling and route planning, leading to overcrowded buses, traffic delays, and increased carbon emissions. This project aims to build an AI-based solution to optimize these systems by dynamically adjusting schedules and routes based on traffic conditions, fuel consumption, and passenger convenience.

## Features

- **AI-based Route Optimization**: Dynamically adjusts public transportation routes in real-time based on traffic patterns.
- **Fuel Efficiency**: Reduces unnecessary trips, leading to lower fuel consumption and reduced carbon emissions.
- **Passenger Convenience**: Minimizes waiting times and ensures better route coverage for city residents.
- **Sustainable Transportation**: Promotes eco-friendly solutions and reduces urban air pollution.

## Tech Stack

- **Programming Language**: Python, JavaScript
- **Libraries/Frameworks**: 
  - Machine Learning libraries (e.g., `scikit-learn`, `pandas`, etc.)
  - Data visualization tools: `matplotlib`, `plotly`, `seaborn`
  - Map Generation: `Shapely`, `Folium`
  - GTFS kit
  - Frontend: `React`
  - Backend: `Flask`
  - 3D Model: `Spline`

## Process to Run the App

### Backend Server
1. Install the required libraries:
   ```bash
   pip install -r requirements.txt
   ```
   or for macOS:
   ```bash
   pip3 install -r requirements.txt
   ```

2. Run the backend server:
   ```bash
   python analysis_apis.py
   ```
   or for macOS:
   ```bash
   python3 analysis_apis.py
   ```

### Frontend Server
1. Install the node modules:
   ```bash
   npm install
   ```

2. Start the frontend server:
   ```bash
   npm run start
   ```

### Note:
If you are running your code in Codespaces, go to `configContext.js` and change the base URL there. Otherwise, uncomment the `http://127.0.0.1:5000` line to set the correct backend URL.
