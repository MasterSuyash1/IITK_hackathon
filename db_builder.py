import sqlite3
import os
import datetime
import pandas as pd
import modin.pandas as pd

from os import path
from pathlib import Path

import gtfs_kit as gk

def create_db():
  conn = sqlite3.connect("nyc_gtfs.db")
  c = conn.cursor()

  # Creating the Routes table
  c.execute('''
  CREATE TABLE IF NOT EXISTS Routes (
      route_id TEXT PRIMARY KEY,
      agency_id TEXT,
      route_short_name TEXT,
      route_long_name TEXT,
      route_desc TEXT,
      route_type INTEGER,
      route_color TEXT
  )
  ''')

  # Creating the Stops table
  c.execute('''
  CREATE TABLE IF NOT EXISTS Stops (
      stop_id TEXT PRIMARY KEY,
      stop_code TEXT,
      stop_name TEXT,
      stop_desc TEXT,
      stop_lat REAL,
      stop_lon REAL,
      zone_id TEXT,
      stop_url TEXT,
      location_type INTEGER,
      parent_station TEXT,
      stop_timezone TEXT,
      wheelchair_boarding INTEGER
  )
  ''')

  # Creating the Trips table
  c.execute('''
  CREATE TABLE IF NOT EXISTS Trips (
      trip_id TEXT PRIMARY KEY,
      route_id TEXT,
      service_id TEXT,
      trip_headsign TEXT,
      trip_short_name TEXT,
      direction_id INTEGER,
      block_id TEXT,
      shape_id TEXT,
      wheelchair_accessible INTEGER,
      bikes_allowed INTEGER,
      FOREIGN KEY (route_id) REFERENCES Routes (route_id)
  )
  ''')

  # Creating the Stop Times table
  c.execute('''
  CREATE TABLE IF NOT EXISTS StopTimes (
      trip_id TEXT,
      arrival_time TEXT,
      departure_time TEXT,
      stop_id TEXT,
      stop_sequence INTEGER,
      stop_headsign TEXT,
      pickup_type INTEGER,
      drop_off_type INTEGER,
      shape_dist_traveled REAL,
      timepoint INTEGER,
      FOREIGN KEY (trip_id) REFERENCES Trips (trip_id),
      FOREIGN KEY (stop_id) REFERENCES Stops (stop_id)
  )
  ''')

  # Creating the Trip Stats table
  c.execute('''
  CREATE TABLE IF NOT EXISTS TripStats (
      trip_id TEXT PRIMARY KEY,
      route_id TEXT,
      route_short_name TEXT,
      route_type INTEGER,
      direction_id INTEGER,
      shape_id TEXT,
      stop_pattern_name TEXT,
      num_stops INTEGER,
      start_time TEXT,
      end_time TEXT,
      start_stop_id TEXT,
      end_stop_id TEXT,
      is_loop INTEGER,
      duration REAL,
      distance REAL,
      speed REAL,
      FOREIGN KEY (trip_id) REFERENCES Trips (trip_id),
      FOREIGN KEY (route_id) REFERENCES Routes (route_id)
  )
  ''')

  # Creating the Route Stats table
  c.execute('''
  CREATE TABLE IF NOT EXISTS RouteStats (
      route_id TEXT,
      route_short_name TEXT,
      route_type INTEGER,
      num_trips INTEGER,
      num_trip_starts INTEGER,
      num_trip_ends INTEGER,
      num_stop_patterns INTEGER,
      is_loop INTEGER,
      is_bidirectional INTEGER,
      start_time TEXT,
      end_time TEXT,
      max_headway REAL,
      min_headway REAL,
      mean_headway REAL,
      peak_num_trips INTEGER,
      peak_start_time TEXT,
      peak_end_time TEXT,
      service_distance REAL,
      service_duration REAL,
      service_speed REAL,
      mean_trip_distance REAL,
      mean_trip_duration REAL,
      date TEXT,
      FOREIGN KEY (route_id) REFERENCES Routes (route_id)
  )
  ''')

  path = Path('.\data\gtfs-nyc-2023.zip')
  feed = gk.read_feed(path, dist_units='km')

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

  def clean_time(x):
      date = datetime.datetime.today()
      hr, min, sec = x.split(':')
      if x.startswith('24'):
          date = date + datetime.timedelta(days=1)
          hr = '00'
      x = f"{date.strftime('%Y-%m-%d')} {hr}:{min}:{sec}"
      return x

  feed = clean_feed_data(feed=feed)

  # Write data to SQLite tables
  def get_dates(start_month, end_month, start_date=1, end_date=30):
    dates = []
    for month in range(start_month, end_month + 1):
        for day in range(start_date, end_date + 1):
            dates.append(f"2023{month:02d}{day:02d}")
    return dates

  def classify_time_of_day(start_time):
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

  trip_stats = feed.compute_trip_stats()

  route_stats = feed.compute_route_stats(trip_stats, dates=get_dates(9, 12))

  trip_stats['start_hour'] = pd.to_datetime(trip_stats['start_time'].apply(clean_time), format="mixed").dt.hour
  trip_stats['end_hour'] = pd.to_datetime(trip_stats['end_time'].apply(clean_time), format="mixed").dt.hour

  trip_stats['time_of_day'] = trip_stats['start_time'].apply(classify_time_of_day)
  trip_stats['is_peak_hours'] = trip_stats['start_hour'].apply(lambda x: 1 if (8 <= x <= 12 or 16 <= x <= 20) else 0)

  route_stats['Date'] = pd.to_datetime(route_stats['date'], format='%Y%m%d')
  route_stats['day'] = route_stats['Date'].dt.day
  route_stats['month'] = route_stats['Date'].dt.month
  route_stats['weekday'] = route_stats['Date'].dt.weekday
  route_stats['is_weekend'] = route_stats['weekday'].apply(lambda x: 1 if x >= 5 else 0)
  route_stats = route_stats.drop(['date'], axis=1)

  feed.routes[['route_id', 'agency_id', 'route_short_name', 'route_long_name', 'route_desc', 'route_type', 'route_color']].to_sql('Routes', conn, if_exists='replace', index=False)
  feed.stops.to_sql('Stops', conn, if_exists='replace', index=False)
  feed.trips.to_sql('Trips', conn, if_exists='replace', index=False)
  feed.stop_times.to_sql('StopTimes', conn, if_exists='replace', index=False)
  trip_stats.to_sql('TripStats', conn, if_exists='replace', index=False)
  route_stats.to_sql('RouteStats', conn, if_exists='replace', index=False)


  conn.commit()
  conn.close()
