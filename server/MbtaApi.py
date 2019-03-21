from urllib.parse import urlencode
from urllib.request import Request, urlopen
from decimal import Decimal
import os
import secrets
import json
import Fleet

BASE_URL_V3 = 'https://api-v3.mbta.com/{command}?{parameters}'

def getV3(command, params={}):
    """Make a GET request against the MBTA v3 API"""
    api_key = os.environ.get('MBTA_V3_API_KEY', '') or secrets.MBTA_V3_API_KEY
    headers = {'x-api-key': api_key} if api_key else {}
    url = BASE_URL_V3.format(command=command, parameters=urlencode(params))
    req = Request(url, headers=headers)
    response = urlopen(req).read()
    data = json.loads(response.decode('utf-8'), parse_float=Decimal, parse_int=Decimal)
    return data 

def vehicle_data_for_routes(routes):
    """Use getv3 to request real-time vehicle data for a given route set"""
    """routes must be pased as a list: options are Red, Orange, Green-B, Green-C, Green-D, Green-E"""
    vehicles = getV3('vehicles', {
        'filter[route]': ','.join(routes),
        'include': 'stop'
    })
    
    stations = {}
    for x in vehicles.get('included', {}):
        stations[x.get('id', None)] = x.get('relationships', {}).get('parent_station', {}).get('data',{}).get('id', None)
        
    vehicles_data = vehicles.get('data', {})
    
    return list(map(lambda vehicle: {
        'label'         : vehicle.get('attributes', {}).get('label', None),
        'route'         : vehicle.get('relationships', {}).get('route', {}).get('data', {}).get('id', None),
        'direction'     : int(vehicle.get('attributes', {}).get('direction_id', None)),
        'current_status': vehicle.get('attributes', {}).get('current_status', None),
        'station_id'    : stations.get(vehicle.get('relationships', {}).get('stop', {}).get('data', {}).get('id', None), None),
        'new_flag'      : Fleet.car_array_is_new(vehicle.get('relationships', {}).get('route', {}).get('data', {}).get('id', None), vehicle.get('attributes', {}).get('label', None).split('-'))
    }, vehicles_data))

def stops_for_route(route):
    stops = getV3('stops', {
        'filter[route]': route,
    }).get('data', {})
    
    return list(reversed(list(map(lambda stop: {
        'id': stop.get('id', None),
        'name': stop.get('attributes', {}).get('name', None),
    }, stops))))
