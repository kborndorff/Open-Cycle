param(
  [switch]$ApplyToUser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Test-JavaHome {
  param([string]$Path)

  if (-not $Path) {
    return $false
  }

  $jarsigner = Join-Path $Path "bin\jarsigner.exe"
  $keytool = Join-Path $Path "bin\keytool.exe"
  return (Test-Path -LiteralPath $jarsigner) -and (Test-Path -LiteralPath $keytool)
}

function Test-AndroidSdk {
  param([string]$Path)

  if (-not $Path) {
    return $false
  }

  $platforms = Join-Path $Path "platforms"
  $buildTools = Join-Path $Path "build-tools"
  return (Test-Path -LiteralPath $platforms) -and (Test-Path -LiteralPath $buildTools)
}

function Select-FirstExisting {
  param(
    [string[]]$Candidates,
    [scriptblock]$Predicate
  )

  foreach ($candidate in $Candidates) {
    if (& $Predicate $candidate) {
      return $candidate
    }
  }

  return ""
}

function Quote-PowerShell {
  param([string]$Value)

  return '"' + ($Value -replace '"', '""') + '"'
}

$javaCandidates = @(
  $env:JAVA_HOME,
  (Join-Path $env:ProgramFiles "Android\Android Studio\jbr"),
  (Join-Path $env:ProgramFiles "Android\Android Studio2\jbr"),
  (Join-Path ${env:ProgramFiles(x86)} "Android\Android Studio\jbr"),
  (Join-Path ${env:ProgramFiles(x86)} "Android\Android Studio2\jbr")
) | Where-Object { $_ }

$androidCandidates = @(
  $env:ANDROID_HOME,
  $env:ANDROID_SDK_ROOT,
  (Join-Path $env:LOCALAPPDATA "Android\Sdk")
) | Where-Object { $_ }

$javaHome = Select-FirstExisting -Candidates $javaCandidates -Predicate ${function:Test-JavaHome}
$androidHome = Select-FirstExisting -Candidates $androidCandidates -Predicate ${function:Test-AndroidSdk}

Write-Host "OpenCycle owner tooling environment helper"
Write-Host ""
Write-Host "This helper does not read, print, or store Cloudflare tokens, Play Console credentials, keystore passwords, or signing keys."
Write-Host ""

if ($javaHome) {
  Write-Host "Detected Java signing tools:"
  Write-Host "- JAVA_HOME candidate found."
  Write-Host ""
  Write-Host "For this PowerShell session, run:"
  Write-Host ('$env:JAVA_HOME = ' + (Quote-PowerShell $javaHome))
  Write-Host '$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"'
} else {
  Write-Host "Java signing tools were not found in common Android Studio locations."
  Write-Host "Install Android Studio or set JAVA_HOME to a Java runtime that includes jarsigner.exe and keytool.exe."
}

Write-Host ""

if ($androidHome) {
  Write-Host "Detected Android SDK:"
  Write-Host "- ANDROID_HOME candidate found."
  Write-Host ""
  Write-Host "For this PowerShell session, run:"
  Write-Host ('$env:ANDROID_HOME = ' + (Quote-PowerShell $androidHome))
} else {
  Write-Host "Android SDK was not found in common locations."
  Write-Host 'Install or open Android Studio SDK Manager, then set ANDROID_HOME to your SDK path, commonly "$env:LOCALAPPDATA\Android\Sdk".'
}

Write-Host ""
Write-Host "Then re-check:"
Write-Host "npm run validate:owner-tools"

if ($ApplyToUser) {
  Write-Host ""
  Write-Host "Applying detected values to the current Windows user environment."
  if ($javaHome) {
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
  }
  if ($androidHome) {
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "User")
  }
  Write-Host "Open a new terminal before rerunning validation."
}
