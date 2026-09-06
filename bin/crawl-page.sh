#!/bin/bash

SITEMAP_URL="https://forge.pixlmint.ch/sitemap.xml"
# --------------------

echo "Fetching sitemap from: $SITEMAP_URL"

# 1. Fetch the sitemap.xml content
# 2. Use grep to find all lines containing <loc>
# 3. Use sed to strip the <loc> and </loc> tags
URLS=$(curl -s "$SITEMAP_URL" | grep -oP '(?<=<loc>).*?(?=</loc>)')

# Check if we actually found any URLs
if [ -z "$URLS" ]; then
    echo "No URLs found in the sitemap. Please check the URL or the XML format."
    exit 1
fi

# Count the number of URLs found
COUNT=$(echo "$URLS" | wc -l)
echo "Found $COUNT URLs. Starting requests..."
echo "------------------------------------------"

# Loop through each URL and request it
while read -r URL; do
    echo "Requesting: $URL"

    # -I fetches only the headers (faster)
    # Use 'curl -L "$URL"' if you want to download the full page content
    curl -sL -I "$URL" | grep "HTTP/"

    echo "------------------------------------------"
done <<< "$URLS"

echo "Finished processing all entries."
