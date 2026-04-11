import httpx
import ssl
import subprocess

caroot = subprocess.check_output(['mkcert', '-CAROOT']).decode().strip()
ca_file = caroot + '\\rootCA.pem'

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
ctx.minimum_version = ssl.TLSVersion.TLSv1_2
ctx.maximum_version = ssl.TLSVersion.TLSv1_2
ctx.set_ciphers('AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA')
ctx.load_verify_locations(ca_file)
ctx.keylog_filename = 'sslkeys.log'

with httpx.Client(verify=ctx) as client:
    response = client.get('https://localhost:3000/hello')
    print(response.text)
    