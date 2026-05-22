$repo = "chigozirim007/resume-ai-platform"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($batch in @("issues-batch1.json", "issues-batch2.json")) {
    $file = Join-Path $scriptDir $batch
    $issues = Get-Content $file -Raw | ConvertFrom-Json
    Write-Host "`n=== Processing $batch ($($issues.Count) issues) ===" -ForegroundColor Cyan

    foreach ($issue in $issues) {
        Write-Host "Creating: $($issue.title)" -ForegroundColor Yellow
        $bodyFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $bodyFile -Value $issue.body -Encoding UTF8
        gh issue create --repo $repo --title $issue.title --body-file $bodyFile --label $issue.label 2>&1
        Remove-Item $bodyFile -Force
        Start-Sleep -Milliseconds 400
    }
}

Write-Host "`nAll done!" -ForegroundColor Green
