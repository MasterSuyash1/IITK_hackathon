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

# Intel Modin Integration for Faster Data Manipulation
import modin.pandas as pd

# Data Visualization Library
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
import plotly.io as pio
from plotly.subplots import make_subplots

# Map Visualization Library
import folium
from shapely.geometry import LineString, Point
from folium.plugins import MarkerCluster, HeatMap
from folium import Marker, Icon, Circle, CircleMarker, GeoJson, PolyLine, Map
from geopy.distance import geodesic

# Intel extension for scikit-learn for optimized ML Tasks 
from sklearnex import patch_sklearn
patch_sklearn()

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import KMeans
from sklearn.metrics import mean_absolute_error, mean_squared_error

import gtfs_kit as gk

app = Flask(__name__)
CORS(app)

path = Path('data/gtfs-nyc-2023.zip')
feed = gk.read_feed(path, dist_units='km')
# print(feed.validate())

def clean_feed_data(feed):
  # Removing the space from the Arrival and Departure Time
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


if  __name__ == '__main__':
  app.run(debug=True)
