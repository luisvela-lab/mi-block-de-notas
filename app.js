// ============================================================
// BLOC DE NOTAS - CON SINCRONIZACIÓN CON GOOGLE DRIVE
// ============================================================

// ---------- CONFIGURACIÓN ----------
// ¡TU CLIENT ID DE GOOGLE! (El que copiaste de Google Cloud)
const CLIENT_ID = '437507188017-48fi07056vend5a6u3uk2h937gtimmg0.apps.googleusercontent.com';

// ---------- VARIABLES GLOBALES ----------
let apuntes = [];
let apunteEditando = null;
let usuarioLogueado = false;

// ---------- INICIALIZAR ----------
document.addEventListener('DOMContentLoaded', () => {
    cargarApuntes();
    mostrarApuntes();
    cargarLibreriaGoogle();
});

// ---------- CARGAR LIBRERÍA DE GOOGLE ----------
function cargarLibreriaGoogle() {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
        gapi.load('client:auth2', iniciarGAPI);
    };
    script.onerror = () => {
        console.error('Error al cargar la librería de Google');
        document.getElementById('btnSincronizar').textContent = '⚠️ Error de conexión';
    };
    document.head.appendChild(script);
}

function iniciarGAPI() {
    gapi.client.init({
        clientId: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
    }).then(() => {
        const auth = gapi.auth2.getAuthInstance();
        if (auth.isSignedIn.get()) {
            usuarioLogueado = true;
            document.getElementById('btnSincronizar').textContent = '☁️ Sincronizar ✅';
        } else {
            document.getElementById('btnSincronizar').textContent = '🔑 Conectar con Google';
        }
        // El botón de sincronizar ahora hace login o sincroniza
        document.getElementById('btnSincronizar').onclick = manejarSincronizacion;
    }).catch(err => {
        console.error('Error al iniciar GAPI:', err);
        document.getElementById('btnSincronizar').textContent = '⚠️ Error de conexión';
    });
}

// ---------- MANEJAR SINCRONIZACIÓN (Login + Sincronizar) ----------
function manejarSincronizacion() {
    const auth = gapi.auth2.getAuthInstance();
    
    if (!auth.isSignedIn.get()) {
        // Si no está logueado, hacer login
        auth.signIn().then(() => {
            usuarioLogueado = true;
            document.getElementById('btnSincronizar').textContent = '☁️ Sincronizar ✅';
            sincronizarDrive();
        }).catch(err => {
            alert('❌ No se pudo iniciar sesión. Intenta de nuevo.');
            console.error(err);
        });
    } else {
        // Si ya está logueado, sincronizar
        sincronizarDrive();
    }
}

// ---------- FUNCIONES DE ALMACENAMIENTO LOCAL ----------
function cargarApuntes() {
    const datos = localStorage.getItem('apuntes');
    if (datos) {
        apuntes = JSON.parse(datos);
    } else {
        apuntes = [{
            id: Date.now(),
            titulo: '📌 Bienvenido a tu bloc',
            contenido: 'Este es tu bloc de notas para el laboratorio.\n\nEscribe tus apuntes, mediciones y ocurrencias aquí.\n\n¡Todo se guarda automáticamente en tu navegador!\n\nPara sincronizar entre dispositivos, presiona "Conectar con Google" y luego "Sincronizar".',
            fecha: new Date().toISOString()
        }];
        guardarApuntes();
    }
}

function guardarApuntes() {
    localStorage.setItem('apuntes', JSON.stringify(apuntes));
}

