const codificador = new TextEncoder();

function aBase64(bytes) {
  let resultado = '';
  for (const byte of bytes) resultado += String.fromCharCode(byte);
  return btoa(resultado);
}

function desdeBase64(texto) {
  const binario = atob(texto);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
}

async function derivarContrasena(contrasena, sal, iteraciones) {
  const material = await crypto.subtle.importKey(
    'raw',
    codificador.encode(contrasena),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteraciones },
    material,
    256,
  ));
}

export function validarContrasena(contrasena) {
  if (typeof contrasena !== 'string' || contrasena.length < 10) {
    return 'La contraseña debe tener al menos 10 caracteres.';
  }
  if (!/[a-záéíóúñ]/i.test(contrasena) || !/\d/.test(contrasena)) {
    return 'La contraseña debe incluir letras y números.';
  }
  return null;
}

export async function crearHashContrasena(contrasena) {
  const error = validarContrasena(contrasena);
  if (error) throw new Error(error);

  const iteraciones = 310000;
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derivarContrasena(contrasena, sal, iteraciones);
  return ['pbkdf2-sha256', iteraciones, aBase64(sal), aBase64(hash)].join('$');
}

export async function verificarContrasena(contrasena, hashAlmacenado) {
  const [algoritmo, iteracionesTexto, salTexto, hashTexto] =
    String(hashAlmacenado).split('$');
  const iteraciones = Number(iteracionesTexto);
  if (algoritmo !== 'pbkdf2-sha256' || !Number.isSafeInteger(iteraciones)) {
    return false;
  }

  const esperado = desdeBase64(hashTexto);
  const obtenido = await derivarContrasena(
    contrasena,
    desdeBase64(salTexto),
    iteraciones,
  );
  if (esperado.length !== obtenido.length) return false;

  let diferencia = 0;
  for (let indice = 0; indice < esperado.length; indice += 1) {
    diferencia |= esperado[indice] ^ obtenido[indice];
  }
  return diferencia === 0;
}

export async function crearTokenSesion() {
  const token = crypto.getRandomValues(new Uint8Array(32));
  return aBase64(token).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function crearHashToken(token) {
  const resultado = await crypto.subtle.digest(
    'SHA-256',
    codificador.encode(token),
  );
  return aBase64(new Uint8Array(resultado));
}
