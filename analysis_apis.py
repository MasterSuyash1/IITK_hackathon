from flask import Flask, request, jsonify
from flask_restful import Api, Resource
from flask_cors import CORS

import os
import io
import datetime
import json
from os import path
from pathlib import Path

import numpy as np
import pandas as pd

# import modin.pandas as pd

import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots

import folium
from shapely.geometry import LineString, Point
from folium.plugins import MarkerCluster, HeatMap
from folium import Marker, Icon, Circle, CircleMarker, GeoJson, PolyLine, Map
from geopy.distance import geodesic

from sklearnex import patch_sklearn
patch_sklearn()

from sklearn import config_context
from sklearn.preprocessing import StandardScaler
from sklearn.preprocessing import OneHotEncoder
import category_encoders as ce
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
# from sklearnex.ensemble import RandomForestRegressor
from xgboost import  XGBRegressor
from sklearn.cluster import KMeans
from sklearn.metrics import mean_absolute_error, mean_squared_error

import daal4py as d4p


from ai_func import init_database, get_sql_chain, get_sql_response

import joblib

import gtfs_kit as gk
from dotenv import load_dotenv

app = Flask(__name__)
CORS(app)

path = Path('data/gtfs-nyc-2023.zip')
feed = gk.read_feed(path, dist_units='km')
# print(feed.validate())

model = None

def clean_feed_data(feed):
#   # Removing the space from the Arrival and Departure Time
  feed.stop_times['arrival_time'] = feed.stop_times['arrival_time'].str.replace(' ', '')
  feed.stop_times['departure_time'] = feed.stop_times['departure_time'].str.replace(' ', '')

  routes_with_no_trips = []
  for idx, row in feed.routes.iterrows():
    if len(feed.trips[feed.trips['route_id'] == row['route_id']]) == 0:
      routes_with_no_trips.append(row['route_id'])
  # Removing all the routes with no trips i.e. routes_with_no_trips
  feed.routes = feed.routes[~feed.routes['route_id'].isin(routes_with_no_trips)]

  return feed

feed = clean_feed_data(feed=feed)
# print(feed.validate())

@app.route('/', methods=['GET'])
def home():
    return jsonify({"message": "Welcome to the GTFS API of New York City!"})

@app.route('/routes', methods=['GET'])
def get_routes():
    """
    API to get the list of routes from the GTFS feed.
    """
    routes_df = feed.routes.fillna('NA')  # Replace NaN with a placeholder like 'NA'
    routes_json = routes_df.to_dict(orient='records')
    
    # print("Routes JSON (after replacing NaN):", routes_json)  # Log modified response
    return jsonify(routes_json), 200

@app.route('/route/<route_id>', methods=['GET'])
def get_route_by_id(route_id):
    """
    API to get the details of a specific route by its ID.
    """
    route = feed.routes[feed.routes['route_id'] == route_id]

    if not route.empty:
        route = route.fillna('NA')  # Replace NaN with 'NA'
        route_json = route.to_dict(orient='records')
        return jsonify(route_json), 200
    else:
        return jsonify({'error': 'Route not found'}), 404

@app.route('/stops', methods=['GET'])
def get_stops():
    """
    API to get the list of all stops from the GTFS feed, replacing NaN values.
    """
    stops_df = feed.stops.fillna("NA")  # Replace NaN with "NA" or choose None to send null
    stops_json = stops_df.to_dict(orient='records')
    return jsonify(stops_json), 200

@app.route('/stop/<stop_id>', methods=['GET'])
def get_stop_by_id(stop_id):
    """
    API to get the details of a specific stop by its ID.
    """
    stop = feed.stops[feed.stops['stop_id'] == stop_id]
    if not stop.empty:
        stop_json = stop.to_dict(orient='records')
        return jsonify(stop_json), 200
    else:
        return jsonify({'error': 'Stop not found'}), 404

@app.route('/trips', methods=['GET'])
def get_trips():
    """
    API to get the list of all trips from the GTFS feed.
    """
    trips_df = feed.trips.fillna('NA')  # Replace NaN with a placeholder like 'NA'
    trips_json = trips_df.to_dict(orient='records')
    
    # print("Trips JSON (after replacing NaN):", trips_json)  # Optional: Log modified response
    return jsonify(trips_json), 200
  
