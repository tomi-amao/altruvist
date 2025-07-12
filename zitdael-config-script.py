import os
import json
import subprocess
import time
import traceback
import argparse
import sys
from pathlib import Path

def install_packages():
    """Install required packages using the appropriate pip command."""
    print("Installing required packages...")
    
    # Try different pip commands in order of preference
    pip_commands = ['pip3', 'pip', 'python3 -m pip', 'python -m pip']
    
    for pip_cmd in pip_commands:
        try:
            # Split the command if it contains spaces
            cmd_parts = pip_cmd.split()
            cmd_parts.extend(["install", "requests", "PyJWT[crypto]"])
            
            subprocess.check_call(cmd_parts)
            print(f"Successfully installed packages using: {pip_cmd}")
            return
        except (subprocess.CalledProcessError, FileNotFoundError) as e:
            print(f"Failed to install with {pip_cmd}: {e}")
            continue
    
    # If all pip commands fail, try using the current Python executable
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "PyJWT[crypto]"])
        print(f"Successfully installed packages using: {sys.executable} -m pip")
    except Exception as e:
        print(f"ERROR: Could not install required packages. Please install manually:")
        print("  pip install requests PyJWT[crypto]")
        print(f"Original error: {e}")
        sys.exit(1)

# Install packages first
install_packages()

import requests
import jwt
from datetime import datetime, timedelta, timezone

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def parse_arguments():
    """Parse command line arguments and environment variables for configuration."""
    parser = argparse.ArgumentParser(description="Configure Zitadel instance with project, roles, and OIDC application")
    
    # Zitadel instance configuration
    parser.add_argument("--zitadel-external-url", 
                       default=os.getenv("ZITADEL_EXTERNAL_URL"),
                       help="External URL of Zitadel instance (e.g., https://auth.example.com)")
    
    parser.add_argument("--zitadel-internal-url", 
                       default=os.getenv("ZITADEL_INTERNAL_URL"),
                       help="Internal URL of Zitadel instance (e.g., http://zitadel:8080)")
    
    # Service account configuration
    parser.add_argument("--service-account-key-path", 
                       default=os.getenv("SERVICE_ACCOUNT_KEY_PATH"),
                       help="Path to the service account JSON key file")
    
    # Project configuration
    parser.add_argument("--project-name", 
                       default=os.getenv("PROJECT_NAME", "MyApp"),
                       help="Name of the project to create")
    
    parser.add_argument("--role-key", 
                       default=os.getenv("ROLE_KEY", "app-user"),
                       help="Role key to create for the project")
    
    parser.add_argument("--role-display-name", 
                       default=os.getenv("ROLE_DISPLAY_NAME", "App User"),
                       help="Display name for the role")
    
    parser.add_argument("--role-group", 
                       default=os.getenv("ROLE_GROUP", "app-user-group"),
                       help="Role group name")
    
    # Application configuration
    parser.add_argument("--app-name", 
                       default=os.getenv("APP_NAME", "webapp"),
                       help="Name of the OIDC application to create")
    
    parser.add_argument("--webapp-urls", 
                       default=os.getenv("WEBAPP_URLS"),
                       help="Comma-separated list of webapp URLs for redirects")
    
    args = parser.parse_args()
    
    # Validate required arguments
    if not args.zitadel_external_url:
        log("ERROR: --zitadel-external-url is required (or set ZITADEL_EXTERNAL_URL)", "ERROR")
        sys.exit(1)
    
    if not args.zitadel_internal_url:
        log("ERROR: --zitadel-internal-url is required (or set ZITADEL_INTERNAL_URL)", "ERROR")
        sys.exit(1)
    
    if not args.service_account_key_path:
        log("ERROR: --service-account-key-path is required (or set SERVICE_ACCOUNT_KEY_PATH)", "ERROR")
        sys.exit(1)
    
    if not Path(args.service_account_key_path).exists():
        log(f"ERROR: Service account key file not found: {args.service_account_key_path}", "ERROR")
        sys.exit(1)
    
    if not args.webapp_urls:
        log("ERROR: --webapp-urls is required (or set WEBAPP_URLS)", "ERROR")
        sys.exit(1)
    
    # Parse webapp URLs
    args.webapp_urls = [url.strip() for url in args.webapp_urls.split(",")]
    
    return args

