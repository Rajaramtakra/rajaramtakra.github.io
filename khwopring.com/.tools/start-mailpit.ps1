# Starts Mailpit (local SMTP catcher for the contact form) if not already running.
# Web inbox: http://127.0.0.1:8025/

if (-not (Get-Process mailpit -ErrorAction SilentlyContinue)) {
  Write-Output "Starting Mailpit..."
  Start-Process -FilePath "d:\wamp\www\Khwopring.com.np\.tools\mailpit\mailpit.exe" `
    -ArgumentList "--smtp", "127.0.0.1:1025", "--listen", "127.0.0.1:8025" `
    -WindowStyle Hidden
  Start-Sleep -Seconds 1
} else {
  Write-Output "Mailpit already running."
}
Write-Output "Inbox: http://127.0.0.1:8025/"