@app.route('/trip/<trip_id>', methods=['GET'])
def get_trip_by_id(trip_id):
    """
    API to get the details of a specific trip by its ID.
    """
    trip = feed.trips[feed.trips['trip_id'] == trip_id]
    if not trip.empty:
        trip_json = trip.fillna('NA').to_dict(orient='records')  # Replace NaN with 'NA'
        return jsonify(trip_json), 200
    else:
        return jsonify({'error': 'Trip not found'}), 404

@app.route('/stop_times/trip/<trip_id>', methods=['GET'])
def get_stop_times_by_trip(trip_id):
    """
    API to get the stop times for a specific trip ID.
    """
    stop_times = feed.stop_times[feed.stop_times['trip_id'] == trip_id]
    if not stop_times.empty:
        stop_times_json = stop_times.to_dict(orient='records')
        return jsonify(stop_times_json), 200
    else:
        return jsonify({'error': 'No stop times found for this trip'}), 404

@app.route('/routes/search/<route_name>', methods=['GET'])
def search_routes_by_name(route_name):
    """
    API to search for routes by their short name or long name.
    """
    routes = feed.routes[(feed.routes['route_short_name'].str.contains(route_name, case=False, na=False) | 
                          feed.routes['route_long_name'].str.contains(route_name, case=False, na=False))]

    if not routes.empty:
        routes_json = routes.to_dict(orient='records')
        return jsonify(routes_json), 200
    else:
        return jsonify({'error': 'No routes found matching the short name'}), 404

@app.route('/routes_with_trips', methods=['GET'])
def get_routes_with_trips():
    # Get the route_id from the query parameters
    route_id = request.args.get('route_id')
    
    if not route_id:
        return jsonify({"error": "route_id is required"}), 400

    # Filter trips based on the provided route_id
    trips_filtered = feed.trips[feed.trips['route_id'] == route_id]

    if trips_filtered.empty:
        return jsonify({"error": "No trips found for the given route_id"}), 404
    
    return jsonify({
        "route_id": route_id,
        "trips": trips_filtered.to_dict(orient='records')
    }), 200

@app.route('/calendar_dates', methods=['GET'])
def get_calendar_dates():
    """
    API to get the list of calendar dates from the GTFS feed.
    """
    calendar_dates = feed.calendar.to_dict(orient='records')
    return jsonify(calendar_dates), 200

@app.route('/api/route_stats', methods=['GET'])
def get_route_stats():
    # Get the date parameter from the query string
    date = request.args.get('date')
    
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError as e:
        return jsonify({'error': f'Invalid date format. Use YYYYMMDD., {e}'}), 400
    
    # date = "".join(date.split("-"))
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    # Compute route_stats for the specific date
    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    cols_round_off = ['mean_headway', 'mean_trip_distance', 'mean_trip_duration', 'service_distance', 'service_duration', 'service_speed']
    route_stats[cols_round_off] = route_stats[cols_round_off].round(2)
    route_stats['mean_trip_duration'] = route_stats['mean_trip_duration'] * 60
    route_stats['service_duration'] = route_stats['service_duration'] * 60
    route_stats[['mean_headway', 'min_headway', 'max_headway']].fillna(0, inplace=True)
    route_stats.fillna('NA',  inplace=True)
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']], on='route_id', how='left')

    # Convert route_stats DataFrame to JSON and return it
    route_stats_json = route_stats.to_dict(orient='records')
    return jsonify({'route_stats': route_stats_json})

def classify_time_of_day(start_time):
    """Classify time of day based on the start_time (HH:MM:SS)."""
    hour = int(start_time.split(":")[0])
    
    if 4 <= hour < 8:
        return 'Morning'
    elif 8 <= hour < 12:
        return "Peak Morning"
    elif 12 <= hour < 16:
        return 'Afternoon'
    elif 16 <= hour < 20:
        return 'Peak Evening'
    elif 20 <=  hour < 24:
        return 'Night'
    else:
        return 'Mid Night'