def load_service_account_key(key_path):
    """Load and validate service account key from file."""
    log(f"Loading service account key from {key_path}...")
    try:
        with open(key_path, "r", encoding="utf-8") as file:
            private_key_json = json.load(file)
        
        # Validate required fields
        required_fields = ["type", "keyId", "userId", "key"]
        for field in required_fields:
            if field not in private_key_json:
                raise ValueError(f"Missing required field '{field}' in service account key")
        
        log("Service account key loaded successfully")
        return private_key_json
    except Exception as e:
        log(f"Failed to load service account key: {str(e)}", "ERROR")
        raise

def generate_jwt_token(config, private_key_json):
    """Generate JWT token for authentication."""
    log("Generating JWT token...")
    
    key_id = private_key_json["keyId"]
    service_user_id = private_key_json["userId"]
    private_key = private_key_json["key"]
    
    log(f"Service account details - Key ID: {key_id}, User ID: {service_user_id}")
    if "expirationDate" in private_key_json:
        log(f"Key expiration date: {private_key_json['expirationDate']}")
    
    # Use timezone-aware datetime
    now = datetime.now(timezone.utc)
    log(f"Current time: {now}")
    
    # Add larger buffer for clock skew and increase expiration time
    iat_time = now - timedelta(minutes=2)  # 2 minutes in the past to handle clock skew
    exp_time = now + timedelta(hours=1)    # 1 hour expiration
    
    # Use just the hostname for audience (common Zitadel pattern)
    audience_url = config.zitadel_external_url.rstrip('/')
    
    payload = {
        "iss": service_user_id,
        "sub": service_user_id,
        "aud": audience_url,  # Clean URL without trailing slash
        "iat": int(iat_time.timestamp()),
        "exp": int(exp_time.timestamp()),
        "jti": f"{service_user_id}-{int(now.timestamp())}"  # Add unique token ID
    }
    
    header = {
        "alg": "RS256",
        "kid": key_id,
        "typ": "JWT"
    }
    
    log(f"JWT payload: iss={service_user_id}, aud={audience_url}")
    log(f"JWT times: iat={iat_time}, exp={exp_time}")
    log(f"Token valid for {(exp_time - now).total_seconds()} seconds")
    
    try:
        encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256", headers=header)
        log("JWT token generated successfully")
        log(f"JWT preview: {encoded_jwt[:50]}...")
        
        # Decode and verify the token locally for debugging
        try:
            decoded = jwt.decode(encoded_jwt, options={"verify_signature": False})
            log(f"JWT payload verification: {decoded}")
        except Exception as decode_error:
            log(f"Warning: Could not decode JWT for verification: {decode_error}", "WARNING")
        
        return encoded_jwt
    except Exception as e:
        log(f"Failed to generate JWT: {str(e)}", "ERROR")
        raise

