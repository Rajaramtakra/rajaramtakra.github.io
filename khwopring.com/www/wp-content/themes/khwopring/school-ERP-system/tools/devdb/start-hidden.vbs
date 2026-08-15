Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "D:\wamp\www\school-ERP-system\tools\devdb"
WshShell.Run "cmd /c """"C:\Program Files\nodejs\node.exe"" start_existing.js >> devdb.log 2>&1""", 0, False
