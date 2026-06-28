param(
  [switch]$DryRun,
  [switch]$SkipBuild,
  [switch]$SkipPublicGate,
  [string]$KeystorePath = "",
  [string]$Alias = "upload"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-SecureStringToPlainText {
  param([Security.SecureString]$Secret)

  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
  try {
    return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  }
}

function Clear-AndroidSigningEnvironment {
  Remove-Item Env:ANDROID_KEYSTORE_PATH -ErrorAction SilentlyContinue
  Remove-Item Env:ANDROID_KEY_ALIAS -ErrorAction SilentlyContinue
  Remove-Item Env:ANDROID_KEYSTORE_PASSWORD -ErrorAction SilentlyContinue
  Remove-Item Env:ANDROID_KEY_PASSWORD -ErrorAction SilentlyContinue
}

function Invoke-NpmRelease {
  param([string[]]$ExtraArgs)

  & npm run mobile:release:android -- @ExtraArgs
  if ($LASTEXITCODE -ne 0) {
    throw "Android private release failed with code $LASTEXITCODE."
  }
}

$releaseArgs = @()
if ($SkipBuild) {
  $releaseArgs += "--skip-build"
}
if ($SkipPublicGate) {
  $releaseArgs += "--skip-public-gate"
}

if ($DryRun) {
  Invoke-NpmRelease -ExtraArgs (@("--dry-run") + $releaseArgs)
  exit 0
}

if (-not $KeystorePath) {
  $defaultKeystorePath = Join-Path $HOME ".opencycle\keys\upload-keystore.jks"
  $KeystorePath = Read-Host "Path to Play upload keystore [$defaultKeystorePath]"
  if (-not $KeystorePath) {
    $KeystorePath = $defaultKeystorePath
  }
}

if (-not (Test-Path -LiteralPath $KeystorePath)) {
  throw "Keystore file not found: $KeystorePath"
}

$keystorePasswordSecure = Read-Host "Keystore password" -AsSecureString
$keyPasswordSecure = Read-Host "Key password" -AsSecureString
$keystorePassword = $null
$keyPassword = $null

try {
  $keystorePassword = Convert-SecureStringToPlainText -Secret $keystorePasswordSecure
  $keyPassword = Convert-SecureStringToPlainText -Secret $keyPasswordSecure

  Clear-AndroidSigningEnvironment
  Set-Item Env:ANDROID_KEYSTORE_PATH $KeystorePath
  Set-Item Env:ANDROID_KEY_ALIAS $Alias
  Set-Item Env:ANDROID_KEYSTORE_PASSWORD $keystorePassword
  Set-Item Env:ANDROID_KEY_PASSWORD $keyPassword

  Invoke-NpmRelease -ExtraArgs $releaseArgs
} finally {
  Clear-AndroidSigningEnvironment
  Remove-Variable keystorePasswordSecure, keyPasswordSecure -ErrorAction SilentlyContinue
  Remove-Variable keystorePassword, keyPassword -ErrorAction SilentlyContinue
}