def classify_time_period(start_time):
    """Classify time period based on the start_time (HH:MM:SS)."""
    hour = int(start_time.split(":")[0])

    for i in range(0, 23, 2):
        if i <= hour < i + 2:
            return f'{i}:00-{i+1}:59'
  

@app.route('/api/trip_stats', methods=['GET'])
def get_trip_stats():
    # Get the date parameter from the query string
    date = request.args.get('date')
    
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    # Add time of day classification
    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    # Now we can analyze trip duration and speed by time of day
    trip_duration_analysis = trip_stats.groupby('time_of_day').agg({
        'trip_id': ['count'],
        'duration': ['mean', 'min', 'max'],  # Analyze duration (in minutes)
        'speed': ['mean', 'min', 'max']     # Analyze speed (km/h)
    }).reset_index()

    trip_period_analysis = trip_stats.groupby("time_period").agg({
        'trip_id': ['count'],
        'duration': ['mean', 'min', 'max'],  # Analyze duration (in minutes)
        'speed': ['mean', 'min', 'max'] 
    }).reset_index()

    trip_duration_cols = ['mean_duration', 'min_duration', 'max_duration', 'mean_speed', 'min_speed', 'max_speed']
    trip_period_cols = ['mean_duration', 'min_duration', 'max_duration', 'mean_speed', 'min_speed', 'max_speed']

    
    # Convert analysis DataFrame to JSON
    trip_duration_analysis.columns = ['time_of_day', 'num_trips', 'mean_duration', 'min_duration', 'max_duration',
                                      'mean_speed', 'min_speed', 'max_speed']
    trip_duration_analysis[trip_duration_cols] = trip_duration_analysis[trip_duration_cols].round(2)
    trip_duration_analysis_json = trip_duration_analysis.to_dict(orient='records')

    trip_period_analysis.columns = ['period_time', 'num_trips', 'mean_duration', 'min_duration', 'max_duration',
                                      'mean_speed', 'min_speed', 'max_speed']
    trip_period_analysis[trip_period_cols] = trip_period_analysis[trip_period_cols].round(2)
    trip_period_analysis_json = trip_period_analysis.to_dict(orient='records')
    
    return jsonify({'trip_duration_analysis': trip_duration_analysis_json, 
                    'trip_period_analysis': trip_period_analysis_json})


@app.route('/api/frequent_routes', methods=['GET'])
def get_frequent_routes():
    # Get the date parameter from the query string
    date = request.args.get('date')
    
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    frequent_routes = route_stats.sort_values(by=['max_headway', 'min_headway']).reset_index(drop=True)
    most_frequent_routes =  frequent_routes.head(10)
    least_frequent_routes =  frequent_routes.iloc[-10::-1]

    most_frequent_routes_json =  most_frequent_routes.to_dict(orient='records')
    least_frequent_routes_json =  least_frequent_routes.to_dict(orient='records')
    return jsonify({'most_frequent_routes': most_frequent_routes_json, 
                    'least_frequent_routes': least_frequent_routes_json}), 200

@app.route('/api/shortest_longest_routes', methods=['GET'])
def get_shortest_longest_routes():
    # Get the date parameter from the query string
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats['mean_trip_distance'] = route_stats['mean_trip_distance'].round(2)
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']],on='route_id', how='left')

    shortest_routes = route_stats.sort_values(by='mean_trip_distance').head(10)
    longest_routes = route_stats.sort_values(by='mean_trip_distance', ascending=False).head(10)

    return jsonify({'shortest_routes': shortest_routes.to_dict(orient='records'), 
                    'longest_routes': longest_routes.to_dict(orient='records')})

@app.route('/api/slowest_fastest_routes', methods=['GET'])
def get_slowest_fastest_routes():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    # Compute trip_stats
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats['service_speed'] = route_stats['service_speed'].round(2)
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    slowest_routes = route_stats.sort_values(by='service_speed').head(10)
    fastest_routes = route_stats.sort_values(by='service_speed', ascending=False).head(10)

    return jsonify({
        'slowest_routes': slowest_routes.to_dict(orient='records'),
        'fastest_routes': fastest_routes.to_dict(orient='records')
    }), 200


