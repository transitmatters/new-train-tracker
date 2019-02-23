import secrets
import requests
import json_api_doc
import Fleet
from urllib.parse import urlencode

BASE_URL_V3 = 'https://api-v3.mbta.com/{command}?{parameters}'

def getV3(command, params={}, api_key=secrets.API_KEY):
    headers = {'x-api-key': api_key}
    response = requests.get(BASE_URL_V3.format(command=command, parameters=urlencode(params)), headers=headers)
    return json_api_doc.parse(response.json())

def transform_vehicle(vehicle):
    return {
        'label': vehicle['label'],
        'route': vehicle['route']['id'],
        'current_status': vehicle['current_status'],
        'station_id': vehicle['stop']['parent_station']['id'],
        'new_flag': Fleet.car_array_is_new(vehicle['route']['id'],
                    vehicle['label'].split('-'))
    }

def vehicle_data_for_route(route):
    vehicles = getV3('vehicles', {
        'filter[route]': route,
        'include': 'stop'
    })
    return list(map(transform_vehicle, vehicles))