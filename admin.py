import firebase_admin
from firebase_admin import credentials
from google.oauth2 import service_account
import google.auth.transport.requests

# Initialize the Firebase app with your service account key
cred = credentials.Certificate("./key.json")
firebase_admin.initialize_app(cred)

# Define the scope for the access token
SCOPES = ['https://www.googleapis.com/auth/firebase.messaging']

# Authenticate a credential with the service account
credentials = service_account.Credentials.from_service_account_file(
    './key.json', scopes=SCOPES)

# Use the credentials to request an access token
request = google.auth.transport.requests.Request()
credentials.refresh(request)
access_token = credentials.token

print("Access Token:", access_token)
