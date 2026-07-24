// ============================================================
// BLOC DE NOTAS - CON SINCRONIZACIÓN CON GOOGLE DRIVE
// ============================================================

// ---------- CONFIGURACIÓN ----------
const CLIENT_ID = '437507188017-48fi07056vend5a6u3uk2h937gtimmg0.apps.googleusercontent.com';

// ---------- VARIABLES GLOBALES ----------
let apuntes = [];
let apunteEditando = null;
let accessToken = null;
let tokenClient = null;

// ---------- INICIALIZAR ----------
document.addEventListener('DOMContentLoaded', () => {
    cargarApuntes();
    mostrarApuntes();
    configurarBotonSincronizar();
    inicializarGoogleAuth();
    document.getElementById('btnEliminar').disabled = true;
});

// ---------- INICIALIZAR GOOGLE AUTH (MÁXIMA COMPATIBILIDAD MÓVIL) ----------
function inicializarGoogleAuth() {
    if (typeof window.google !== 'undefined' && window.google.accounts?.oauth2) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/drive.file',
            callback: (tokenResponse) => {
                if (tokenResponse.error) {
                    console.error('Error de autorización:', tokenResponse.error);
                    alert('❌ No se pudo autorizar el acceso a Drive.');
                    resetearBoton();
                    return;
                }
                accessToken = tokenResponse.access_token;
                console.log('✅ Token de acceso obtenido con éxito.');
                
                const btn = document.getElementById('btnSincronizar');
                if (btn) {
                    btn.textContent = '☁️ Sincronizar ✅';
                    btn.disabled = false;
                }
                sincronizarDrive();
            },
        });
    }
}

// ---------- CONFIGURAR BOTÓN ----------
function configurarBotonSincronizar() {
    const btn = document.getElementById('btnSincronizar');
    if (btn) {
        btn.textContent = '🔑 Iniciar sesión';
        btn.onclick = manejarSincronizacion;
    }
}

