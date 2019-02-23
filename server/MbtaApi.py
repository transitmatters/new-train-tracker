from urllib.parse import urlencode
import requests
import json_api_doc
import secrets
import Fleet

BASE_URL_V3 = 'https://api-v3.mbta.com/{command}?{parameters}'

def getV3(command, params={}, api_key=secrets.API_KEY):
    """Make a GET request against the MBTA v3 API"""
    headers = {'x-api-key': api_key}
    response = requests.get(BASE_URL_V3.format(command=command, parameters=urlencode(params)), headers=headers)
    return json_api_doc.parse(response.json())

def vehicle_data_for_route(route):
    """Use getv3 to request real-time vehicle data for a given route string"""
    vehicles = getV3('vehicles', {
        'filter[route]': route,
        'include': 'stop'
    })

    return list(map(lambda vehicle: {
        'label': vehicle['label'],
        'route': vehicle['route']['id'],
        'current_status': vehicle['current_status'],
        'station_id': vehicle['stop']['parent_station']['id'],
        'new_flag': Fleet.car_array_is_new(vehicle['route']['id'],
                    vehicle['label'].split('-'))
    }, vehicles))
