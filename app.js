// ============================================================
// Bloc de Notas - App principal
// ============================================================

// ---------- VARIABLES GLOBALES ----------
let apuntes = [];
let apunteEditando = null; // índice del apunte que se está editando

// ---------- INICIALIZAR ----------
document.addEventListener('DOMContentLoaded', () => {
    cargarApuntes();
    mostrarApuntes();
});

// ---------- FUNCIONES DE ALMACENAMIENTO LOCAL ----------
function cargarApuntes() {
    const datos = localStorage.getItem('apuntes');
    if (datos) {
        apuntes = JSON.parse(datos);
    } else {
        // Apuntes de ejemplo
        apuntes = [
            {
                id: Date.now(),
                titulo: '📌 Bienvenido a tu bloc',
                contenido: 'Este es tu bloc de notas para el laboratorio.\n\nEscribe tus apuntes, mediciones y ocurrencias aquí.\n\n¡Todo se guarda automáticamente en tu navegador!',
                fecha: new Date().toISOString()
            }
        ];
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

    // Mostrar del más reciente al más antiguo
    const apuntesOrdenados = [...apuntes].reverse();
    
    lista.innerHTML = apuntesOrdenados.map((apunte, index) => {
        const fecha = new Date(apunte.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const preview = apunte.contenido.substring(0, 60) + (apunte.contenido.length > 60 ? '...' : '');
        const idxOriginal = apuntes.length - 1 - index; // índice real en el array original
        
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
    
    // Cambiar texto del botón
    document.getElementById('btnGuardar').textContent = '✏️ Actualizar';
    document.getElementById('btnGuardar').style.background = '#1f6feb';
}

// ---------- GUARDAR APUNTE (NUEVO O ACTUALIZAR) ----------
function guardarApunte() {
    const titulo = document.getElementById('titulo').value.trim();
    const contenido = document.getElementById('contenido').value.trim();
    
    if (!titulo && !contenido) {
        alert('⚠️ Escribe algo antes de guardar.');
        return;
    }
    
    if (apunteEditando !== null) {
        // Actualizar apunte existente
        apuntes[apunteEditando].titulo = titulo || 'Sin título';
        apuntes[apunteEditando].contenido = contenido;
        apuntes[apunteEditando].fecha = new Date().toISOString();
        apunteEditando = null;
        document.getElementById('btnGuardar').textContent = '💾 Guardar';
        document.getElementById('btnGuardar').style.background = '#238636';
    } else {
        // Crear nuevo apunte
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
    
    // Limpiar campos
    document.getElementById('titulo').value = '';
    document.getElementById('contenido').value = '';
    
    // Feedback
    const btn = document.getElementById('btnGuardar');
    btn.textContent = '✅ Guardado';
    setTimeout(() => {
        btn.textContent = '💾 Guardar';
    }, 1500);
}

// ---------- NUEVO APUNTE ----------
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
    
    let texto = '📓 BLOG DE NOTAS - LABORATORIO\n';
    texto += '='.repeat(50) + '\n\n';
    
    apuntes.forEach((apunte, i) => {
        const fecha = new Date(apunte.fecha);
        texto += `📌 ${i+1}. ${apunte.titulo}\n`;
        texto += `📅 ${fecha.toLocaleDateString('es-ES')} ${fecha.toLocaleTimeString('es-ES')}\n`;
        texto += `${apunte.contenido}\n`;
        texto += '-'.repeat(40) + '\n\n';
    });
    
    // Descargar archivo
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

// ---------- SINCRONIZACIÓN CON GOOGLE DRIVE (PASO 2) ----------
function sincronizarDrive() {
    // Por ahora, solo un mensaje
    alert('⏳ Función de sincronización en desarrollo.\n\nTus apuntes están guardados localmente en este dispositivo.');
    
    // TODO: Implementar API de Google Drive en la siguiente fase
    // 1. Autenticar con Google
    // 2. Subir archivo JSON a Drive
    // 3. Descargar y fusionar apuntes
}

// ---------- DETECCIÓN DE CIERRE (Guardado automático) ----------
window.addEventListener('beforeunload', () => {
    guardarApuntes();
});

// ---------- ATAJO DE TECLADO: Ctrl+Enter para guardar ----------
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        guardarApunte();
    }
});

console.log('📓 Bloc de Notas cargado correctamente');
console.log(`📚 ${apuntes.length} apuntes en total`);
