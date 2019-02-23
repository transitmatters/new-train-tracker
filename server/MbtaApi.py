import secrets
import requests
from urllib.parse import urlencode

BASE_URL_V3 = 'https://api-v3.mbta.com/{command}?{parameters}'

def getV3(command, filter_name, filter_value, addl_params={}, api_key=secrets.API_KEY):
    headers = {'x-api-key': api_key}
    addl_params['filter[{}]'.format(filter_name)] = filter_value
    response = requests.get(BASE_URL_V3.format(command=command, name=filter_name, value=filter_value, parameters=urlencode(addl_params)), headers=headers)
    return response.json()