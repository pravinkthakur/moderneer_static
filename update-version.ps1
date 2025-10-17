# Update version.json with current timestamp and git info before commit
# Usage: Run this before every git commit

Write-Host "🔄 Updating version.json..." -ForegroundColor Cyan

# Get git info
$commitHash = git rev-parse --short HEAD 2>$null
if (-not $commitHash) {
    $commitHash = "unknown"
}

$branch = git branch --show-current 2>$null
if (-not $branch) {
    $branch = "main"
}

# Read current version.json to preserve version number
$currentVersion = "1.0.0"
if (Test-Path "version.json") {
    $existing = Get-Content "version.json" | ConvertFrom-Json
    $currentVersion = $existing.version
}

# Create build number from timestamp
$buildNumber = (Get-Date).ToString("yyyyMMddHHmm")
$buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

# Create version object
$versionInfo = @{
    version = $currentVersion
    buildNumber = $buildNumber
    buildDate = $buildDate
    gitCommit = $commitHash
    environment = "production"
    features = @{
        structuredReports = $true
        radarChart = $true
        jsonConfiguration = $true
        apiIntegration = $true
    }
} | ConvertTo-Json -Depth 10

# Write to version.json
Set-Content -Path "version.json" -Value $versionInfo

Write-Host "✅ Version updated:" -ForegroundColor Green
Write-Host "   Version: $currentVersion" -ForegroundColor White
Write-Host "   Build: $buildNumber" -ForegroundColor White
Write-Host "   Build Date: $buildDate" -ForegroundColor White
Write-Host "   Commit: $commitHash" -ForegroundColor White
Write-Host "   Branch: $branch" -ForegroundColor White
