// URL de tu Google Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx9gqbG3hsE0Ohnz_zEb71ecnNqwkVE483IQZN7ii2Lt3soCIGDdDLsv27pprCAqyAV/exec';

// Función para obtener datos del catálogo (mantener igual)
async function obtenerDatosCatalogo() {
    try {
        console.log('🔄 Obteniendo catálogo...');
        const url = `${WEB_APP_URL}?sheet=Catálogo`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        if (!Array.isArray(data)) {
            console.warn('Usando datos de ejemplo para catálogo');
            return obtenerDatosEjemploCatalogo();
        }
        
        console.log(`✅ Catálogo cargado: ${data.length} productos`);
        
        if (data.length === 0) {
            console.warn('Catálogo vacío, usando datos de ejemplo');
            return obtenerDatosEjemploCatalogo();
        }
        
        return data.map((fila, index) => ({
            idinventario: fila[0]?.toString()?.trim() || `PROD${index + 1}`,
            descripcion: fila[1]?.toString()?.trim() || 'Producto sin descripción',
            stockInicial: parseInt(fila[2]) || 0,
            stockActual: parseInt(fila[3]) || 0,
            stockFinal: parseInt(fila[4]) || 0,
            costo: parseFloat(fila[5]) || 0,
            precioVenta: parseFloat(fila[6]) || 0
        }));
        
    } catch (error) {
        console.error('❌ Error al obtener catálogo:', error);
        return obtenerDatosEjemploCatalogo();
    }
}

// FUNCIÓN DE PRUEBA - Versión simplificada
async function guardarPedidoEnSheets(idPedido, vendedor, productos) {
    console.log('🧪 MODO PRUEBA - Iniciando guardado...');
    
    // Crear un payload de prueba mínimo
    const payload = {
        idPedido: idPedido || 'TEST-' + Date.now(),
        vendedor: vendedor || 'Vendedor Test',
        productos: productos || [{
            descripcion: 'Producto de prueba',
            cantidad: 1,
            precio: 10,
            total: 10
        }]
    };
    
    console.log('📤 Enviando a:', WEB_APP_URL);
    console.log('📦 Payload:', JSON.stringify(payload, null, 2));
    
    try {
        // Intentar con fetch normal primero
        console.log('1. Probando con fetch normal...');
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📥 Respuesta recibida - Status:', response.status);
        console.log('📥 Status Text:', response.statusText);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ ÉXITO - Respuesta del servidor:', result);
        
        return result;
        
    } catch (error) {
        console.error('❌ Error con fetch normal:', error);
        
        // Probaremos métodos alternativos
        console.log('2. Probando método alternativo...');
        await probarMetodosAlternativos(WEB_APP_URL, payload);
        
        throw new Error(`No se pudo conectar: ${error.message}`);
    }
}

// Función para probar métodos alternativos
async function probarMetodosAlternativos(url, payload) {
    console.log('🔄 Probando métodos alternativos...');
    
    // Método 2: Fetch con modo 'no-cors' (solo para diagnóstico)
    try {
        console.log('2a. Probando fetch con no-cors...');
        const response = await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        console.log('no-cors response type:', response.type);
    } catch (error) {
        console.log('2a. no-cors falló:', error.message);
    }
    
    // Método 3: XMLHttpRequest
    try {
        console.log('2b. Probando XMLHttpRequest...');
        await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.timeout = 10000;
            
            xhr.onload = function() {
                console.log('XHR Status:', xhr.status);
                console.log('XHR Response:', xhr.responseText);
                resolve(xhr.responseText);
            };
            
            xhr.onerror = function() {
                reject(new Error('XHR Network Error'));
            };
            
            xhr.ontimeout = function() {
                reject(new Error('XHR Timeout'));
            };
            
            xhr.send(JSON.stringify(payload));
        });
    } catch (error) {
        console.log('2b. XMLHttpRequest falló:', error.message);
    }
}

// Funciones de datos de ejemplo
function obtenerDatosEjemploCatalogo() {
    console.log('📋 Usando datos de ejemplo para catálogo');
    return [
        { idinventario: "R001", descripcion: "Filtro de Aceite", stockInicial: 50, stockActual: 25, stockFinal: 25, costo: 5.50, precioVenta: 12.99 },
        { idinventario: "R002", descripcion: "Pastillas de Freno", stockInicial: 30, stockActual: 8, stockFinal: 8, costo: 15.75, precioVenta: 32.50 },
        { idinventario: "R003", descripcion: "Bujías", stockInicial: 100, stockActual: 45, stockFinal: 45, costo: 3.25, precioVenta: 8.99 }
    ];
}

// Otras funciones (mantener igual)
async function obtenerDatosPedidos() {
    // ... código existente
}

async function actualizarStockEnSheets(productosVendidos) {
    return Promise.resolve();
}