def get_oauth_token(config, jwt_token):
    """Get OAuth access token from Zitadel."""
    log("==== GETTING OAUTH TOKEN ====")
    url = f"{config.zitadel_internal_url}/oauth/v2/token"
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "scope": "openid profile urn:zitadel:iam:org:project:id:zitadel:aud",
        "assertion": jwt_token
    }
    
    log(f"Making token request to {url}...")
    log(f"Request headers: {headers}")
    log(f"Request data: {data}")
    
    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, data=data, timeout=30)
        request_time = time.time() - start_time
        log(f"Token request completed in {request_time:.2f}s with status code {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data["access_token"]
            expires_in = token_data["expires_in"]
            
            log(f"Access token received (expires in {expires_in}s)")
            return access_token
        else:
            log(f"Token request failed: {response.text}", "ERROR")
            log(f"Response headers: {response.headers}", "ERROR")
            raise Exception(f"Token request failed with status {response.status_code}: {response.text}")
    except requests.exceptions.Timeout:
        log("Token request timed out", "ERROR")
        raise
    except Exception as e:
        log(f"Error during token request: {str(e)}", "ERROR")
        raise

def make_authenticated_request(config, access_token, method, url, payload=None, retry_on_auth_error=True):
    """Make an authenticated request with automatic token refresh on auth errors."""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    try:
        if method.upper() == 'POST':
            response = requests.post(url, headers=headers, data=payload, timeout=30)
        elif method.upper() == 'GET':
            response = requests.get(url, headers=headers, timeout=30)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        # If we get a 401 and retry is enabled, try to refresh the token
        if response.status_code == 401 and retry_on_auth_error:
            log("Authentication failed, attempting to refresh token...", "WARNING")
            # This would require passing the private_key_json and regenerating tokens
            # For now, just raise the error with detailed info
            log(f"401 Error response: {response.text}", "ERROR")
            raise Exception(f"Authentication failed (401). Token may have expired. Response: {response.text}")
        
        return response
    except requests.exceptions.Timeout:
        log(f"Request to {url} timed out", "ERROR")
        raise
    except Exception as e:
        log(f"Error during request to {url}: {str(e)}", "ERROR")
        raise

def create_project(config, access_token):
    """Create project in Zitadel."""
    log("==== CREATING PROJECT ====")
    url = f"{config.zitadel_internal_url}/management/v1/projects"
    
    project_data = {
        "name": config.project_name,
        "projectRoleAssertion": True,
        "projectRoleCheck": True,
        "hasProjectCheck": True,
        "privateLabelingSetting": "PRIVATE_LABELING_SETTING_UNSPECIFIED"
    }
    
    payload = json.dumps(project_data)
    log(f"Project creation payload: {payload}")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    log(f"Making project creation request to {url}...")
    start_time = time.time()
    try:
        response = requests.post(url, headers=headers, data=payload)
        request_time = time.time() - start_time
        log(f"Project creation request completed in {request_time:.2f}s with status code {response.status_code}")
        
        if response.status_code in [200, 201]:
            log("Project created successfully!")
            log(f"Response: {response.text}")
        elif response.status_code == 409:
            log("Project already exists - continuing")
        else:
            log(f"Project creation failed: {response.text}", "ERROR")
            if response.status_code == 401:
                log("Authentication error - check your token", "ERROR")
            elif response.status_code == 400:
                log("Bad request - check your payload format", "ERROR")
            raise Exception(f"Project creation failed with status {response.status_code}")
    except Exception as e:
        log(f"Error during project creation: {str(e)}", "ERROR")
        raise

def find_project_id(config, access_token):
    """Find the project ID by name."""
    log("==== FINDING PROJECT ID ====")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    list_projects_endpoint = f"{config.zitadel_internal_url}/management/v1/projects/_search"
    log(f"Sending request to list projects at {list_projects_endpoint}...")
    
    payload = json.dumps({
        "query": {
            "offset": "0",
            "limit": 100,
            "asc": True
        },
        "queries": [
            {
                "nameQuery": {
                    "name": config.project_name,
                    "method": "TEXT_QUERY_METHOD_EQUALS"
                }
            }
        ]
    })

    response = requests.post(list_projects_endpoint, headers=headers, data=payload)

    if response.status_code in [200, 201]:
        result = response.json().get("result", [])
        if not result:
            raise Exception(f"Project '{config.project_name}' not found")
        
        project_id = result[0]["id"]
        log(f"Project ID {project_id} found!")
        return project_id
    else:
        log(f"Project listing failed: {response.text}", "ERROR")
        raise Exception(f"Failed to find project: {response.status_code}")

def add_role_to_project(config, access_token, project_id):
    """Add role to the project."""
    log("==== ADDING ROLE TO PROJECT ====")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    add_role_endpoint = f"{config.zitadel_internal_url}/management/v1/projects/{project_id}/roles"
    payload = json.dumps({
        "roleKey": config.role_key,
        "displayName": config.role_display_name,
        "group": config.role_group,
    })

    log(f"Sending request to add role to project at {add_role_endpoint}...")
    response = requests.post(add_role_endpoint, headers=headers, data=payload)

    if response.status_code in [200, 201]:
        log("Role added to project successfully!")
        log(f"Response: {response.text}")
    elif response.status_code == 409:
        log("Role already exists - continuing")
    else:
        log(f"Role addition failed: {response.text}", "ERROR")
        raise Exception(f"Role addition failed with status {response.status_code}")

def create_grant_action(config, access_token, project_id):
    """Create action to grant role to new users."""
    log("==== CREATE USER REGISTRATION GRANT ACTION ====")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    add_grant_action_endpoint = f"{config.zitadel_internal_url}/management/v1/actions"
    payload = json.dumps({
        "name": "addGrant",
        "script": f"function addGrant(ctx, api) {{api.userGrants.push({{projectID: \"{project_id}\", roles: ['{config.role_key}']}});}}",
        "timeout": "20s",
        "allowedToFail": True
    })

    log(f"Sending request to add grant action at {add_grant_action_endpoint}...")
    response = requests.post(add_grant_action_endpoint, headers=headers, data=payload)

    if response.status_code in [200, 201]:
        log("Grant action added successfully!")
        action_data = response.json()
        action_id = action_data.get("id")
        log(f"Action ID: {action_id}")
        return action_id
    else:
        log(f"Grant action addition failed: {response.text}", "ERROR")
        raise Exception(f"Grant action creation failed with status {response.status_code}")

def set_flow_trigger(config, access_token, action_id):
    """Set flow trigger for the action."""
    log("==== SETTING FLOW TRIGGER ====")
    
    if not action_id:
        log("Cannot set flow trigger - Action ID not available", "WARNING")
        return
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    set_trigger_url = f"{config.zitadel_internal_url}/management/v1/flows/3/trigger/3"
    
    payload = json.dumps({
        "actionIds": [action_id]
    })
    
    log(f"Sending request to set flow trigger at {set_trigger_url}...")
    response = requests.post(set_trigger_url, headers=headers, data=payload)
    
    if response.status_code in [200, 201]:
        log("Flow trigger set successfully!")
    else:
        log(f"Setting flow trigger failed: {response.text}", "ERROR")
        raise Exception(f"Flow trigger setting failed with status {response.status_code}")

def create_oidc_application(config, access_token, project_id):
    """Create OIDC application."""
    log("==== CREATING OIDC APPLICATION ====")
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
        "Host": config.zitadel_external_url.replace("https://", "").replace("http://", "")
    }
    
    # Build redirect URIs from webapp URLs
    redirect_uris = []
    post_logout_redirect_uris = []
    
    for webapp_url in config.webapp_urls:
        redirect_uris.extend([
            webapp_url,
            f"{webapp_url}/auth/callback"
        ])
        post_logout_redirect_uris.extend([
            webapp_url,
            f"{webapp_url}/auth/callback"
        ])
    
    # Also include Zitadel external URL
    redirect_uris.extend([
        config.zitadel_external_url,
        f"{config.zitadel_external_url}/auth/callback"
    ])
    post_logout_redirect_uris.extend([
        config.zitadel_external_url,
        f"{config.zitadel_external_url}/auth/callback"
    ])
    
    log(f"Using project_id: {project_id}")
    create_application_endpoint = f"{config.zitadel_internal_url}/management/v1/projects/{project_id}/apps/oidc"
    payload = json.dumps({
        "name": config.app_name,
        "redirectUris": redirect_uris,
        "responseTypes": ["OIDC_RESPONSE_TYPE_NONE"],
        "grantTypes": ["OIDC_GRANT_TYPE_AUTHORIZATION_CODE"],
        "appType": "OIDC_APP_TYPE_WEB",
        "authMethodType": "OIDC_AUTH_METHOD_TYPE_BASIC",
        "postLogoutRedirectUris": post_logout_redirect_uris,
        "version": "OIDC_VERSION_1_0",
        "devMode": False,
        "accessTokenType": "OIDC_TOKEN_TYPE_BEARER",
        "accessTokenRoleAssertion": True,
        "idTokenRoleAssertion": True,
        "idTokenUserinfoAssertion": True,
        "clockSkew": "1s",
        "additionalOrigins": [],
        "skipNativeAppSuccessPage": True,
    })
    
    log(f"Sending request to create OIDC application at {create_application_endpoint}...")
    response = requests.post(create_application_endpoint, headers=headers, data=payload)

    if response.status_code in [200, 201]:
        log("OIDC application created successfully!")
        log(f"Response: {response.text}")
    else:
        log(f"OIDC application creation failed: {response.text}", "ERROR")
        raise Exception(f"OIDC application creation failed with status {response.status_code}")

