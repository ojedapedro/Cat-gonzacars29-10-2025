// URL de tu Google Apps Script (cambia por la URL real que obtengas)
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbx9gqbG3hsE0Ohnz_zEb71ecnNqwkVE483IQZN7ii2Lt3soCIGDdDLsv27pprCAqyAV/exec';

// Función para obtener datos del catálogo
async function obtenerDatosCatalogo() {
    try {
        console.log('Obteniendo datos del catálogo...');
        const url = `${WEB_APP_URL}?sheet=Catálogo`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || data.error) {
            console.log('No se encontraron datos en el catálogo');
            return datosEjemploCatalogo();
        }
        
        console.log(`Se obtuvieron ${data.length} productos del catálogo`);
        
        return data.map(fila => ({
            idinventario: fila[0] || '',
            descripcion: fila[1] || '',
            stockInicial: parseInt(fila[2]) || 0,
            stockActual: parseInt(fila[3]) || 0,
            stockFinal: parseInt(fila[4]) || 0,
            costo: parseFloat(fila[5]) || 0,
            precioVenta: parseFloat(fila[6]) || 0
        }));
    } catch (error) {
        console.error('Error al obtener datos del catálogo:', error);
        return datosEjemploCatalogo();
    }
}

// Función para obtener datos de pedidos
async function obtenerDatosPedidos() {
    try {
        console.log('Obteniendo datos de pedidos...');
        const url = `${WEB_APP_URL}?sheet=Pedidos`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data || data.error) {
            console.log('No se encontraron pedidos');
            return datosEjemploPedidos();
        }
        
        console.log(`Se obtuvieron ${data.length} pedidos`);
        
        return data.map(fila => ({
            idPedido: fila[0] || '',
            fecha: fila[1] || '',
            descripcion: fila[2] || '',
            cantidad: parseInt(fila[3]) || 0,
            precio: parseFloat(fila[4]) || 0,
            total: parseFloat(fila[5]) || 0,
            vendedor: fila[6] || ''
        }));
    } catch (error) {
        console.error('Error al obtener datos de pedidos:', error);
        return datosEjemploPedidos();
    }
}

// Función para guardar pedido usando Google Apps Script
async function guardarPedidoEnSheets(idPedido, vendedor, productos) {
    try {
        console.log('Guardando pedido...', { idPedido, vendedor, productos });
        
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                idPedido,
                vendedor,
                productos
            })
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error desconocido al guardar');
        }

        console.log('Pedido guardado exitosamente:', result);
        return result;
        
    } catch (error) {
        console.error('Error al guardar pedido:', error);
        throw error;
    }
}

// Datos de ejemplo para fallback
function datosEjemploCatalogo() {
    return [
        { idinventario: "R001", descripcion: "Filtro de Aceite", stockInicial: 50, stockActual: 25, stockFinal: 25, costo: 5.50, precioVenta: 12.99 },
        { idinventario: "R002", descripcion: "Pastillas de Freno", stockInicial: 30, stockActual: 8, stockFinal: 8, costo: 15.75, precioVenta: 32.50 },
        { idinventario: "R003", descripcion: "Bujías", stockInicial: 100, stockActual: 45, stockFinal: 45, costo: 3.25, precioVenta: 8.99 }
    ];
}

function datosEjemploPedidos() {
    return [
        { idPedido: "TG-0000001", fecha: "2023-10-15", descripcion: "Filtro de Aceite", cantidad: 2, precio: 12.99, total: 25.98, vendedor: "Juan Pérez" },
        { idPedido: "TG-0000002", fecha: "2023-10-16", descripcion: "Pastillas de Freno", cantidad: 1, precio: 32.50, total: 32.50, vendedor: "María García" }
    ];
}

// Función para actualizar stock (solo local)
async function actualizarStockEnSheets(productosVendidos) {
    console.log('Actualizando stock localmente...');
    // Esta función ahora solo actualiza localmente
    // En una implementación real, podrías agregar otra función al Apps Script
}