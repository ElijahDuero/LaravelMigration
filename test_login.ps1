# POST login without JSON - simulate a browser form submit
$baseUrl = "https://laravel-migration.vercel.app"

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$getResp = Invoke-WebRequest -Uri "$baseUrl/login" -WebSession $session -UseBasicParsing -TimeoutSec 30

$xsrfCookie = ($session.Cookies.GetCookies("$baseUrl") | Where-Object { $_.Name -eq "XSRF-TOKEN" }).Value
$xsrfDecoded = [System.Uri]::UnescapeDataString($xsrfCookie)
Write-Host "CSRF Token length: $($xsrfDecoded.Length)"

$headers = @{
    "X-XSRF-TOKEN" = $xsrfDecoded
    "Accept"       = "text/html,application/xhtml+xml"
    "Referer"      = "$baseUrl/login"
}
$formBody = "email=testuser%40test.com&password=testpassword123"

$start = Get-Date
try {
    $postResp = Invoke-WebRequest -Uri "$baseUrl/login" -Method POST `
        -Headers $headers -Body $formBody `
        -ContentType "application/x-www-form-urlencoded" `
        -WebSession $session -UseBasicParsing -TimeoutSec 30 -MaximumRedirection 0
    $elapsed = (Get-Date) - $start
    Write-Host "Status: $($postResp.StatusCode) in $([math]::Round($elapsed.TotalSeconds,2))s"
    Write-Host "Content (first 2000 chars):"
    Write-Host $postResp.Content.Substring(0, [Math]::Min(2000, $postResp.Content.Length))
} catch [System.Net.WebException] {
    $elapsed = (Get-Date) - $start
    $statusCode = [int]$_.Exception.Response.StatusCode
    Write-Host "HTTP $statusCode after $([math]::Round($elapsed.TotalSeconds,2))s" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        # Extract the main error text
        if ($respBody -match 'class="message"[^>]*>([^<]+)<') {
            Write-Host "Error: $($matches[1])" -ForegroundColor Yellow
        }
        if ($respBody -match '<title>([^<]+)<') {
            Write-Host "Title: $($matches[1])" -ForegroundColor Yellow
        }
        # Show first 3000 chars of response
        Write-Host "Response (first 3000):"
        Write-Host $respBody.Substring(0, [Math]::Min(3000, $respBody.Length))
    }
}
