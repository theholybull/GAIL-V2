<#
.SYNOPSIS
    Initialize git repo (if needed) and push to GitHub for backup.
.DESCRIPTION
    Ensures the working_copy is a git repo, stages all changes,
    commits with a timestamped message, and pushes to the configured remote.
.PARAMETER Message
    Optional commit message. Defaults to timestamped agent backup message.
.PARAMETER Remote
    Git remote name. Defaults to 'origin'.
.PARAMETER Branch
    Branch to push. Defaults to 'main'.
#>
param(
    [string]$Message = "",
    [string]$Remote = "origin",
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $repoRoot
try {
    # Ensure git is initialized
    if (-not (Test-Path ".git")) {
        Write-Host "[git-backup] Initializing git repository..."
        git init
        git branch -M $Branch

        # Create .gitignore if it doesn't exist
        if (-not (Test-Path ".gitignore")) {
            @"
node_modules/
dist/
*.sqlite
*.sqlite-wal
*.sqlite-shm
data/private/
data/providers/openai-config.json
data/providers/local-llm-config.json
*.blend1
.env
"@ | Set-Content ".gitignore" -Encoding UTF8
            Write-Host "[git-backup] Created .gitignore"
        }
    }

    # Check if remote exists
    $remotes = git remote 2>&1
    if ($remotes -notcontains $Remote) {
        Write-Host "[git-backup] No remote '$Remote' configured."
        Write-Host "[git-backup] To add a remote, run:"
        Write-Host "    git remote add $Remote https://github.com/YOUR_USER/YOUR_REPO.git"
        Write-Host "[git-backup] Then re-run this script."

        # Still do the local commit
        Write-Host "[git-backup] Proceeding with local commit only..."
    }

    # Stage all changes
    git add -A

    # Check if there are changes to commit
    $status = git status --porcelain 2>&1
    if (-not $status) {
        Write-Host "[git-backup] No changes to commit."
        return
    }

    # Build commit message
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    if (-not $Message) {
        $Message = "[agent] Automated backup — $timestamp"
    } else {
        $Message = "[agent] $Message — $timestamp"
    }

    # Commit
    git commit -m $Message
    Write-Host "[git-backup] Committed: $Message"

    # Push if remote exists
    $remotes = git remote 2>&1
    if ($remotes -contains $Remote) {
        git push $Remote $Branch 2>&1
        Write-Host "[git-backup] Pushed to $Remote/$Branch"
    } else {
        Write-Host "[git-backup] Skipped push — no remote configured."
    }

    # Log the backup action
    $logDir = Join-Path $repoRoot "data" "agent-logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    $logEntry = @{
        timestamp = (Get-Date -Format "o")
        agentId = "git-backup"
        action = "backup_commit"
        details = $Message
        result = "success"
        level = "info"
    } | ConvertTo-Json -Compress
    Add-Content -Path (Join-Path $logDir "git-backup-log.jsonl") -Value $logEntry -Encoding UTF8
    Write-Host "[git-backup] Logged backup action."

} finally {
    Pop-Location
}
