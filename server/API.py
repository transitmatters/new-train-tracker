import secrets
import requests

BASE_URL_V3 = 'https://api-v3.mbta.com/{command}?filter[{name}]={value}{suffix}'

def getV3(command, filter_name, filter_value, suffix='', api_key=secrets.API_KEY):
    headers = {'x-api-key': api_key}
    print(BASE_URL_V3.format(command=command, name=filter_name, value=filter_value, suffix=suffix))
    response = requests.get(BASE_URL_V3.format(command=command, name=filter_name, value=filter_value, suffix=suffix), headers=headers)
    return response.json()