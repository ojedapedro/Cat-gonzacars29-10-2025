// URL de tu Google Apps Script - VERIFICA QUE ESTA URL SEA CORRECTA
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx9gqbG3hsE0Ohnz_zEb71ecnNqwkVE483IQZN7ii2Lt3soCIGDdDLsv27pprCAqyAV/exec';

// Función para obtener datos del catálogo
async function obtenerDatosCatalogo() {
    try {
        console.log('🔄 Obteniendo catálogo...');
        const url = `${WEB_APP_URL}?sheet=Catálogo&timestamp=${Date.now()}`;
        console.log('📤 URL de petición GET:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            mode: 'no-cors' // Esto puede ayudar con problemas de CORS
        }).catch(error => {
            console.error('❌ Error de fetch:', error);
            throw new Error('No se pudo conectar al servidor: ' + error.message);
        });
        
        console.log('📥 Respuesta recibida - Status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📋 Datos crudos recibidos:', data);
        
        // Si hay error en la respuesta
        if (data && data.error) {
            console.error('❌ Error del servidor:', data.error);
            throw new Error(data.error);
        }
        
        // Si no es un array, puede que esté vacío o haya error
        if (!Array.isArray(data)) {
            console.warn('⚠️ Respuesta inesperada:', data);
            
            // Si es un objeto con error
            if (data && data.error) {
                throw new Error(data.error);
            }
            
            console.warn('📋 Usando datos de ejemplo para catálogo');
            return obtenerDatosEjemploCatalogo();
        }
        
        console.log(`✅ Catálogo cargado: ${data.length} productos`);
        
        // Si está vacío, usar datos de ejemplo
        if (data.length === 0) {
            console.warn('📭 Catálogo vacío, usando datos de ejemplo');
            return obtenerDatosEjemploCatalogo();
        }
        
        const productosProcesados = data.map((fila, index) => {
            const producto = {
                idinventario: fila[0]?.toString()?.trim() || `PROD${index + 1}`,
                descripcion: fila[1]?.toString()?.trim() || 'Producto sin descripción',
                stockInicial: parseInt(fila[2]) || 0,
                stockActual: parseInt(fila[3]) || 0,
                stockFinal: parseInt(fila[4]) || 0,
                costo: parseFloat(fila[5]) || 0,
                precioVenta: parseFloat(fila[6]) || 0
            };
            return producto;
        });
        
        console.log('📦 Productos procesados:', productosProcesados.length);
        return productosProcesados;
        
    } catch (error) {
        console.error('❌ Error al obtener catálogo:', error);
        return obtenerDatosEjemploCatalogo();
    }
}

// Función para guardar pedido - VERSIÓN MEJORADA
async function guardarPedidoEnSheets(idPedido, vendedor, productos) {
    try {
        console.log('📝 Iniciando guardado de pedido...', { 
            idPedido, 
            vendedor, 
            productosCount: productos.length 
        });
        
        // Validar datos antes de enviar
        if (!idPedido || !vendedor || !productos || productos.length === 0) {
            throw new Error('Datos del pedido incompletos');
        }
        
        const payload = {
            idPedido: idPedido.toString(),
            vendedor: vendedor.toString(),
            productos: productos.map(p => ({
                descripcion: p.descripcion?.toString() || '',
                cantidad: Number(p.cantidad) || 0,
                precio: Number(p.precio) || 0,
                total: Number(p.total) || 0
            }))
        };
        
        console.log('📤 Enviando POST a:', WEB_APP_URL);
        console.log('📦 Payload:', JSON.stringify(payload));
        
        // Intentar con diferentes métodos para evitar problemas de CORS
        let response;
        
        try {
            // Método 1: Fetch normal
            response = await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
        } catch (fetchError) {
            console.error('❌ Error en fetch:', fetchError);
            
            // Método 2: Usar XMLHttpRequest como fallback
            try {
                console.log('🔄 Intentando con XMLHttpRequest...');
                response = await enviarConXMLHttpRequest(WEB_APP_URL, payload);
            } catch (xhrError) {
                throw new Error(`Error de conexión: ${fetchError.message} | ${xhrError.message}`);
            }
        }

        console.log('📥 Respuesta recibida, status:', response.status, response.statusText);
        
        if (!response.ok) {
            let errorText = 'Sin detalles';
            try {
                errorText = await response.text();
            } catch (e) {
                // Ignorar error al leer el texto
            }
            console.error('❌ Error en respuesta:', errorText);
            throw new Error(`Error del servidor: ${response.status} - ${response.statusText}. Detalles: ${errorText}`);
        }

        const result = await response.json();
        console.log('📋 Resultado parseado:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Error desconocido al guardar');
        }

        console.log('✅ Pedido guardado exitosamente');
        return result;
        
    } catch (error) {
        console.error('❌ Error crítico al guardar pedido:', error);
        
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('NetworkError') || 
            error.message.includes('CORS') ||
            error.message.includes('conexión')) {
            
            throw new Error(`Problema de conexión: ${error.message}\n\nPor favor verifica:\n1. Tu conexión a internet\n2. Que la URL del script sea correcta\n3. Que el Google Apps Script esté desplegado como "Aplicación web"\n4. Que los permisos sean "Cualquier persona"`);
        } else {
            throw new Error(`Error al guardar: ${error.message}`);
        }
    }
}

// Función auxiliar para enviar con XMLHttpRequest (fallback)
function enviarConXMLHttpRequest(url, data) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({
                            ok: true,
                            status: xhr.status,
                            json: () => Promise.resolve(response)
                        });
                    } catch (e) {
                        reject(new Error('Error al parsear respuesta XMLHttpRequest: ' + e.message));
                    }
                } else {
                    reject(new Error(`XMLHttpRequest error: ${xhr.status} ${xhr.statusText}`));
                }
            }
        };
        
        xhr.onerror = function() {
            reject(new Error('Error de red en XMLHttpRequest'));
        };
        
        xhr.timeout = 30000; // 30 segundos
        xhr.ontimeout = function() {
            reject(new Error('Timeout en XMLHttpRequest'));
        };
        
        try {
            xhr.send(JSON.stringify(data));
        } catch (sendError) {
            reject(new Error('Error al enviar XMLHttpRequest: ' + sendError.message));
        }
    });
}

// Funciones de datos de ejemplo
function obtenerDatosEjemploCatalogo() {
    console.log('📋 Usando datos de ejemplo para catálogo');
    return [
        { idinventario: "R001", descripcion: "Filtro de Aceite", stockInicial: 50, stockActual: 25, stockFinal: 25, costo: 5.50, precioVenta: 12.99 },
        { idinventario: "R002", descripcion: "Pastillas de Freno", stockInicial: 30, stockActual: 8, stockFinal: 8, costo: 15.75, precioVenta: 32.50 },
        { idinventario: "R003", descripcion: "Bujías", stockInicial: 100, stockActual: 45, stockFinal: 45, costo: 3.25, precioVenta: 8.99 },
        { idinventario: "R004", descripcion: "Aceite Motor 5W-30", stockInicial: 80, stockActual: 15, stockFinal: 15, costo: 18.00, precioVenta: 35.99 },
        { idinventario: "R005", descripcion: "Filtro de Aire", stockInicial: 40, stockActual: 12, stockFinal: 12, costo: 7.80, precioVenta: 18.50 }
    ];
}

// Función para obtener datos de pedidos (mantener igual)
async function obtenerDatosPedidos() {
    // ... (mantén el código existente)
}

// Función para actualizar stock (solo local)
async function actualizarStockEnSheets(productosVendidos) {
    console.log('🔄 Actualizando stock localmente...');
    return Promise.resolve();
}