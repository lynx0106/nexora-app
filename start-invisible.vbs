Set WshShell = CreateObject("WScript.Shell")
' Start Backend (Node.js/NestJS) silently
WshShell.Run "cmd /c cd backend && npm run start:dev", 0, false

' Start Frontend (Next.js) silently
WshShell.Run "cmd /c cd frontend && npm run dev", 0, false

' Wait 10 seconds for services to initialize
WScript.Sleep 10000

' Open default browser
WshShell.Run "http://localhost:3002"

Set WshShell = Nothing
