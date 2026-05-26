// ── Utilidades de almacenamiento (simula base de datos JSON) ──────────────────

const DB_KEY = 'usuarios_db';

function cargarUsuarios() {
    const datos = localStorage.getItem(DB_KEY);
    return datos ? JSON.parse(datos) : [];
}

function guardarUsuarios(usuarios) {
    localStorage.setItem(DB_KEY, JSON.stringify(usuarios));
}

// ── Hashing SHA-256 con Web Crypto API ────────────────────────────────

async function hashSHA256(texto) {
    const encoder = new TextEncoder();
    const data = encoder.encode(texto);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ── Validación y sanitización de entradas ────────────────────────────

function sanitizarTexto(texto) {
    // Elimina etiquetas HTML y caracteres peligrosos para prevenir XSS
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

function validarCorreo(correo) {
    // Acepta correo con o sin @unal.edu.co
    const re = /^[a-zA-Z0-9._%+\-]+(@unal\.edu\.co)?$/;
    return re.test(correo.trim());
}

function validarPassword(password) {
    // Mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{}|;:'",.<>?]).{8,}$/;
    return re.test(password);
}

function mostrarError(elementId, mensaje) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = mensaje;
        el.style.display = 'block';
    }
}

function limpiarError(elementId) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = '';
        el.style.display = 'none';
    }
}

// ── Bloqueo por intentos fallidos ────────────────────────────────────

const MAX_INTENTOS = 3;
const BLOQUEO_MS   = 2 * 60 * 1000; // 2 minutos
const INTENTOS_KEY = 'login_intentos';

function obtenerEstadoIntentos() {
    const datos = localStorage.getItem(INTENTOS_KEY);
    return datos ? JSON.parse(datos) : { intentos: 0, bloqueadoHasta: null };
}

function guardarEstadoIntentos(estado) {
    localStorage.setItem(INTENTOS_KEY, JSON.stringify(estado));
}

function estaBloqueado() {
    const estado = obtenerEstadoIntentos();
    if (!estado.bloqueadoHasta) return false;
    if (Date.now() < estado.bloqueadoHasta) return true;
    // El tiempo de bloqueo pasó → resetear
    guardarEstadoIntentos({ intentos: 0, bloqueadoHasta: null });
    return false;
}

function registrarIntentoFallido() {
    const estado = obtenerEstadoIntentos();
    estado.intentos += 1;
    if (estado.intentos >= MAX_INTENTOS) {
        estado.bloqueadoHasta = Date.now() + BLOQUEO_MS;
    }
    guardarEstadoIntentos(estado);
    return estado;
}

function resetearIntentos() {
    guardarEstadoIntentos({ intentos: 0, bloqueadoHasta: null });
}

function tiempoRestanteBloqueoBloqueado() {
    const estado = obtenerEstadoIntentos();
    if (!estado.bloqueadoHasta) return 0;
    return Math.max(0, Math.ceil((estado.bloqueadoHasta - Date.now()) / 1000));
}

// ── Registro ─────────────────────────────────────────────────────────────────

async function registrarUsuario(correo, password) {
    // RNF 3: Validar
    if (!validarCorreo(correo)) {
        return { ok: false, msg: 'Correo inválido. Usa tu usuario UNAL (con o sin @unal.edu.co).' };
    }
    if (!validarPassword(password)) {
        return { ok: false, msg: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un símbolo especial.' };
    }

    // RNF 3: Sanitizar
    const correoLimpio = sanitizarTexto(correo.trim().toLowerCase());

    const usuarios = cargarUsuarios();
    if (usuarios.find(u => u.correo === correoLimpio)) {
        return { ok: false, msg: 'Este correo ya está registrado.' };
    }

    // RNF 2: Hash de contraseña
    const hashPassword = await hashSHA256(password);

    usuarios.push({
        correo: correoLimpio,
        password: hashPassword,
        fechaRegistro: new Date().toISOString()
    });
    guardarUsuarios(usuarios);

    return { ok: true, msg: '¡Registro exitoso! Ya puedes iniciar sesión.' };
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function loginUsuario(correo, password) {
    // RNF 4: Verificar bloqueo
    if (estaBloqueado()) {
        const seg = tiempoRestanteBloqueoBloqueado();
        return { ok: false, bloqueado: true, msg: `Demasiados intentos fallidos. Espera ${seg} segundos.` };
    }

    // RNF 3: Validar y sanitizar
    if (!validarCorreo(correo)) {
        return { ok: false, msg: 'Formato de correo inválido.' };
    }
    const correoLimpio = sanitizarTexto(correo.trim().toLowerCase());

    // RNF 2: Comparar hashes
    const hashPassword = await hashSHA256(password);
    const usuarios = cargarUsuarios();
    const usuario = usuarios.find(u => u.correo === correoLimpio && u.password === hashPassword);

    if (!usuario) {
        const estado = registrarIntentoFallido();
        const restantes = MAX_INTENTOS - estado.intentos;
        if (restantes <= 0) {
            return { ok: false, bloqueado: true, msg: `Cuenta bloqueada por ${BLOQUEO_MS / 60000} minutos por demasiados intentos fallidos.` };
        }
        return { ok: false, msg: `Correo o contraseña incorrectos. Intentos restantes: ${restantes}.` };
    }

    resetearIntentos();
    return { ok: true, msg: '¡Inicio de sesión exitoso!', usuario };
}