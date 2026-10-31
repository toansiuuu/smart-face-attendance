$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

function Test-DockerReady {
    # Windows PowerShell 5.1 can turn redirected native stderr into a terminating error.
    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        & docker info *> $null
        return ($LASTEXITCODE -eq 0)
    } finally {
        $ErrorActionPreference = $previousPreference
    }
}

try {
    $systemDisk = Get-PSDrive -Name $env:SystemDrive.TrimEnd(':')
    if ($systemDisk.Free -lt 1GB) {
        $freeMB = [math]::Round($systemDisk.Free / 1MB)
        throw "Windows drive $($env:SystemDrive) has only $freeMB MB free. Free disk space before starting Docker (several GB for the first build), or move Docker storage to D: in Docker Desktop settings."
    }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker Desktop is not installed or docker is missing from PATH.'
    }
    & docker compose version
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose is unavailable. Update Docker Desktop.' }

    if (-not (Test-DockerReady)) {
        $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
        if (-not (Test-Path -LiteralPath $dockerDesktop)) { throw 'Start Docker Desktop manually, then run run-all.bat again.' }
        Write-Host 'Starting Docker Desktop. Waiting for the Linux engine...'
        Start-Process -FilePath $dockerDesktop -WindowStyle Hidden
        $deadline = (Get-Date).AddMinutes(3)
        do {
            Start-Sleep -Seconds 3
            $ready = Test-DockerReady
            if ($ready) { break }
        } while ((Get-Date) -lt $deadline)
        if (-not $ready) {
            throw 'Docker did not become ready. Open Docker Desktop and finish any setup or WSL prompts, then retry.'
        }
    }

    if ([string]::IsNullOrWhiteSpace($env:LIVENESS_SECRET)) {
        $bytes = New-Object byte[] 32
        $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
        try { $random.GetBytes($bytes) } finally { $random.Dispose() }
        $env:LIVENESS_SECRET = [BitConverter]::ToString($bytes).Replace('-', '').ToLowerInvariant()
    }
    Write-Host 'Building and starting MySQL, liveness, backend, and frontend. The first build may take several minutes.'
    & docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face up -d --build --wait --wait-timeout 180
    if ($LASTEXITCODE -ne 0) {
        & docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face logs --tail 60
        throw 'Application startup failed. See the build or service error above.'
    }
    Write-Host "`nOpen http://localhost:5173/login"
    Write-Host 'Development account: admin / admin1234567890 (if unchanged).'
    Write-Host 'Face identity matching and liveness are ready. Enroll employees through the manager dashboard.'
    Write-Host 'Stop: docker compose -f docker-compose.yml -f docker-compose.app.yml --profile face stop'
} catch {
    Write-Host "`n$($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
