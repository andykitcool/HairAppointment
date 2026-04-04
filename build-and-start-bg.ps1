$ErrorActionPreference = "Continue"
Set-Location "F:\code\HairAppointment"

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$logFile = "F:\code\HairAppointment\build_$timestamp.log"

"=== Build started at $(Get-Date) ===" | Out-File -FilePath $logFile

docker compose build api 2>&1 | Tee-Object -FilePath $logFile -Append
$buildExitCode = $LASTEXITCODE

"=== Build finished with exit code $buildExitCode at $(Get-Date) ===" | Out-File -FilePath $logFile -Append

if ($buildExitCode -eq 0) {
    "=== Starting all containers ===" | Out-File -FilePath $logFile -Append
    docker compose up -d 2>&1 | Tee-Object -FilePath $logFile -Append
    "=== Containers status ===" | Out-File -FilePath $logFile -Append
    docker compose ps 2>&1 | Tee-Object -FilePath $logFile -Append
} else {
    "=== BUILD FAILED ===" | Out-File -FilePath $logFile -Append
}
