# Starts MariaDB + Apache for the Khwopring project as plain background
# processes (not Windows services), matching how this dev environment was
# set up. Safe to run multiple times - skips anything already running.

$mariadbExe = "d:\wamp\bin\mariadb\mariadb10.4.10\bin\mysqld.exe"
$mariadbIni = "d:\wamp\bin\mariadb\mariadb10.4.10\my.ini"
$apacheExe  = "d:\wamp\bin\apache\apache2.4.41\bin\httpd.exe"
$apacheConf = "d:\wamp\bin\apache\apache2.4.41\conf\httpd.conf"
$logDir     = "d:\wamp\logs"

if (-not (Get-Process mysqld -ErrorAction SilentlyContinue)) {
  Write-Output "Starting MariaDB..."
  Start-Process -FilePath $mariadbExe -ArgumentList "--defaults-file=`"$mariadbIni`"", "--standalone" `
    -RedirectStandardOutput "$logDir\mysqld_manual.log" -RedirectStandardError "$logDir\mysqld_manual_err.log" `
    -WindowStyle Hidden
  Start-Sleep -Seconds 2
} else {
  Write-Output "MariaDB already running."
}

if (-not (Get-Process httpd -ErrorAction SilentlyContinue)) {
  Write-Output "Starting Apache..."
  Start-Process -FilePath $apacheExe -ArgumentList "-f", "`"$apacheConf`"" `
    -RedirectStandardOutput "$logDir\httpd_manual.log" -RedirectStandardError "$logDir\httpd_manual_err.log" `
    -WindowStyle Hidden
  Start-Sleep -Seconds 2
} else {
  Write-Output "Apache already running."
}

Write-Output "Backend check: http://127.0.0.1:8080/wp-json/khwopring/v1/site-settings"
try {
  $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8080/wp-json/khwopring/v1/site-settings" -UseBasicParsing -TimeoutSec 10
  Write-Output "OK - HTTP $($resp.StatusCode)"
} catch {
  Write-Output "Backend not responding yet - give it a few seconds and retry, or check the logs in d:\wamp\logs\"
}