@app.route('/api/peak_hour_traffic',  methods=['GET'])
def get_peak_hour_traffic():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']],on='route_id', how='left')

    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    # routes with most traffic during peak hours
    peak_hour_trips =  trip_stats[trip_stats['time_of_day'].str.contains("peak", case=False)]
    peak_hour_routes = peak_hour_trips.groupby('route_id').agg({
        'trip_id': 'count',
        'time_period': 'unique',
    }).reset_index()
    peak_hour_routes['time_period'] = peak_hour_routes['time_period'].apply(lambda x: list(x))
    peak_hour_routes = peak_hour_routes.merge(route_stats)

    return  jsonify({'peak_hour_routes': peak_hour_routes.to_dict(orient='records')}), 200


@app.route('/api/distance_coverage_optimization', methods=['GET'])
def get_distance_coverage_optimization():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    inefficient_routes = route_stats[(route_stats['mean_trip_distance'] > 15) & (route_stats['num_trips'] < 10)]
    inefficient_routes.sort_values(by='mean_trip_distance', ascending=False)

    return  jsonify({'inefficient_routes': inefficient_routes.to_dict(orient='records')}), 200

@app.route('/api/route_efficiency',  methods=['GET'])
def  get_route_efficiency():
    date = request.args.get('date')
    # Validate the date format
    try:
        pd.to_datetime(date, format="%Y%m%d")  # Validate date format
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYYMMDD.'}), 400
    
    trip_stats = feed.compute_trip_stats()

    route_stats = feed.compute_route_stats(trip_stats, dates=[date])
    route_stats = route_stats.merge(feed.routes[['route_id', 'route_long_name', 'route_color']])

    trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
    trip_stats['time_period'] = trip_stats['start_time'].apply(classify_time_period)

    route_trips = trip_stats.groupby(by=['route_id']).agg(
        avg_stops=('num_stops', 'mean'),
        avg_trip_speed=('speed', 'mean')
    ).reset_index()

    route_stats = route_stats.merge(route_trips, on='route_id', how='inner')

    max_service_speed = route_stats['service_speed'].max()
    max_avg_trip_speed = route_stats['avg_trip_speed'].max()
    max_num_trips = route_stats['num_trips'].max()
    max_headway = route_stats['mean_headway'].max()
    max_avg_stops = route_stats['avg_stops'].max()

    route_stats['efficiency_score'] = (0.225 * (route_stats['service_speed'] / max_service_speed) + 
                                       0.225 * (route_stats['avg_trip_speed'] / max_avg_trip_speed) + 
                                       0.225 * (route_stats['num_trips'] / max_num_trips) + 
                                       0.225 * (route_stats['avg_stops'] / max_avg_stops) - 
                                       0.1 * (route_stats['mean_headway'] / max_headway))
    
    return  jsonify({
        'most_efficient_routes': route_stats.sort_values(by=['efficiency_score'], ascending=False).iloc[:10].to_dict(orient='records'),
        'least_efficient_routes':  route_stats.sort_values(by=['efficiency_score'], ascending=True).iloc[:10].to_dict(orient='records')
    }), 200

def clean_time(x):
    date = datetime.datetime.today()
    hr, min, sec = x.split(':')
    if x.startswith('24'):
        date = date + datetime.timedelta(days=1)
        hr = '00'
    x = f"{date.strftime('%Y-%m-%d')} {hr}:{min}:{sec}"
    return x

