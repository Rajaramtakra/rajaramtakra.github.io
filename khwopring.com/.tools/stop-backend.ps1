# Stops the manually-launched MariaDB + Apache processes for this project.
# NOTE: if you also run other WAMP sites via the same MariaDB/Apache binaries,
# this will stop those too - check `Get-Process httpd,mysqld` first if unsure.

Get-Process httpd -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process mysqld -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process mailpit -ErrorAction SilentlyContinue | Stop-Process -Force
Write-Output "Stopped Apache + MariaDB + Mailpit."
