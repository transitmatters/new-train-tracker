import os
import boto3
import zlib


s3 = boto3.client("s3")
BUCKET = os.environ.get("TM_CORS_HOST", "ntt-beta.labs.transitmatters.org")


def download(key, encoding="utf8", compressed=True):
    print(BUCKET)
    obj = s3.get_object(Bucket=BUCKET, Key=key)
    s3_data = obj["Body"].read()
    if not compressed:
        return s3_data.decode(encoding)
    # 32 should detect zlib vs gzip
    decompressed = zlib.decompress(s3_data, zlib.MAX_WBITS | 32).decode(encoding)
    return decompressed


def upload(key, bytes, compress=True):
    if compress:
        bytes = zlib.compress(bytes)
    s3.put_object(Bucket=BUCKET, Key=key, Body=bytes)
