#!/bin/sh
#
# This script is used to dynamically configure the application at container startup.
#

# Set a default value for VUE_APP_BASE_URL if it's not provided
export VUE_APP_BASE_URL=${VUE_APP_BASE_URL:-/}

echo "Setting base URL to: ${VUE_APP_BASE_URL}"

# Replace the placeholder in index.html
# Note: Using a different delimiter for sed (#) to avoid issues with URL slashes
sed -i "s#%VUE_APP_BASE_URL%#${VUE_APP_BASE_URL}#g" /usr/share/nginx/html/index.html

# Execute the original command passed to the entrypoint, which is "nginx -g daemon off;"
exec "$@"
