// Función para generar PDF del pedido
function generarPDF(idPedido, vendedor, productos) {
    // Crear instancia de jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuración inicial
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPos = 20;
    
    // Logo y encabezado
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('GONZACARS - REPUESTOS AUTOMOTRICES', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Pedido de Venta', pageWidth / 2, yPos, { align: 'center' });
    
    // Información del pedido
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`N° Pedido: ${idPedido}`, 20, yPos);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - 20, yPos, { align: 'right' });
    
    yPos += 7;
    doc.text(`Vendedor: ${vendedor}`, 20, yPos);
    
    // Tabla de productos
    yPos += 15;
    
    // Encabezado de la tabla
    const headers = [['ID', 'Descripción', 'Cantidad', 'Precio Unit.', 'Total']];
    
    // Datos de la tabla
    const data = productos.map(producto => [
        producto.idinventario,
        producto.descripcion,
        producto.cantidad.toString(),
        `$${producto.precio.toFixed(2)}`,
        `$${producto.total.toFixed(2)}`
    ]);
    
    // Calcular total general
    const totalGeneral = productos.reduce((sum, producto) => sum + producto.total, 0);
    
    // Generar tabla
    doc.autoTable({
        startY: yPos,
        head: headers,
        body: data,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [26, 58, 95] },
        foot: [['', '', '', 'TOTAL:', `$${totalGeneral.toFixed(2)}`]],
        footStyles: { fillColor: [220, 220, 220] }
    });
    
    // Información adicional
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(9);
    doc.text('Este documento es generado automáticamente por el sistema de Gonzacars.', 20, finalY);
    doc.text('Para consultas, contactar al departamento de ventas.', 20, finalY + 5);
    
    // Guardar PDF
    doc.save(`Pedido_${idPedido}.pdf`);
    
    return doc;
}