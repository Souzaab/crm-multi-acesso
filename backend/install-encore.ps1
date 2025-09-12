#!/usr/bin/env pwsh
[CmdletBinding()]
param ($version)

$ErrorActionPreference = 'Stop'

$EncoreDir = if ($env:ENCORE_INSTALL) {
  $env:ENCORE_INSTALL
} else {
  "$Home\.encore"
}

$BinDir = "$EncoreDir\bin"

$EncoreTar = "$EncoreDir\encore.tar.gz"
$EncoreExe = "$BinDir\encore.exe"
$Target = 'windows_amd64'

# GitHub requires TLS 1.2
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$EncoreURI = if (!$version) {
  $Response = Invoke-WebRequest 'https://encore.dev/api/releases' -UseBasicParsing | ConvertFrom-Json
  $Release = $Response.windows_amd64
  $version = $Release.version
  $Release.url
} else {
  "https://d2f391esomvqpi.cloudfront.net/encore-${version}-${Target}.tar.gz"
}

Write-Output "Installing Encore v$version from $EncoreURI"

if (!(Test-Path $EncoreDir)) {
  New-Item $EncoreDir -ItemType Directory | Out-Null
}

$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest $EncoreURI -OutFile $EncoreTar -UseBasicParsing

Push-Location $EncoreDir

# It is not possible to remove running exe-files, but it is possible to rename them
$PrevBinNewName = "binprev-$(Get-Date -UFormat %s)"
Remove-Item .\binprev* -ErrorAction SilentlyContinue -Recurse
Rename-Item -Path .\bin -NewName $PrevBinNewName -ErrorAction SilentlyContinue

Remove-Item .\encore-go -ErrorAction SilentlyContinue -Recurse
Remove-Item .\runtimes -ErrorAction SilentlyContinue -Recurse
tar -xzf $EncoreTar
Pop-Location

Remove-Item $EncoreTar

$User = [EnvironmentVariableTarget]::User
$Path = [Environment]::GetEnvironmentVariable('Path', $User)
if (!(";$Path;".ToLower() -like "*;$BinDir;*".ToLower())) {
  [Environment]::SetEnvironmentVariable('Path', "$Path;$BinDir", $User)
  $Env:Path += ";$BinDir"
}

Write-Output "Encore was installed successfully to $EncoreExe and added to %PATH%!"
Write-Output "Run 'encore --help' to get started."