def get_in_between_stops(trip_id, start_stop_id, end_stop_id):
    stop_times = feed.stop_times

    trip_stop_times = stop_times[stop_times['trip_id'] == trip_id].sort_values(by=['stop_sequence'])

    trip_stop_times['at'] = pd.to_datetime(trip_stop_times['arrival_time'].apply(clean_time))
    trip_stop_times['dt'] = pd.to_datetime(trip_stop_times['departure_time'].apply(clean_time))
    # print(trip_stop_times)

    trip_stop_times['time_diff'] = trip_stop_times.groupby(by="trip_id")['at'].diff().dt.total_seconds() / 60
    trip_stop_times['time_diff'] = trip_stop_times['time_diff'].fillna(0)

    trip_stop_times['shape_dist_traveled'] = trip_stop_times['shape_dist_traveled'].fillna(0)

    trip_stop_times = trip_stop_times.drop(['at', 'dt'], axis=1)

    start_sequence = trip_stop_times[trip_stop_times['stop_id'] == start_stop_id]['stop_sequence'].values[0]
    end_sequence = trip_stop_times[trip_stop_times['stop_id'] == end_stop_id]['stop_sequence'].values[0]

    in_between_stops = trip_stop_times[(trip_stop_times['stop_sequence'] >= start_sequence) &
                                       (trip_stop_times['stop_sequence'] <= end_sequence)]
    
    in_between_stops_details = in_between_stops.merge(feed.stops, on='stop_id', how='left')
    drop_cols = ['location_type', 'parent_station', 'stop_desc', 'stop_headsign', 'stop_timezone', 'stop_url', 'zone_id']
    in_between_stops_details = in_between_stops_details.drop(drop_cols, axis=1)

    return in_between_stops_details

def get_stop_id(stop_name):
    stop_row = feed.stops[feed.stops['stop_name'] == stop_name]
    if not stop_row.empty:
        return stop_row['stop_id'].values[0]
    return None

@app.route('/api/trips_between_stops', methods=['GET'])
def trips_between_stops():
    start_stop_name = request.args.get('start_stop_name')
    end_stop_name = request.args.get('end_stop_name')

    if not start_stop_name or not end_stop_name:
        return jsonify({"error": "start_stop_name and end_stop_name are required"}), 400

    start_stop_id = get_stop_id(start_stop_name)
    end_stop_id = get_stop_id(end_stop_name)

    if not start_stop_id or not end_stop_id:
        return jsonify({"error": "Invalid stop names"}), 404
    
    trips_start_id = feed.stop_times[feed.stop_times['stop_id'] == start_stop_id]['trip_id'].unique()
    trips_end_id = feed.stop_times[feed.stop_times['stop_id'] == end_stop_id]['trip_id'].unique()

    possible_trips = set(trips_start_id).intersection(set(trips_end_id))

    if len(possible_trips) == 0:
        return jsonify({"message": "No routes found between the given stops"}), 404
    
    trips_stats = feed.compute_trip_stats()
    
    trip_ids = list(possible_trips)
    trip_route_infos = trips_stats[trips_stats['trip_id'].isin(trip_ids)].merge(feed.routes[['route_id', 'route_short_name', 'route_long_name', 'route_color']], on='route_id', how='left')

    return  jsonify({
        'start_stop_name':  start_stop_name,
        'end_stop_name': end_stop_name,
        'start_stop_id':  start_stop_id,
        'end_stop_id': end_stop_id,
        'total_results':  len(trip_ids),
        'trips_between_stops': trip_route_infos.to_dict(orient='records')
    }), 200

@app.route('/api/routes_between_stops', methods=['GET'])
def routes_between_stops():
    trip_id = request.args.get('trip_id')
    start_stop_id = request.args.get('start_stop_id')
    end_stop_id = request.args.get('end_stop_id')

    trips_stats = feed.compute_trip_stats()

    trip_route_info = trips_stats[trips_stats['trip_id'] == trip_id].merge(feed.routes[['route_id', 'route_short_name', 'route_long_name', 'route_color']], on='route_id', how='left')

    shape_id = trip_route_info['shape_id'].values[0]
    route_shape = feed.shapes[feed.shapes['shape_id'] == trip_route_info['shape_id'].values[0]].sort_values(
        by=['shape_pt_sequence']
    ).reset_index(drop=True)
    route_shape = route_shape[['shape_pt_lat', 'shape_pt_lon']].values.tolist()

    in_between_stops = get_in_between_stops(trip_id, start_stop_id, end_stop_id)

    
    total_distance = in_between_stops.iloc[-1]['shape_dist_traveled']
    total_duration = in_between_stops.iloc[-1]['time_diff'].sum()

    expected_speed_kmph = total_distance / total_duration

    return jsonify({
        'trip_route_info':  trip_route_info.to_dict(orient='records'),
        'route_shape': route_shape,
        'in_between_stops':  in_between_stops.to_dict(orient='records'),
        'total_distance':  total_distance,
        'expected_duration': total_duration,
        'expected_speed_kmph': expected_speed_kmph
    }), 200

