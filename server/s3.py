import boto3
import botocore
from botocore.exceptions import ClientError
import zlib

s3 = boto3.client('s3', config=botocore.client.Config(max_pool_connections=15))

def download(bucket, key, encoding="utf8", compressed=True):
    obj = s3.get_object(Bucket=bucket, Key=key)
    s3_data = obj["Body"].read()
    if not compressed:
        return s3_data.decode(encoding)
    # 32 should detect zlib vs gzip
    decompressed = zlib.decompress(s3_data, zlib.MAX_WBITS | 32).decode(encoding)
    return decompressed
