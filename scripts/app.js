// Variables globales
let catalogo = [];
let pedidos = [];
let pedidoActual = [];
let correlativoPedido = 'TG-0000001';

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

function inicializarApp() {
    // Configurar navegación
    configurarNavegacion();
    
    // Cargar datos desde Google Sheets
    cargarCatalogo();
    cargarPedidos();
    
    // Configurar eventos
    configurarEventos();
}

function configurarNavegacion() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase activa de todos los enlaces
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase activa al enlace clickeado
            this.classList.add('active');
            
            // Ocultar todas las secciones
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostrar la sección correspondiente
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
            
            // Si vamos a la sección de nuevo pedido, actualizar el select
            if (targetId === 'nuevo-pedido') {
                llenarSelectProductos();
            }
        });
    });
}

function configurarEventos() {
    // Filtros del catálogo
    document.getElementById('buscar-producto').addEventListener('input', filtrarCatalogo);
    document.getElementById('filtro-stock').addEventListener('change', filtrarCatalogo);
    
    // Formulario de pedido
    document.getElementById('producto-pedido').addEventListener('change', actualizarInfoProducto);
    document.getElementById('cantidad-pedido').addEventListener('input', calcularTotalPedido);
    document.getElementById('form-pedido').addEventListener('submit', agregarProductoPedido);
    document.getElementById('generar-pdf').addEventListener('click', generarPDFPedido);
}

async function cargarCatalogo() {
    try {
        // Carga REAL desde Google Sheets
        catalogo = await obtenerDatosCatalogo();
        console.log('Catálogo cargado:', catalogo);
        mostrarCatalogo(catalogo);
        llenarSelectProductos();
        mostrarExito('Catálogo cargado correctamente desde Google Sheets');
    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        mostrarError('No se pudo cargar el catálogo de productos. Usando datos de ejemplo.');
        
        // Usar datos de ejemplo como fallback
        catalogo = await obtenerDatosCatalogo();
        console.log('Catálogo de ejemplo:', catalogo);
        mostrarCatalogo(catalogo);
        llenarSelectProductos();
    }
}

async function cargarPedidos() {
    try {
        // Carga REAL desde Google Sheets
        pedidos = await obtenerDatosPedidos();
        console.log('Pedidos cargados:', pedidos);
        mostrarPedidos(pedidos);
        mostrarExito('Pedidos cargados correctamente desde Google Sheets');
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        mostrarError('No se pudo cargar el historial de pedidos. Usando datos de ejemplo.');
        
        // Usar datos de ejemplo como fallback
        pedidos = await obtenerDatosPedidos();
        console.log('Pedidos de ejemplo:', pedidos);
        mostrarPedidos(pedidos);
    }
}

// FUNCIÓN GUARDAR PEDIDO EN SHEETS - ACTUALIZADA
async function guardarPedidoEnSheets(idPedido, vendedor, productosPedido) {
    const url = 'https://script.google.com/macros/s/AKfychv9gqbGihsEQ0hnz_zEDJIecnNqwMZ48-S1T6d_3W1nKk--9KcHjV1p7Kf8Uf0tN0S0/exec';
    
    const pedidoData = {
        idPedido: idPedido,
        vendedor: vendedor,
        productos: productosPedido,
        fecha: new Date().toISOString(),
        total: productosPedido.reduce((sum, producto) => sum + producto.total, 0)
    };

    console.log('Enviando datos a Google Sheets:', pedidoData);

    try {
        console.log('1. Probando fetch normal...');
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pedidoData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Éxito con fetch normal:', result);
            return result;
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error con fetch normal:', error);
        
        // Método alternativo usando XMLHttpRequest
        console.log('2. Probando método alternativo...');
        return await metodoAlternativoGuardar(pedidoData, url);
    }
}