# Load and Preprocess The Data For Model
def load_preprocess_data():
    # Compute trip_stats
    trips_stats = feed.compute_trip_stats()

    # Add time of day classification
    trips_stats['time_of_day'] = trips_stats['start_time'].apply(classify_time_of_day)

    trips_stats['start_hour'] = pd.to_datetime(trips_stats['start_time'].apply(clean_time), format="mixed").dt.hour
    trips_stats['end_hour'] = pd.to_datetime(trips_stats['end_time'].apply(clean_time), format="mixed").dt.hour

    trips_stats['is_peak_hours'] = trips_stats['start_hour'].apply(lambda x: 1 if (8 <= x <= 12 or 16 <= x <= 20) else 0)

    trips_stats1 = trips_stats.merge(feed.trips[['trip_id', 'route_id', 'service_id']], left_on=['trip_id', 'route_id'], right_on=['trip_id', 'route_id'], how='left')

    trips_stats1 = trips_stats1.merge(feed.calendar_dates[['service_id', 'date']], on='service_id', how='left')
    trips_stats1.dropna(subset=['date'], inplace=True)

    trips_stats1['Date'] = pd.to_datetime(trips_stats1['date'], format='%Y%m%d')
    trips_stats1['day'] = trips_stats1['Date'].dt.day
    trips_stats1['month'] = trips_stats1['Date'].dt.month
    trips_stats1['weekday'] = trips_stats1['Date'].dt.weekday

    trips_stats1['is_weekend'] = trips_stats1['weekday'].apply(lambda x: 1 if x >= 5 else 0)
    trips_stats1 = trips_stats1.merge(feed.routes[['route_id', 'route_long_name']], on='route_id', how='left')

    trips_demand = trips_stats1.groupby(by=['route_id', 'Date', 'month', 'day', 'weekday', 'is_weekend', 'time_of_day', 'is_peak_hours']).agg(
        TotalTrips=('trip_id', 'nunique'),
        TotalStops=('num_stops', 'median'),
        AvgDuration=('duration', 'mean'),
        AvgDistance=('distance', 'mean'),
        AvgSpeed=('speed', 'mean'),
    ).reset_index()

    encoder = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
    encoded_data = encoder.fit_transform(trips_demand.drop(['TotalTrips'], axis=1)[['time_of_day']])

    timeofday_encoded_df = pd.DataFrame(encoded_data, columns=encoder.get_feature_names_out(['time_of_day']))
    trips_demand = pd.concat([trips_demand, timeofday_encoded_df], axis=1)


    joblib.dump(encoder, "onehot_encoder.pkl")

    
    X = trips_demand.drop(columns=['TotalTrips', 'Date', 'time_of_day'])
    y = trips_demand['TotalTrips']

    return X, y

def train_model():
    global model

    X, y = load_preprocess_data()

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    target_encoder = ce.TargetEncoder(cols=['route_id'])

    X_train = target_encoder.fit_transform(X_train, y_train)
    X_test = target_encoder.transform(X_test)
    # print(X_test.columns)

    joblib.dump(target_encoder, "target_encoder.pkl")
    
    xgb_model = XGBRegressor(n_estimators=200, random_state=42)
    xgb_model.fit(X_train, y_train)

    d4p_model = d4p.mb.convert_model(xgb_model)

    y_pred_d4p = d4p_model.predict(X_test)

    mse_d4p = mean_squared_error(y_test, y_pred_d4p)
    mae_d4p = mean_absolute_error(y_test, y_pred_d4p)

    feature_importances = xgb_model.feature_importances_
    feature_importances_df = pd.DataFrame({'Feature': X_train.columns, 'Importance': feature_importances.round(4)})
    feature_importances_df.sort_values(by=['Importance'], ascending=False, inplace=True)

    joblib.dump(d4p_model, 'trained_model.pkl')

    return mse_d4p, mae_d4p, feature_importances_df

