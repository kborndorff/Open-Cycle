param(
  [string]$OutputPath = "$HOME\.opencycle\keys\upload-keystore.jks",
  [string]$Alias = "upload",
  [int]$ValidityDays = 9125,
  [string]$DistinguishedName = "CN=open-cycle,O=OpenCycle,C=US",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Find-JavaTool {
  param([string]$ToolName)

  $candidates = @()

  if ($env:JAVA_HOME) {
    $candidates += Join-Path $env:JAVA_HOME "bin\$ToolName"
  }

  $pathTool = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($pathTool) {
    $candidates += $pathTool.Source
  }

  $programRoots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ }
  foreach ($programRoot in $programRoots) {
    foreach ($androidStudioDir in @("Android Studio", "Android Studio1", "Android Studio2")) {
      $candidates += Join-Path $programRoot "Android\$androidStudioDir\jbr\bin\$ToolName"
    }
  }

  foreach ($candidate in $candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return [System.IO.Path]::GetFullPath($candidate)
    }
  }

  return $null
}

$target = [System.IO.Path]::GetFullPath($OutputPath)
$targetDir = Split-Path -Parent $target
$keytool = Find-JavaTool "keytool.exe"

if ($DryRun -and -not $keytool) {
  Write-Host "Android upload keystore dry run"
  Write-Host "No keystore will be created and no passwords will be requested."
  Write-Host ""
  Write-Host "keytool was not resolved from JAVA_HOME, PATH, or common Android Studio JBR locations."
  Write-Host ""
  Write-Host "Would create keystore at:"
  Write-Host $target
  Write-Host ""
  Write-Host "Would use alias: $Alias"
  Write-Host "Would use validity days: $ValidityDays"
  Write-Host "Would use distinguished name: $DistinguishedName"
  Write-Host ""
  Write-Host "Set JAVA_HOME or install Android Studio before running without -DryRun."
  exit 0
}

if (-not $keytool) {
  throw "Could not find keytool from JAVA_HOME, PATH, or common Android Studio JBR locations. Example: `$env:JAVA_HOME=`"`$env:ProgramFiles\Android\Android Studio2\jbr`""
}

if ($DryRun) {
  Write-Host "Android upload keystore dry run"
  Write-Host "No keystore will be created and no passwords will be requested."
  Write-Host ""
  Write-Host "Would use keytool:"
  Write-Host $keytool
  Write-Host ""
  Write-Host "Would create keystore at:"
  Write-Host $target
  Write-Host ""
  Write-Host "Would use alias: $Alias"
  Write-Host "Would use validity days: $ValidityDays"
  Write-Host "Would use distinguished name: $DistinguishedName"
  Write-Host ""
  Write-Host "Run without -DryRun only from a private owner machine when you are ready to create the upload keystore."
  exit 0
}

New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

if (Test-Path $target) {
  throw "Keystore already exists at $target. Move it aside before creating a new upload key."
}

$secureStorePass = Read-Host -AsSecureString -Prompt "New keystore password"
$secureKeyPass = Read-Host -AsSecureString -Prompt "New key password"

$storePassPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureStorePass)
$keyPassPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKeyPass)

try {
  $env:OPENCYCLE_ANDROID_STOREPASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto($storePassPtr)
  $env:OPENCYCLE_ANDROID_KEYPASS = [Runtime.InteropServices.Marshal]::PtrToStringAuto($keyPassPtr)

  & $keytool -genkeypair `
    -v `
    -keystore $target `
    -storetype JKS `
    -storepass:env OPENCYCLE_ANDROID_STOREPASS `
    -keypass:env OPENCYCLE_ANDROID_KEYPASS `
    -alias $Alias `
    -keyalg RSA `
    -keysize 2048 `
    -validity $ValidityDays `
    -dname $DistinguishedName

  Write-Host ""
  Write-Host "Created Android upload keystore:"
  Write-Host $target
  Write-Host ""
  Write-Host "For this terminal session, set:"
  Write-Host "`$env:ANDROID_KEYSTORE_PATH=`"$target`""
  Write-Host "`$env:ANDROID_KEY_ALIAS=`"$Alias`""
  Write-Host "`$env:ANDROID_KEYSTORE_PASSWORD=<same password you entered>"
  Write-Host "`$env:ANDROID_KEY_PASSWORD=<same key password you entered>"
}
finally {
  Remove-Item Env:\OPENCYCLE_ANDROID_STOREPASS -ErrorAction SilentlyContinue
  Remove-Item Env:\OPENCYCLE_ANDROID_KEYPASS -ErrorAction SilentlyContinue
  if ($storePassPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($storePassPtr)
  }
  if ($keyPassPtr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($keyPassPtr)
  }
  [System.GC]::Collect()
}
