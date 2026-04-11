$env:SSLKEYLOGFILE = "C:\Users\Ма\tls-lab\sslkeys.log"

Start-Process "chrome.exe" -ArgumentList "--user-data-dir=C:\chrome-tls-test https://localhost:3000/hello"

node server.js