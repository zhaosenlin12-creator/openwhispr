# Robust stop for OpenWhispr dev processes.
# - Matches by executable path OR command line (npm run dev spawns node from system
#   nodejs, so Path alone misses them).
# - Also kills anything bound to the Vite dev port (5183) in case the watch above
#   misses a wrapper.
[CmdletBinding()]
param()

$ErrorActionPreference = "SilentlyContinue"

# 1. Collect candidate PIDs from the running process table.
$candidates = New-Object System.Collections.Generic.List[int]
$procs = Get-CimInstance Win32_Process -Filter "Name in ('electron.exe','node.exe','vite.exe','conhost.exe','cmd.exe')"
foreach ($p in $procs) {
  $exe  = [string]$p.ExecutablePath
  $cmd  = [string]$p.CommandLine
  $pid_ = [int]$p.ProcessId
  if ($exe -like "*D:\kaifa_stu\gpt6\openwhispr*")            { $candidates.Add($pid_); continue }
  if ($exe -like "*\openwhispr*")                             { $candidates.Add($pid_); continue }
  if ($cmd -match "openwhispr")                               { $candidates.Add($pid_); continue }
  if ($cmd -match "open-whispr")                              { $candidates.Add($pid_); continue }
  if ($cmd -match "OpenWhispr")                               { $candidates.Add($pid_); continue }
  if ($cmd -match "concurrently.*open-whispr")                { $candidates.Add($pid_); continue }
}

# 2. Also grab anything listening on the Vite dev port.
$port = 5183
$portProcs = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($c in $portProcs) { $candidates.Add([int]$c.OwningProcess) }

# 3. Dedupe and kill.
$unique = $candidates | Sort-Object -Unique
$killed = 0
foreach ($pid_ in $unique) {
  if ($pid_ -le 0) { continue }
  if ($pid_ -eq $PID) { continue }  # never kill ourselves
  try {
    Stop-Process -Id $pid_ -Force -ErrorAction Stop
    $killed++
  } catch {}
}

Start-Sleep -Seconds 1

# 4. Report.
$remaining = @(
  Get-CimInstance Win32_Process -Filter "Name in ('electron.exe','node.exe','vite.exe','conhost.exe')" |
  Where-Object {
    $_.ExecutablePath -like "*openwhispr*" -or
    $_.CommandLine    -match "openwhispr|open-whispr|OpenWhispr"
  }
)
$portStill = (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count
Write-Host "[stop] killed=$killed remaining=$($remaining.Count) port5183_listen=$portStill"