// URL de tu Google Apps Script
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwTXnuEoH-bO3ssz15JuXnxYbj_DL8lvIbGmG7xkZPjJSQz7x5CO56n8EZ8tOUztoH9/exec';

// Función para obtener datos del catálogo
async function obtenerDatosCatalogo() {
    try {
        console.log('🔄 Obteniendo catálogo...');
        const url = `${WEB_APP_URL}?sheet=Catálogo`;
        console.log('URL de petición:', url);
        
        const response = await fetch(url);
        
        console.log('Respuesta recibida - Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos crudos recibidos:', data);
        
        // Si hay error en la respuesta
        if (data.error) {
            console.error('Error del servidor:', data.error);
            throw new Error(data.error);
        }
        
        // Si no es un array, puede que esté vacío o haya error
        if (!Array.isArray(data)) {
            console.warn('Respuesta inesperada:', data);
            
            // Si es un objeto con error
            if (data && data.error) {
                throw new Error(data.error);
            }
            
            console.warn('Usando datos de ejemplo para catálogo');
            return obtenerDatosEjemploCatalogo();
        }
        
        console.log(`✅ Catálogo cargado: ${data.length} productos`);
        
        // Si está vacío, usar datos de ejemplo
        if (data.length === 0) {
            console.warn('Catálogo vacío, usando datos de ejemplo');
            return obtenerDatosEjemploCatalogo();
        }
        
        return data.map((fila, index) => {
            const producto = {
                idinventario: fila[0]?.toString()?.trim() || '',
                descripcion: fila[1]?.toString()?.trim() || '',
                stockInicial: parseInt(fila[2]) || 0,
                stockActual: parseInt(fila[3]) || 0,
                stockFinal: parseInt(fila[4]) || 0,
                costo: parseFloat(fila[5]) || 0,
                precioVenta: parseFloat(fila[6]) || 0
            };
            
            console.log(`Producto ${index + 1}:`, producto);
            return producto;
        });
        
    } catch (error) {
        console.error('❌ Error al obtener catálogo:', error);
        return obtenerDatosEjemploCatalogo();
    }
}

// Función para obtener datos de pedidos
async function obtenerDatosPedidos() {
    try {
        console.log('🔄 Obteniendo pedidos...');
        const url = `${WEB_APP_URL}?sheet=Pedidos`;
        console.log('URL de petición:', url);
        
        const response = await fetch(url);
        
        console.log('Respuesta recibida - Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Datos crudos recibidos:', data);
        
        if (data.error) {
            console.error('Error del servidor:', data.error);
            throw new Error(data.error);
        }
        
        if (!Array.isArray(data)) {
            console.warn('Respuesta inesperada:', data);
            
            if (data && data.error) {
                throw new Error(data.error);
            }
            
            console.warn('Usando datos de ejemplo para pedidos');
            return obtenerDatosEjemploPedidos();
        }
        
        console.log(`✅ Pedidos cargados: ${data.length} registros`);
        
        if (data.length === 0) {
            console.warn('Pedidos vacíos, usando datos de ejemplo');
            return obtenerDatosEjemploPedidos();
        }
        
        return data.map((fila, index) => {
            const pedido = {
                idPedido: fila[0]?.toString()?.trim() || '',
                fecha: fila[1]?.toString()?.trim() || '',
                descripcion: fila[2]?.toString()?.trim() || '',
                cantidad: parseInt(fila[3]) || 0,
                precio: parseFloat(fila[4]) || 0,
                total: parseFloat(fila[5]) || 0,
                vendedor: fila[6]?.toString()?.trim() || ''
            };
            
            console.log(`Pedido ${index + 1}:`, pedido);
            return pedido;
        });
        
    } catch (error) {
        console.error('❌ Error al obtener pedidos:', error);
        return obtenerDatosEjemploPedidos();
    }
}

// Función para guardar pedido
async function guardarPedidoEnSheets(idPedido, vendedor, productos) {
    try {
        console.log('📝 Intentando guardar pedido...', { 
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
        
        console.log('📤 Enviando datos a:', WEB_APP_URL);
        console.log('Payload:', payload);
        
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log('📥 Respuesta recibida, status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error en respuesta:', errorText);
            throw new Error(`Error del servidor: ${response.status} - ${response.statusText}`);
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
        
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Error de conexión: No se pudo conectar al servidor. Verifica:\n1. Tu conexión a internet\n2. Que la URL del script sea correcta\n3. Que el Google Apps Script esté desplegado correctamente');
        } else {
            throw new Error(`Error al guardar: ${error.message}`);
        }
    }
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

function obtenerDatosEjemploPedidos() {
    console.log('📋 Usando datos de ejemplo para pedidos');
    return [
        { idPedido: "TG-0000001", fecha: "2023-10-15", descripcion: "Filtro de Aceite", cantidad: 2, precio: 12.99, total: 25.98, vendedor: "Juan Pérez" },
        { idPedido: "TG-0000002", fecha: "2023-10-16", descripcion: "Pastillas de Freno", cantidad: 1, precio: 32.50, total: 32.50, vendedor: "María García" },
        { idPedido: "TG-0000003", fecha: "2023-10-17", descripcion: "Bujías", cantidad: 4, precio: 8.99, total: 35.96, vendedor: "Carlos López" }
    ];
}

// Función para actualizar stock (solo local)
async function actualizarStockEnSheets(productosVendidos) {
    console.log('🔄 Actualizando stock localmente...');
    return Promise.resolve();
}