def main():
    """Main function to orchestrate the Zitadel configuration."""
    try:
        # Parse configuration
        config = parse_arguments()
        
        log("==== STARTING ZITADEL CONFIGURATION JOB ====")
        log(f"Zitadel External URL: {config.zitadel_external_url}")
        log(f"Zitadel Internal URL: {config.zitadel_internal_url}")
        log(f"Project Name: {config.project_name}")
        log(f"App Name: {config.app_name}")
        log(f"Webapp URLs: {', '.join(config.webapp_urls)}")
        
        # Load service account key
        private_key_json = load_service_account_key(config.service_account_key_path)
        
        # Generate JWT token
        jwt_token = generate_jwt_token(config, private_key_json)
        
        # Get OAuth access token
        access_token = get_oauth_token(config, jwt_token)
        
        # Create project
        create_project(config, access_token)
        
        # Find project ID
        project_id = find_project_id(config, access_token)
        
        # Add role to project
        add_role_to_project(config, access_token, project_id)
        
        # Create grant action
        action_id = create_grant_action(config, access_token, project_id)
        
        # Set flow trigger
        set_flow_trigger(config, access_token, action_id)
        
        # Create OIDC application
        create_oidc_application(config, access_token, project_id)
        
        log("==== ZITADEL CONFIGURATION COMPLETED SUCCESSFULLY ====")
        
    except Exception as e:
        log(f"Job failed with error: {str(e)}", "ERROR")
        log(traceback.format_exc(), "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()