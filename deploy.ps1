#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$configFile = Join-Path $PSScriptRoot "app.config.js"
if (-not (Test-Path $configFile)) {
    Write-Error "app.config.js not found. Copy app.config.example.js and fill in your values."
}

$config = Get-Content $configFile -Raw
$bucket = if ($config -match 's3Bucket:\s*"([^"]+)"') { $Matches[1] } else { $null }
$prefix = if ($config -match 's3Prefix:\s*"([^"]+)"') { $Matches[1] } else { $null }

if (-not $bucket) { Write-Error "s3Bucket not found in app.config.js" }
if (-not $prefix) { Write-Error "s3Prefix not found in app.config.js" }

$destination = "s3://$bucket/$prefix/"
Write-Host "Deploying to $destination"

aws s3 sync $PSScriptRoot $destination `
    --exclude "*" `
    --include "index.html" `
    --include "moderator.html" `
    --include "speaker.html" `
    --include "style.css" `
    --include "app.js" `
    --include "app.config.js" `
#    --delete

Write-Host "Done. Public URL: https://$bucket.s3.us-east-1.amazonaws.com/$prefix/"
