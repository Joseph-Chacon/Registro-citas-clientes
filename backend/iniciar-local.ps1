$ErrorActionPreference = 'Stop'
$contrasenaSegura = Read-Host 'Contraseña de PostgreSQL' -AsSecureString
$puntero = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($contrasenaSegura)
try {
  $env:BD_CONTRASENA = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($puntero)
  $env:PORT = '8787'
  node (Join-Path $PSScriptRoot 'migrar.mjs')
  node (Join-Path $PSScriptRoot 'servidor.mjs')
} finally {
  if ($puntero -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($puntero) }
  Remove-Item Env:BD_CONTRASENA -ErrorAction SilentlyContinue
}