// ---------- MOSTRAR LISTA DE APUNTES ----------
function mostrarApuntes() {
    const lista = document.getElementById('listaApuntes');
    if (apuntes.length === 0) {
        lista.innerHTML = '<li style="color:#8b949e; text-align:center;">📭 No hay apuntes aún. ¡Crea uno!</li>';
        return;
    }

    const apuntesOrdenados = [...apuntes].reverse();
    lista.innerHTML = apuntesOrdenados.map((apunte, index) => {
        const fecha = new Date(apunte.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const preview = apunte.contenido.substring(0, 60) + (apunte.contenido.length > 60 ? '...' : '');
        const idxOriginal = apuntes.length - 1 - index;
        return `
            <li onclick="cargarApunte(${idxOriginal})">
                <span class="titulo-lista">${apunte.titulo || 'Sin título'}</span>
                <span class="fecha">${fechaStr}</span>
                <span class="preview">${preview}</span>
            </li>
        `;
    }).join('');
}

// ---------- CARGAR APUNTE PARA EDITAR ----------
function cargarApunte(index) {
    const apunte = apuntes[index];
    if (!apunte) return;
    document.getElementById('titulo').value = apunte.titulo || '';
    document.getElementById('contenido').value = apunte.contenido || '';
    apunteEditando = index;
    document.getElementById('btnGuardar').textContent = '✏️ Actualizar';
    document.getElementById('btnGuardar').style.background = '#1f6feb';
}

// ---------- GUARDAR APUNTE ----------
function guardarApunte() {
    const titulo = document.getElementById('titulo').value.trim();
    const contenido = document.getElementById('contenido').value.trim();
    if (!titulo && !contenido) {
        alert('⚠️ Escribe algo antes de guardar.');
        return;
    }
    if (apunteEditando !== null) {
        apuntes[apunteEditando].titulo = titulo || 'Sin título';
        apuntes[apunteEditando].contenido = contenido;
        apuntes[apunteEditando].fecha = new Date().toISOString();
        apunteEditando = null;
        document.getElementById('btnGuardar').textContent = '💾 Guardar';
        document.getElementById('btnGuardar').style.background = '#238636';
    } else {
        const nuevoApunte = {
            id: Date.now(),
            titulo: titulo || 'Sin título',
            contenido: contenido,
            fecha: new Date().toISOString()
        };
        apuntes.push(nuevoApunte);
    }
    guardarApuntes();
    mostrarApuntes();
    document.getElementById('titulo').value = '';
    document.getElementById('contenido').value = '';
    const btn = document.getElementById('btnGuardar');
    btn.textContent = '✅ Guardado';
    setTimeout(() => btn.textContent = '💾 Guardar', 1500);
}

function nuevoApunte() {
    document.getElementById('titulo').value = '';
    document.getElementById('contenido').value = '';
    apunteEditando = null;
    document.getElementById('btnGuardar').textContent = '💾 Guardar';
    document.getElementById('btnGuardar').style.background = '#238636';
    document.getElementById('titulo').focus();
}

// ---------- EXPORTAR A TXT ----------
function exportarTXT() {
    if (apuntes.length === 0) {
        alert('📭 No hay apuntes para exportar.');
        return;
    }
    let texto = '📓 BLOC DE NOTAS - LABORATORIO\n';
    texto += '='.repeat(50) + '\n\n';
    apuntes.forEach((apunte, i) => {
        const fecha = new Date(apunte.fecha);
        texto += `📌 ${i+1}. ${apunte.titulo}\n`;
        texto += `📅 ${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES')}\n`;
        texto += `${apunte.contenido}\n`;
        texto += '-'.repeat(40) + '\n\n';
    });
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apuntes_${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ---------- SINCRONIZACIÓN CON GOOGLE DRIVE ----------
async function sincronizarDrive() {
    if (!usuarioLogueado) {
        alert('🔑 Primero inicia sesión con Google.');
        return;
    }

    const btn = document.getElementById('btnSincronizar');
    const textoOriginal = btn.textContent;
    btn.textContent = '⏳ Sincronizando...';
    btn.disabled = true;

    try {
        // 1. Buscar archivo de respaldo en Drive
        const archivos = await buscarArchivoEnDrive();
        let apuntesDrive = [];
        
        if (archivos.length > 0) {
            const contenido = await descargarArchivoDrive(archivos[0].id);
            apuntesDrive = JSON.parse(contenido);
        }

        // 2. Fusionar apuntes locales con los de Drive
        const apuntesFusionados = fusionarApuntes(apuntes, apuntesDrive);
        apuntes = apuntesFusionados;
        guardarApuntes();
        mostrarApuntes();

        // 3. Subir la versión fusionada a Drive
        await subirArchivoDrive(apuntes);
        
        alert(`✅ ¡Sincronización completada!\n📚 ${apuntes.length} apuntes en total.`);
        
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert('❌ Error al sincronizar. Revisa que tengas conexión a internet.');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ---------- FUNCIONES DE DRIVE ----------
function buscarArchivoEnDrive() {
    return gapi.client.drive.files.list({
        q: "name='apuntes_backup.json' and trashed=false",
        spaces: 'drive',
        fields: 'files(id, name, modifiedTime)'
    }).then(response => response.result.files || []);
}

function descargarArchivoDrive(fileId) {
    return gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
    }).then(response => response.body);
}

function subirArchivoDrive(apuntesData) {
    const jsonStr = JSON.stringify(apuntesData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    return buscarArchivoEnDrive().then(archivos => {
        const metadata = {
            name: 'apuntes_backup.json',
            mimeType: 'application/json'
        };
        
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', blob);

        if (archivos.length > 0) {
            // Actualizar archivo existente
            return gapi.client.request({
                path: `/upload/drive/v3/files/${archivos[0].id}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                body: formData
            });
        } else {
            // Crear archivo nuevo
            return gapi.client.request({
                path: '/upload/drive/v3/files',
                method: 'POST',
                params: { uploadType: 'multipart' },
                body: formData
            });
        }
    });
}

// ---------- FUSIONAR APUNTES ----------
function fusionarApuntes(locales, remotos) {
    if (!remotos || remotos.length === 0) return locales;
    
    const mapa = new Map();
    locales.forEach(a => mapa.set(a.id, a));
    remotos.forEach(a => {
        if (!mapa.has(a.id)) {
            mapa.set(a.id, a);
        }
    });
    
    return Array.from(mapa.values()).sort((a, b) => 
        new Date(a.fecha) - new Date(b.fecha)
    );
}

// ---------- ATAJOS Y GUARDADO ----------
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        guardarApunte();
    }
});

window.addEventListener('beforeunload', () => guardarApuntes());

console.log('📓 Bloc de Notas con Drive listo!');
console.log(`📚 ${apuntes.length} apuntes cargados`);
console.log(`🔑 Client ID: ${CLIENT_ID.substring(0, 20)}...`);