// ---------- MANEJAR SINCRONIZACIÓN ----------
function manejarSincronizacion() {
    const btn = document.getElementById('btnSincronizar');
    
    if (accessToken) {
        sincronizarDrive();
        return;
    }

    btn.textContent = '⏳ Conectando...';
    btn.disabled = true;

    if (tokenClient) {
        // En móviles, esto abre la ventana nativa interactiva correctamente sin bloquearse
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        alert('❌ La librería de Google no está lista. Revisa tu conexión a internet.');
        resetearBoton();
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
            contenido: 'Este es tu bloc de notas para el laboratorio.\n\nEscribe tus apuntes, mediciones y ocurrencias aquí.\n\n¡Todo se guarda automáticamente en tu navegador!\n\nPara sincronizar entre dispositivos, presiona "Iniciar sesión".',
            fecha: new Date().toISOString(),
            eliminado: false
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
    
    // Filtrar para no mostrar las notas que marcamos como eliminadas
    const apuntesVisibles = apuntes.filter(a => !a.eliminado);

    if (apuntesVisibles.length === 0) {
        lista.innerHTML = '<li style="color:#8b949e; text-align:center;">📭 No hay apuntes aún. ¡Crea uno!</li>';
        return;
    }

    // Ordenamos las notas visibles para mostrar la más reciente arriba
    const apuntesOrdenados = [...apuntesVisibles].reverse();
    
    lista.innerHTML = apuntesOrdenados.map((apunte) => {
        const fecha = new Date(apunte.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const preview = apunte.contenido.substring(0, 60) + (apunte.contenido.length > 60 ? '...' : '');
        
        // Buscamos el índice real dentro del arreglo global 'apuntes' usando su ID único
        const idxOriginal = apuntes.findIndex(a => a.id === apunte.id);
        
        return `
            <li onclick="cargarApunte(${idxOriginal})">
                <span class="titulo-lista">${apunte.titulo || 'Sin título'}</span>
                <span class="fecha">${fechaStr}</span>
                <span class="preview">${preview}</span>
            </li>
        `;
    }).join('');
}

// ---------- CARGAR APUNTE ----------
function cargarApunte(index) {
    const apunte = apuntes[index];
    if (!apunte || apunte.eliminado) return;
    document.getElementById('titulo').value = apunte.titulo || '';
    document.getElementById('contenido').value = apunte.contenido || '';
    apunteEditando = index;
    document.getElementById('btnGuardar').textContent = '✏️ Actualizar';
    document.getElementById('btnGuardar').style.background = '#1f6feb';
    document.getElementById('btnEliminar').disabled = false;
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
        apuntes[apunteEditando].eliminado = false; // Asegurar que no esté marcada
        apunteEditando = null;
        document.getElementById('btnGuardar').textContent = '💾 Guardar';
        document.getElementById('btnGuardar').style.background = '#238636';
        document.getElementById('btnEliminar').disabled = true;
    } else {
        const nuevoApunte = {
            id: Date.now(),
            titulo: titulo || 'Sin título',
            contenido: contenido,
            fecha: new Date().toISOString(),
            eliminado: false
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
    document.getElementById('btnEliminar').disabled = true;
    document.getElementById('titulo').focus();
}

// ---------- ELIMINAR APUNTE (CON SOFT DELETE) ----------
function eliminarApunte() {
    if (apunteEditando === null) {
        alert('⚠️ Selecciona una nota para eliminar.');
        return;
    }

    const titulo = apuntes[apunteEditando].titulo || 'Sin título';
    const confirmacion = confirm(`¿Estás seguro de que quieres eliminar la nota "${titulo}"?\n\nEsta acción se sincronizará en todos tus dispositivos.`);
    
    if (!confirmacion) return;

    // Marcado lógico: No hacemos splice, cambiamos la propiedad y actualizamos la fecha de eliminación
    apuntes[apunteEditando].eliminado = true;
    apuntes[apunteEditando].fecha = new Date().toISOString();
    
    guardarApuntes();
    mostrarApuntes();
    
    document.getElementById('titulo').value = '';
    document.getElementById('contenido').value = '';
    apunteEditando = null;
    document.getElementById('btnGuardar').textContent = '💾 Guardar';
    document.getElementById('btnGuardar').style.background = '#238636';
    document.getElementById('btnEliminar').disabled = true;
    
    alert('✅ Nota eliminada correctamente.');
}

// ---------- LIMPIAR TODO ----------
function limpiarTodo() {
    const apuntesVisibles = apuntes.filter(a => !a.eliminado);
    if (apuntesVisibles.length === 0) {
        alert('📭 No hay apuntes activos para eliminar.');
        return;
    }

    const confirmacion = confirm(`⚠️ ¿Estás seguro de que quieres ELIMINAR TODAS las notas?\n\n${apuntesVisibles.length} notas serán marcadas para eliminación.`);
    if (!confirmacion) return;

    // Marcamos todas las notas existentes como eliminadas
    apuntes = apuntes.map(a => ({
        ...a,
        eliminado: true,
        fecha: new Date().toISOString()
    }));

    guardarApuntes();
    mostrarApuntes();
    
    document.getElementById('titulo').value = '';
    document.getElementById('contenido').value = '';
    apunteEditando = null;
    document.getElementById('btnGuardar').textContent = '💾 Guardar';
    document.getElementById('btnGuardar').style.background = '#238636';
    document.getElementById('btnEliminar').disabled = true;
    
    alert('🧹 Todas las notas han sido eliminadas localmente.');
}

// ---------- EXPORTAR A TXT ----------
function exportarTXT() {
    const apuntesVisibles = apuntes.filter(a => !a.eliminado);
    if (apuntesVisibles.length === 0) {
        alert('📭 No hay apuntes para exportar.');
        return;
    }
    let texto = '📓 BLOC DE NOTAS - LABORATORIO\n';
    texto += '='.repeat(50) + '\n\n';
    apuntesVisibles.forEach((apunte, i) => {
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

// ---------- SINCRONIZACIÓN ----------
async function sincronizarDrive() {
    if (!accessToken) {
        alert('🔑 Primero inicia sesión y autoriza el acceso a Drive.');
        return;
    }

    const btn = document.getElementById('btnSincronizar');
    const textoOriginal = btn.textContent;
    btn.textContent = '⏳ Sincronizando...';
    btn.disabled = true;

    try {
        const archivos = await buscarArchivoEnDrive();
        let apuntesDrive = [];
        
        if (archivos.length > 0) {
            const contenido = await descargarArchivoDrive(archivos[0].id);
            try {
                apuntesDrive = JSON.parse(contenido);
            } catch(e) {
                console.error("Error leyendo JSON de Drive, se asume vacío", e);
                apuntesDrive = [];
            }
        }

        // Fusionamos local y nube inteligentemente manejando los eliminados
        const apuntesFusionados = fusionarApuntes(apuntes, apuntesDrive);
        
        apuntes = apuntesFusionados;
        guardarApuntes();
        mostrarApuntes();

        // Subimos la nueva lista unificada a la nube
        await subirArchivoDrive(apuntes);
        
        const activos = apuntes.filter(a => !a.eliminado).length;
        alert(`✅ ¡Sincronización completada!\n📚 ${activos} apuntes activos guardados.`);
        
    } catch (error) {
        console.error('Error en sincronización:', error);
        alert('❌ Error al sincronizar. Revisa tu conexión a internet.');
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
}

// ---------- FUNCIONES DE DRIVE ----------
async function buscarArchivoEnDrive() {
    const response = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=name=%27apuntes_backup.json%27%20and%20trashed=false&spaces=drive&fields=files(id,name,modifiedTime)',
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    return data.files || [];
}

async function descargarArchivoDrive(fileId) {
    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    return await response.text();
}

async function subirArchivoDrive(apuntesData) {
    const jsonStr = JSON.stringify(apuntesData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    const archivos = await buscarArchivoEnDrive();
    
    const formData = new FormData();
    const metadata = { name: 'apuntes_backup.json', mimeType: 'application/json' };
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', blob);

    if (archivos.length > 0) {
        const response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${archivos[0].id}?uploadType=multipart`,
            {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData
            }
        );
        return await response.json();
    } else {
        const response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` },
                body: formData
            }
        );
        return await response.json();
    }
}

// ---------- FUSIONAR APUNTES (CON LÓGICA BIDIRECCIONAL Y SOFT DELETE) ----------
function fusionarApuntes(locales, remotos) {
    if (!remotos || remotos.length === 0) return locales;
    
    const mapa = new Map();

    // 1. Cargamos todos los locales al mapa temporal
    locales.forEach(a => mapa.set(a.id, a));

    // 2. Comparamos contra los remotos
    remotos.forEach(r => {
        if (!mapa.has(r.id)) {
            // Si no existe localmente, lo añadimos directamente
            mapa.set(r.id, r);
        } else {
            // Si existe en ambos lados, comparamos las marcas de tiempo (fecha)
            const l = mapa.get(r.id);
            const fechaLocal = new Date(l.fecha || 0);
            const fechaRemota = new Date(r.fecha || 0);

            if (fechaRemota > fechaLocal) {
                // El archivo en la nube es más nuevo (puede ser una edición o una eliminación más reciente)
                mapa.set(r.id, r);
            }
            // Si la fecha local es mayor, nos quedamos con la versión local (ya está en el mapa)
        }
    });
    
    // Devolvemos el arreglo completo ordenado cronológicamente por ID
    return Array.from(mapa.values()).sort((a, b) => a.id - b.id);
}

// ---------- UTILIDADES ----------
function resetearBoton() {
    const btn = document.getElementById('btnSincronizar');
    if (btn) {
        btn.textContent = '🔑 Iniciar sesión';
        btn.disabled = false;
    }
}

// ---------- ATAJOS ----------
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        guardarApunte();
    }
    if ((e.key === 'Delete' || e.key === 'Supr') && apunteEditando !== null) {
        e.preventDefault();
        eliminarApunte();
    }
});

window.addEventListener('beforeunload', () => guardarApuntes());

console.log('📓 Bloc de Notas - Sincronización robusta y móvil corregida.');