# API route to trigger model training
@app.route('/train_model', methods=['POST'])
def train_model_api():
    try:
        # Call the training function
        mse, mae, feature_importances = train_model()
        
        # Return success message with evaluation results
        return jsonify({
            'message': 'Model trained successfully!',
            'mse': mse,
            'mae': mae,
            'feature_importance': feature_importances.to_dict(orient="records")
        }), 200
    except Exception as e:
        return jsonify({
            'message': 'Error during model training.',
            'error': str(e)
        }), 500

def preprocess_input(route_id, date, time, total_stops, avg_speed, avg_distance, avg_duration):

    onehot_encoder = joblib.load("onehot_encoder.pkl")
    target_encoder = joblib.load("target_encoder.pkl")

    # Convert the time to a time_of_day classification
    time_of_day = classify_time_of_day(time)

    input_data = {
        'route_id': route_id,
        'Date': pd.to_datetime(date, format="%Y%m%d"),
        'time_of_day': time_of_day,
        'is_peak_hours': 1 if 8 <= int(time.split(":")[0]) <= 12 or 16 <= int(time.split(":")[0]) <= 20 else 0,
        'month': pd.to_datetime(date).month,
        'day': pd.to_datetime(date).day,
        'weekday': pd.to_datetime(date).weekday(),
        'is_weekend': 1 if pd.to_datetime(date).weekday() >= 5 else 0,
        'TotalStops':  total_stops,
        'AvgSpeed': avg_speed,
        'AvgDistance': avg_distance,
        'AvgDuration': avg_duration,
    }

    input_df = pd.DataFrame([input_data])

    # # Encode time_of_day using the saved onehot encoder
    time_of_day_encoded = onehot_encoder.transform(input_df[['time_of_day']])
    time_of_day_encoded_df = pd.DataFrame(time_of_day_encoded, columns=onehot_encoder.get_feature_names_out(['time_of_day']))
    input_df = pd.concat([input_df, time_of_day_encoded_df], axis=1)

    # # Drop unnecessary columns
    input_df.drop(columns=['Date', 'time_of_day'], inplace=True)

    # # Encode  route_id using the saved target encoder
    input_df = target_encoder.transform(input_df)

    return input_df

@app.route('/predict_demand', methods=['POST'])
def predict_demand():
    try:
        # Get the request data (ensure the required fields are present)
        model = joblib.load("trained_model.pkl")
        
        data = request.get_json()
        route_id = data['route_id']
        date = data['date']
        time = data['time']
        total_stops = data['total_stops']
        avg_speed = data['avg_speed']
        avg_distance = data['avg_distance']
        avg_duration = data['avg_duration']

        # Preprocess the input data
        input_data = preprocess_input(route_id, date, time, total_stops, avg_speed, avg_distance, avg_duration)
        cols = ['route_id', 'month', 'day', 'weekday', 'is_weekend', 'is_peak_hours', 
                'TotalStops', 'AvgDuration', 'AvgDistance', 'AvgSpeed', 
                'time_of_day_Afternoon', 'time_of_day_Mid Night', 'time_of_day_Morning',
                'time_of_day_Night', 'time_of_day_Peak Evening', 'time_of_day_Peak Morning']

        input_data = input_data[cols]

        # Use the model to predict trip demand
        predicted_demand = model.predict(input_data)
        print(predicted_demand[0])

        # Return the prediction result
        return jsonify({
            'predicted_demand': int(predicted_demand[0])
        }), 200

    except Exception as e:
        return jsonify({
            'message': 'Error during prediction.',
            'error': str(e)
        }), 500


db = init_database()

chat_history = {}

@app.route('/chat_query', methods=['POST'])
def chat():
    data = request.get_json()  # Get JSON data from the request body
    user_query = data.get('query')  # The user's query from the frontend
    user_id = data.get('user_id')

    if user_id not in chat_history:
        chat_history[user_id] = []

    chat_history[user_id].append({"User": user_query})

    try:
        # db = session.get("db")
        response = get_sql_response(user_query=user_query, db=db, chat_history=chat_history)
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if  __name__ == '__main__':
  app.run(debug=True)
