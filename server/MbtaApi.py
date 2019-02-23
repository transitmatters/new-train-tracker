import secrets
import requests
from urllib.parse import urlencode

BASE_URL_V3 = 'https://api-v3.mbta.com/{command}?{parameters}'

def getV3(command, params={}, api_key=secrets.API_KEY):
    headers = {'x-api-key': api_key}
    response = requests.get(BASE_URL_V3.format(command=command, parameters=urlencode(params)), headers=headers)
    return response.json()