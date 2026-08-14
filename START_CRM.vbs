Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""C:\Users\V Saimanogna\Downloads\investment-crm-v2\frontend"" && npm run dev", 1, False
WScript.Sleep 2000
WshShell.Run "http://localhost:5173"