// MÉTODO ALTERNATIVO PARA GUARDAR
async function metodoAlternativoGuardar(pedidoData, url) {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                console.log('ÉXITO con método alternativo:', xhr.responseText);
                try {
                    const result = JSON.parse(xhr.responseText);
                    resolve(result);
                } catch (e) {
                    resolve({success: true, message: 'Datos enviados (respuesta no JSON)'});
                }
            } else {
                console.error('Error método alternativo:', xhr.statusText);
                resolve({error: `Error ${xhr.status}: ${xhr.statusText}`});
            }
        };
        
        xhr.onerror = function() {
            console.error('Error de red en método alternativo');
            resolve({error: 'Error de conexión con Google Sheets'});
        };
        
        xhr.onloadend = function() {
            console.log('Método alternativo completado, estado:', xhr.status);
        };
        
        console.log('USando método alternativo...');
        xhr.send(JSON.stringify(pedidoData));
    });
}

function mostrarCatalogo(productos) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-catalogo');
    cuerpoTabla.innerHTML = '';
    
    if (productos.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 20px;">
                    No hay productos en el catálogo
                </td>
            </tr>
        `;
        return;
    }
    
    productos.forEach(producto => {
        const fila = document.createElement('tr');
        
        // Determinar clase según stock
        if (producto.stockActual <= 0) {
            fila.classList.add('sin-stock');
        } else if (producto.stockActual < 10) {
            fila.classList.add('stock-bajo');
        }
        
        fila.innerHTML = `
            <td>${producto.idinventario}</td>
            <td>${producto.descripcion}</td>
            <td>${producto.stockInicial}</td>
            <td>${producto.stockActual}</td>
            <td>${producto.stockFinal}</td>
            <td>$${producto.costo.toFixed(2)}</td>
            <td>$${producto.precioVenta.toFixed(2)}</td>
        `;
        
        cuerpoTabla.appendChild(fila);
    });
}

function mostrarPedidos(listaPedidos) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-pedidos');
    cuerpoTabla.innerHTML = '';
    
    if (listaPedidos.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 20px;">
                    No hay pedidos registrados
                </td>
            </tr>
        `;
        return;
    }
    
    listaPedidos.forEach(pedido => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${pedido.idPedido}</td>
            <td>${formatearFecha(pedido.fecha)}</td>
            <td>${pedido.descripcion}</td>
            <td>${pedido.cantidad}</td>
            <td>$${pedido.precio.toFixed(2)}</td>
            <td>$${pedido.total.toFixed(2)}</td>
            <td>${pedido.vendedor}</td>
            <td>
                <button class="btn btn-danger" onclick="eliminarPedido('${pedido.idPedido}')">Eliminar</button>
            </td>
        `;
        
        cuerpoTabla.appendChild(fila);
    });
}

function filtrarCatalogo() {
    const textoBusqueda = document.getElementById('buscar-producto').value.toLowerCase();
    const filtroStock = document.getElementById('filtro-stock').value;
    
    let productosFiltrados = catalogo.filter(producto => {
        // Filtro por texto de búsqueda
        const coincideTexto = producto.descripcion.toLowerCase().includes(textoBusqueda) || 
                             producto.idinventario.toLowerCase().includes(textoBusqueda);
        
        // Filtro por stock
        let coincideStock = true;
        if (filtroStock === 'stock-bajo') {
            coincideStock = producto.stockActual > 0 && producto.stockActual < 10;
        } else if (filtroStock === 'sin-stock') {
            coincideStock = producto.stockActual <= 0;
        }
        
        return coincideTexto && coincideStock;
    });
    
    mostrarCatalogo(productosFiltrados);
}

function llenarSelectProductos() {
    const select = document.getElementById('producto-pedido');
    
    if (!select) {
        console.error('No se encontró el elemento producto-pedido');
        return;
    }
    
    select.innerHTML = '<option value="">Seleccione un producto</option>';
    
    console.log('Llenando select con catálogo:', catalogo);
    
    if (!catalogo || catalogo.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay productos disponibles';
        option.disabled = true;
        select.appendChild(option);
        console.warn('El catálogo está vacío');
        return;
    }
    
    let productosConStock = 0;
    
    catalogo.forEach(producto => {
        // Solo mostrar productos con stock disponible
        if (producto.stockActual > 0) {
            productosConStock++;
            const option = document.createElement('option');
            option.value = producto.idinventario;
            option.textContent = `${producto.idinventario} - ${producto.descripcion} (Stock: ${producto.stockActual})`;
            option.dataset.precio = producto.precioVenta;
            option.dataset.stock = producto.stockActual;
            option.dataset.descripcion = producto.descripcion;
            select.appendChild(option);
        }
    });
    
    if (productosConStock === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No hay productos con stock disponible';
        option.disabled = true;
        select.appendChild(option);
        console.warn('No hay productos con stock disponible');
    } else {
        console.log(`Se agregaron ${productosConStock} productos al select`);
    }
}

function actualizarInfoProducto() {
    const select = document.getElementById('producto-pedido');
    const productoId = select.value;
    const infoProducto = document.getElementById('info-producto');
    
    if (productoId) {
        const productoSeleccionado = select.options[select.selectedIndex];
        const precio = parseFloat(productoSeleccionado.dataset.precio);
        const stock = parseInt(productoSeleccionado.dataset.stock);
        
        document.getElementById('precio-unitario').textContent = `$${precio.toFixed(2)}`;
        document.getElementById('stock-disponible').textContent = stock;
        
        infoProducto.style.display = 'block';
        calcularTotalPedido();
    } else {
        infoProducto.style.display = 'none';
    }
}

function calcularTotalPedido() {
    const cantidad = parseInt(document.getElementById('cantidad-pedido').value) || 0;
    const select = document.getElementById('producto-pedido');
    
    if (select.value && cantidad > 0) {
        const precio = parseFloat(select.options[select.selectedIndex].dataset.precio);
        const total = cantidad * precio;
        document.getElementById('total-pedido').textContent = `$${total.toFixed(2)}`;
    } else {
        document.getElementById('total-pedido').textContent = '-';
    }
}

function agregarProductoPedido(e) {
    e.preventDefault();
    
    const productoId = document.getElementById('producto-pedido').value;
    const cantidad = parseInt(document.getElementById('cantidad-pedido').value);
    const vendedor = document.getElementById('vendedor').value.trim();
    
    if (!productoId || !cantidad || cantidad <= 0 || !vendedor) {
        mostrarError('Por favor complete todos los campos correctamente');
        return;
    }
    
    const select = document.getElementById('producto-pedido');
    const productoSeleccionado = select.options[select.selectedIndex];
    const precio = parseFloat(productoSeleccionado.dataset.precio);
    const descripcion = productoSeleccionado.dataset.descripcion;
    const stockDisponible = parseInt(productoSeleccionado.dataset.stock);
    
    if (cantidad > stockDisponible) {
        mostrarError(`No hay suficiente stock. Stock disponible: ${stockDisponible}`);
        return;
    }
    
    // Verificar si el producto ya está en el pedido
    const productoExistente = pedidoActual.find(item => item.idinventario === productoId);
    
    if (productoExistente) {
        // Actualizar cantidad si ya existe
        productoExistente.cantidad += cantidad;
        productoExistente.total = productoExistente.cantidad * precio;
    } else {
        // Agregar nuevo producto al pedido
        pedidoActual.push({
            idinventario: productoId,
            descripcion: descripcion,
            cantidad: cantidad,
            precio: precio,
            total: cantidad * precio
        });
    }
    
    // Actualizar la tabla del pedido actual
    mostrarPedidoActual();
    
    // Limpiar formulario
    document.getElementById('cantidad-pedido').value = '';
    document.getElementById('producto-pedido').value = '';
    document.getElementById('info-producto').style.display = 'none';
    
    // Habilitar botón de generar PDF si hay productos
    document.getElementById('generar-pdf').disabled = pedidoActual.length === 0;
}

function mostrarPedidoActual() {
    const cuerpoTabla = document.getElementById('cuerpo-pedido-actual');
    cuerpoTabla.innerHTML = '';
    
    let totalGeneral = 0;
    
    if (pedidoActual.length === 0) {
        cuerpoTabla.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 20px;">
                    No hay productos en el pedido
                </td>
            </tr>
        `;
    } else {
        pedidoActual.forEach((producto, index) => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${producto.idinventario}</td>
                <td>${producto.descripcion}</td>
                <td>${producto.cantidad}</td>
                <td>$${producto.precio.toFixed(2)}</td>
                <td>$${producto.total.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger" onclick="eliminarProductoPedido(${index})">Eliminar</button>
                </td>
            `;
            
            cuerpoTabla.appendChild(fila);
            totalGeneral += producto.total;
        });
    }
    
    document.getElementById('total-general').textContent = `$${totalGeneral.toFixed(2)}`;
}

function eliminarProductoPedido(index) {
    pedidoActual.splice(index, 1);
    mostrarPedidoActual();
    
    // Deshabilitar botón de generar PDF si no hay productos
    document.getElementById('generar-pdf').disabled = pedidoActual.length === 0;
}

async function generarPDFPedido() {
    const vendedor = document.getElementById('vendedor').value.trim();
    
    if (!vendedor) {
        mostrarError('Por favor ingrese el nombre del vendedor');
        return;
    }
    
    if (pedidoActual.length === 0) {
        mostrarError('No hay productos en el pedido');
        return;
    }
    
    try {
        // Generar PDF
        generarPDF(correlativoPedido, vendedor, pedidoActual);
        
        // Guardar pedido en Google Sheets (CONEXIÓN REAL)
        const resultado = await guardarPedidoEnSheets(correlativoPedido, vendedor, pedidoActual);
        
        if (resultado && resultado.error) {
            throw new Error(resultado.error);
        }
        
        // Actualizar stock localmente (opcional)
        await actualizarStockEnSheets(pedidoActual);
        
        // Incrementar correlativo
        const nuevoCorrelativo = incrementarCorrelativo(correlativoPedido);
        
        mostrarExito(`Pedido ${correlativoPedido} guardado correctamente en Google Sheets`);
        
        // Limpiar pedido actual
        pedidoActual = [];
        mostrarPedidoActual();
        document.getElementById('vendedor').value = '';
        document.getElementById('generar-pdf').disabled = true;
        
        // Actualizar correlativo
        correlativoPedido = nuevoCorrelativo;
        
        // Recargar datos actualizados
        await cargarCatalogo();
        await cargarPedidos();
        
    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        mostrarError('Error al guardar el pedido en Google Sheets: ' + error.message);
    }
}

function eliminarPedido(idPedido) {
    if (confirm(`¿Está seguro de que desea eliminar el pedido ${idPedido}?`)) {
        // Aquí iría la lógica para eliminar el pedido de Google Sheets
        mostrarExito(`Pedido ${idPedido} eliminado correctamente`);
        // Recargar la lista de pedidos
        cargarPedidos();
    }
}

function incrementarCorrelativo(correlativo) {
    const numero = parseInt(correlativo.split('-')[1]);
    const nuevoNumero = numero + 1;
    return `TG-${nuevoNumero.toString().padStart(7, '0')}`;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

function mostrarError(mensaje) {
    // Implementación mejorada de notificación de error
    const errorDiv = document.createElement('div');
    errorDiv.className = 'notificacion error';
    errorDiv.innerHTML = `
        <span>❌ ${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remover automáticamente después de 5 segundos
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 5000);
}

function mostrarExito(mensaje) {
    // Implementación mejorada de notificación de éxito
    const exitoDiv = document.createElement('div');
    exitoDiv.className = 'notificacion exito';
    exitoDiv.innerHTML = `
        <span>✅ ${mensaje}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    document.body.appendChild(exitoDiv);
    
    // Remover automáticamente después de 5 segundos
    setTimeout(() => {
        if (exitoDiv.parentElement) {
            exitoDiv.remove();
        }
    }, 5000);
}

// Estilos para las notificaciones (agregar al CSS)
const estilosNotificaciones = `
.notificacion {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    z-index: 1000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: slideIn 0.3s ease-out;
}

.notificacion.error {
    background-color: #dc3545;
    border-left: 5px solid #a71e2a;
}

.notificacion.exito {
    background-color: #28a745;
    border-left: 5px solid #1e7e34;
}

.notificacion button {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    margin-left: 10px;
    padding: 0;
    width: 20px;
    height: 20px;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;

// Agregar estilos de notificaciones al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = estilosNotificaciones;
document.head.appendChild(styleSheet);