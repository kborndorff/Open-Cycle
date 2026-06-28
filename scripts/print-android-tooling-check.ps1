param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-CommandAvailable {
  param([string]$Name)
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-FileAvailable {
  param([string]$Path)
  return [bool](Test-Path -LiteralPath $Path)
}

$sdkRoots = @()
if ($env:ANDROID_HOME) { $sdkRoots += $env:ANDROID_HOME }
if ($env:ANDROID_SDK_ROOT) { $sdkRoots += $env:ANDROID_SDK_ROOT }
if ($env:LOCALAPPDATA) { $sdkRoots += (Join-Path $env:LOCALAPPDATA "Android\Sdk") }
$sdkRoots = $sdkRoots | Where-Object { $_ } | Select-Object -Unique

Write-Host "OpenCycle Android tooling check"
Write-Host ""
Write-Host "This helper checks local Android SDK tooling only. It does not read, print, prompt for, or store keystores, passwords, signed AAB files, Play Console credentials, Cloudflare tokens, or GitHub tokens."
Write-Host ""
Write-Host "PATH adb available: $(Test-CommandAvailable 'adb.exe')"
Write-Host "PATH emulator available: $(Test-CommandAvailable 'emulator.exe')"
Write-Host "PATH bundletool available: $(Test-CommandAvailable 'bundletool')"
Write-Host "PATH bundletool.jar available: $(Test-CommandAvailable 'bundletool.jar')"
Write-Host ""

foreach ($sdk in $sdkRoots) {
  $adb = Join-Path $sdk "platform-tools\adb.exe"
  $emulator = Join-Path $sdk "emulator\emulator.exe"
  Write-Host "SDK root: $sdk"
  Write-Host "  exists: $(Test-FileAvailable $sdk)"
  Write-Host "  platform-tools adb.exe: $(Test-FileAvailable $adb)"
  Write-Host "  emulator emulator.exe: $(Test-FileAvailable $emulator)"
  if ((Test-FileAvailable $adb) -or (Test-FileAvailable $emulator)) {
    Write-Host ""
    Write-Host "For this PowerShell session, run:"
    Write-Host ('$env:ANDROID_HOME = "' + ($sdk -replace '"', '""') + '"')
    Write-Host '$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:PATH"'
  }
}

Write-Host ""
Write-Host "If adb or emulator is installed but not on PATH, run the session commands above, or persist ANDROID_HOME / ANDROID_SDK_ROOT and reopen PowerShell."
Write-Host "Then rerun:"
Write-Host "npm run generate:signed-runtime-qa-preflight"
Write-Host "npm run validate:signed-runtime-qa-preflight"
