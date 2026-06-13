/**
 * Aplicación Frontend - Sistema de Gestión de Archivos
 * Maneja la interacción del usuario, subida de archivos y visualización de resultados
 */

class FileManagementApp {
    constructor() {
        this.apiBaseUrl = '/api/files';
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalFiles = 0;
        
        this.initializeEventListeners();
        this.loadFiles();
    }

    /**
     * Inicializar todos los event listeners de la aplicación
     */
    initializeEventListeners() {
        // Elementos del DOM
        this.uploadForm = document.getElementById('uploadForm');
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.changeFileBtn = document.getElementById('changeFileBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.alertContainer = document.getElementById('alertContainer');

        // Event listeners para subida de archivos
        this.uploadForm.addEventListener('submit', this.handleFileUpload.bind(this));
        this.fileInput.addEventListener('change', this.handleFileSelection.bind(this));
        this.selectFileBtn.addEventListener('click', () => this.fileInput.click());
        this.changeFileBtn.addEventListener('click', this.clearFileSelection.bind(this));
        this.refreshBtn.addEventListener('click', () => this.loadFiles());

        // Drag & Drop functionality
        this.setupDragAndDrop();

        // Auto-refresh cada 2 minutos (más amigable)
        setInterval(() => this.loadFiles(), 120000);
    }

    /**
     * Configurar funcionalidad de arrastrar y soltar archivos
     */
    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, this.highlight.bind(this), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadZone.addEventListener(eventName, this.unhighlight.bind(this), false);
        });

        this.uploadZone.addEventListener('drop', this.handleDrop.bind(this), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlight() {
        this.uploadZone.classList.add('drag-over');
    }

    unhighlight() {
        this.uploadZone.classList.remove('drag-over');
    }

    /**
     * Manejar archivos soltados en la zona de subida
     */
    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileSelection();
        }
    }

    /**
     * Manejar selección de archivo
     */
    handleFileSelection() {
        const file = this.fileInput.files[0];
        
        if (!file) {
            this.clearFileSelection();
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = [
            'text/csv',                        // CSV estándar
            'application/csv',                 // CSV alternativo
            'text/comma-separated-values',     // CSV variante
            'text/plain',                      // Algunos sistemas detectan CSV como texto plano
            'application/json',                // JSON
            'text/json',                       // JSON alternativo
            'application/pdf',                 // PDF
            'application/msword',              // Word (.doc)
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word (.docx)
            'application/vnd.ms-excel',        // Excel (.xls)
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'       // Excel (.xlsx)
        ];

        // También validar por extensión como respaldo
        const fileName = file.name.toLowerCase();
        const hasValidExtension = fileName.endsWith('.csv') || fileName.endsWith('.json') || 
                                 fileName.endsWith('.pdf') || fileName.endsWith('.doc') || 
                                 fileName.endsWith('.docx') || fileName.endsWith('.xls') || 
                                 fileName.endsWith('.xlsx');

        if (!allowedTypes.includes(file.type) && !hasValidExtension) {
            Toast.error('Tipo de archivo no permitido. Solo se aceptan archivos CSV, JSON, PDF, Word y Excel.');
            this.clearFileSelection();
            return;
        }

        // Validar tamaño (10MB máximo)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            Toast.error('El archivo es demasiado grande. Máximo permitido: 10MB');
            this.clearFileSelection();
            return;
        }

        // Mostrar información del archivo
        this.displayFileInfo(file);
        this.uploadBtn.disabled = false;
    }

    /**
     * Mostrar información del archivo seleccionado
     */
    displayFileInfo(file) {
        const fileName = document.getElementById('fileName');
        const fileSize = document.getElementById('fileSize');

        fileName.textContent = file.name;
        fileSize.textContent = this.formatFileSize(file.size);

        this.fileInfo.classList.remove('d-none');
        this.fileInfo.classList.add('fade-in-up');
    }

    /**
     * Limpiar selección de archivo
     */
    clearFileSelection() {
        this.fileInput.value = '';
        this.fileInfo.classList.add('d-none');
        this.uploadBtn.disabled = true;
        this.clearAlerts();
    }

    /**
     * Manejar subida de archivo
     */
    async handleFileUpload(e) {
        e.preventDefault();
        
        const file = this.fileInput.files[0];
        if (!file) return;

        this.setUploadingState(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}/upload`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                Toast.success(`Archivo "${file.name}" subido exitosamente y siendo procesado`);
                this.clearFileSelection();
                this.loadFiles(); // Recargar lista de archivos
            } else {
                throw new Error(result.message || 'Error al subir el archivo');
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            Toast.error('Error al subir el archivo: ' + (error.message || 'Inténtalo nuevamente'));
        } finally {
            this.setUploadingState(false);
        }
    }

    /**
     * Cambiar estado visual durante la subida
     */
    setUploadingState(isUploading) {
        const uploadText = this.uploadBtn.querySelector('.upload-text');
        const uploadLoading = this.uploadBtn.querySelector('.upload-loading');

        if (isUploading) {
            uploadText.classList.add('d-none');
            uploadLoading.classList.remove('d-none');
            this.uploadBtn.disabled = true;
        } else {
            uploadText.classList.remove('d-none');
            uploadLoading.classList.add('d-none');
            this.uploadBtn.disabled = false;
        }
    }

    /**
     * Cargar lista de archivos desde la API
     */
    async loadFiles() {
        const tableBody = document.getElementById('filesTableBody');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        try {
            loadingState.classList.remove('d-none');
            emptyState.classList.add('d-none');

            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}?page=${this.currentPage}&limit=${this.itemsPerPage}`);
            const result = await response.json();

            if (result.success) {
                this.totalFiles = result.pagination.totalItems;
                this.renderFilesTable(result.data);
                this.renderPagination(result.pagination);
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Error loading files:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-danger p-4">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Error al cargar las evaluaciones: ${error.message}
                    </td>
                </tr>
            `;
        } finally {
            loadingState.classList.add('d-none');
        }
    }

    /**
     * Renderizar tabla de archivos
     */
    renderFilesTable(files) {
        const tableBody = document.getElementById('filesTableBody');
        const emptyState = document.getElementById('emptyState');

        if (files.length === 0) {
            tableBody.innerHTML = '';
            emptyState.classList.remove('d-none');
            return;
        }

        emptyState.classList.add('d-none');

        tableBody.innerHTML = files.map(file => `
            <tr class="fade-in-up">
                <td>
                    <div class="d-flex align-items-center">
                        <i class="bi bi-file-earmark-bar-graph text-primary me-2"></i>
                        <div>
                            <div class="fw-semibold">${this.escapeHtml(file.filename)}</div>
                            <small class="text-muted">ID: ${file.id.substring(0, 8)}...</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div>
                        ${this.formatDate(file.createdAt)}
                    </div>
                    <small class="text-muted">
                        ${this.formatTime(file.createdAt)}
                    </small>
                </td>
                <td>
                    ${this.renderMaturityLevel(file)}
                </td>
                <td>
                    ${this.renderStatusBadge(file.status)}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline-primary me-2" onclick="app.viewEvaluationDetails('${file.id}')">
                        <i class="bi bi-eye me-1"></i>
                        Ver Evaluación
                    </button>
                    ${file.hasResult ? `
                        <button class="btn btn-sm btn-outline-success" onclick="app.downloadReport('${file.id}')">
                            <i class="bi bi-download me-1"></i>
                            Descargar Informe
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    /**
     * Renderizar badge de estado con colores
     */
    renderStatusBadge(status) {
        const statusConfig = {
            'PENDING': { class: 'status-pending', icon: 'clock', text: 'Pendiente' },
            'PROCESSING': { class: 'status-processing', icon: 'gear-fill', text: 'Procesando' },
            'COMPLETED': { class: 'status-completed', icon: 'check-circle-fill', text: 'Completado' },
            'ERROR': { class: 'status-error', icon: 'exclamation-triangle-fill', text: 'Error' }
        };

        const config = statusConfig[status] || statusConfig['PENDING'];
        
        return `
            <span class="status-badge ${config.class}">
                <i class="bi bi-${config.icon} me-1"></i>
                ${config.text}
            </span>
        `;
    }

    /**
     * Renderizar controles de paginación
     */
    renderPagination(pagination) {
        const paginationInfo = document.getElementById('paginationInfo');
        const paginationControls = document.getElementById('paginationControls');

        // Información de paginación
        const start = (pagination.currentPage - 1) * pagination.itemsPerPage + 1;
        const end = Math.min(start + pagination.itemsPerPage - 1, pagination.totalItems);
        
        paginationInfo.textContent = `Mostrando ${start}-${end} de ${pagination.totalItems} archivos`;

        // Controles de paginación
        if (pagination.totalPages <= 1) {
            paginationControls.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botón anterior
        paginationHTML += `
            <li class="page-item ${pagination.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="app.changePage(${pagination.currentPage - 1})" ${pagination.currentPage === 1 ? 'disabled' : ''}>
                    <i class="bi bi-chevron-left"></i>
                </button>
            </li>
        `;

        // Páginas
        const startPage = Math.max(1, pagination.currentPage - 2);
        const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="app.changePage(${i})">${i}</button>
                </li>
            `;
        }

        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="app.changePage(${pagination.currentPage + 1})" ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}>
                    <i class="bi bi-chevron-right"></i>
                </button>
            </li>
        `;

        paginationControls.innerHTML = paginationHTML;
    }

    /**
     * Cambiar página de la tabla
     */
    changePage(page) {
        if (page < 1 || page > Math.ceil(this.totalFiles / this.itemsPerPage)) return;
        
        this.currentPage = page;
        this.loadFiles();
    }

    /**
     * Ver detalles de un archivo específico
     */
    async viewFileDetails(fileId) {
        try {
            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}/${fileId}`);
            const result = await response.json();

            if (result.success) {
                this.displayFileDetailsModal(result.data);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error fetching file details:', error);
            Toast.error('Error al cargar los detalles del archivo');
        }
    }

    /**
     * Mostrar modal con detalles del archivo
     */
    displayFileDetailsModal(fileData) {
        const modal = new bootstrap.Modal(document.getElementById('fileDetailModal'));
        const content = document.getElementById('fileDetailContent');

        content.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">Información General</h6>
                    <table class="table table-sm">
                        <tr>
                            <td class="fw-semibold">ID:</td>
                            <td><code>${fileData.id}</code></td>
                        </tr>
                        <tr>
                            <td class="fw-semibold">Nombre:</td>
                            <td>${this.escapeHtml(fileData.filename)}</td>
                        </tr>
                        <tr>
                            <td class="fw-semibold">Estado:</td>
                            <td>${this.renderStatusBadge(fileData.status)}</td>
                        </tr>
                        <tr>
                            <td class="fw-semibold">Fecha de Subida:</td>
                            <td>${this.formatDate(fileData.createdAt)} ${this.formatTime(fileData.createdAt)}</td>
                        </tr>
                        <tr>
                            <td class="fw-semibold">Última Actualización:</td>
                            <td>${this.formatDate(fileData.updatedAt)} ${this.formatTime(fileData.updatedAt)}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-md-6">
                    <h6 class="text-muted mb-2">Resultado del Procesamiento</h6>
                    <div class="bg-light rounded p-3" style="max-height: 300px; overflow-y: auto;">
                        ${fileData.result ? `
                            <pre class="mb-0 small">${JSON.stringify(fileData.result, null, 2)}</pre>
                        ` : `
                            <div class="text-center text-muted">
                                <i class="bi bi-hourglass-split mb-2 d-block"></i>
                                <small>Resultado aún no disponible</small>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;

        modal.show();
    }

    /**
     * Descargar resultado de procesamiento
     */
    async downloadResult(fileId) {
        try {
            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}/${fileId}`);
            const result = await response.json();

            if (result.success && result.data.result) {
                const blob = new Blob([JSON.stringify(result.data.result, null, 2)], {
                    type: 'application/json'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `resultado-${fileId.substring(0, 8)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                throw new Error('Resultado no disponible');
            }
        } catch (error) {
            console.error('Error downloading result:', error);
            Toast.error('Error al descargar el resultado');
        }
    }

    /**
     * Mostrar alertas al usuario
     */
    showAlert(type, title, message = '') {
        const alertClass = type === 'error' ? 'alert-danger' : `alert-${type}`;
        const icon = {
            'success': 'check-circle-fill',
            'error': 'exclamation-triangle-fill',
            'info': 'info-circle-fill'
        }[type] || 'info-circle-fill';

        const alertHTML = `
            <div class="alert ${alertClass} alert-dismissible fade show fade-in-up" role="alert">
                <div class="d-flex">
                    <i class="bi bi-${icon} me-2 flex-shrink-0"></i>
                    <div class="flex-grow-1">
                        <strong>${title}</strong>
                        ${message ? `<div class="small mt-1">${message}</div>` : ''}
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;

        this.alertContainer.innerHTML = alertHTML;

        // Auto-hide después de 5 segundos (solo para success)
        if (type === 'success') {
            setTimeout(() => {
                const alert = this.alertContainer.querySelector('.alert');
                if (alert) {
                    const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
                    bsAlert.close();
                }
            }, 5000);
        }
    }

    /**
     * Limpiar todas las alertas
     */
    clearAlerts() {
        this.alertContainer.innerHTML = '';
    }

    // Utilidades
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /**
     * Renderizar nivel de madurez en ciberseguridad
     */
    renderMaturityLevel(file) {
        if (file.status !== 'COMPLETED' || !file.hasResult) {
            return '<span class="text-muted">-</span>';
        }

        // Crear un placeholder que se llenará asincrónicamente
        const placeholderId = `maturity-${file.id}`;
        
        // Obtener datos reales usando la misma API que el modal
        this.loadMaturityData(file.id, placeholderId);
        
        return `
            <div id="${placeholderId}" class="d-flex align-items-center">
                <i class="bi bi-hourglass-split text-muted me-2"></i>
                <span class="text-muted">Cargando...</span>
            </div>
        `;
    }

    /**
     * Cargar datos de madurez usando la misma API que el modal
     */
    async loadMaturityData(fileId, placeholderId) {
        try {
            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}/${fileId}/evaluation`);
            const result = await response.json();

            if (result.success && result.data.evaluation) {
                const evaluation = result.data.evaluation;
                const level = evaluation.maturityLevel || 1;
                
                const maturityLevels = {
                    1: { name: 'Inicial', color: '#dc3545', icon: 'shield-x' },
                    2: { name: 'Básico', color: '#fd7e14', icon: 'shield-exclamation' },
                    3: { name: 'Intermedio', color: '#ffc107', icon: 'shield' },
                    4: { name: 'Avanzado', color: '#20c997', icon: 'shield-check' },
                    5: { name: 'Líder', color: '#28a745', icon: 'shield-fill-check' }
                };

                const maturity = maturityLevels[level];
                
                // Actualizar el placeholder con los datos reales
                const placeholder = document.getElementById(placeholderId);
                if (placeholder) {
                    placeholder.innerHTML = `
                        <i class="bi bi-${maturity.icon} me-2" style="color: ${maturity.color}"></i>
                        <div>
                            <span class="fw-semibold" style="color: ${maturity.color}">Nivel ${level}</span>
                            <div class="small text-muted">${maturity.name}</div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error loading maturity data:', error);
            const placeholder = document.getElementById(placeholderId);
            if (placeholder) {
                placeholder.innerHTML = '<span class="text-danger">Error</span>';
            }
        }
    }

    /**
     * Ver detalles de evaluación de ciberseguridad
     */
    async viewEvaluationDetails(fileId) {
        try {
            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}/${fileId}/evaluation`);
            const result = await response.json();

            if (result.success && result.data.evaluation) {
                this.showEvaluationModal(result.data);
            } else {
                this.showEvaluationModal(result.data);
            }
        } catch (error) {
            console.error('Error loading evaluation:', error);
            Toast.error('Error al cargar los detalles de la evaluación');
        }
    }

    /**
     * Mostrar modal con detalles de evaluación (optimizado para performance)
     */
    showEvaluationModal(data) {
        this.currentEvaluationData = data.evaluation || null;

        // Crear estructura base del modal rápidamente
        const baseModalHtml = `
            <div class="modal fade" id="evaluationModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content border-0 shadow-lg">
                        <div class="modal-body p-0 position-relative" id="evaluationModalBody">
                            <button type="button" class="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Cerrar" style="z-index: 10;"></button>
                            <div class="text-center p-5" id="evaluationLoadingPlaceholder">
                                <div class="spinner-border text-primary mb-3" style="width: 2rem; height: 2rem;" role="status">
                                    <span class="visually-hidden">Cargando evaluación...</span>
                                </div>
                                <p class="text-muted">Cargando evaluación...</p>
                            </div>
                        </div>
                        <div class="modal-footer bg-light border-top-0 py-2">
                            <div class="d-flex align-items-center justify-content-between w-100">
                                <small class="text-muted">
                                    <i class="bi bi-calendar3 me-1"></i>
                                    Fecha: ${data.evaluation ? new Date(data.evaluation.timestamp).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('es-ES')}
                                </small>
                                <div>
                                    <button type="button" class="btn btn-outline-secondary me-2" data-bs-dismiss="modal">
                                        <i class="bi bi-x-lg me-1"></i>Cerrar
                                    </button>
                                    ${data.hasReport ? `
                                        <button type="button" class="btn btn-primary" onclick="app.downloadReport('${data.id}')">
                                            <i class="bi bi-file-earmark-pdf me-1"></i>
                                            Descargar Informe Completo
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remover modal existente si hay uno
        const existingModal = document.getElementById('evaluationModal');
        if (existingModal) {
            // Limpiar listeners antes de remover
            const bsModal = bootstrap.Modal.getInstance(existingModal);
            if (bsModal) {
                bsModal.hide();
            }
            existingModal.remove();
        }

        // Agregar modal al body
        document.body.insertAdjacentHTML('beforeend', baseModalHtml);
        const modalElement = document.getElementById('evaluationModal');

        // Mostrar modal con contenido placeholder
        const modal = new bootstrap.Modal(modalElement);
        modal.show();

        // Renderizar contenido asincrónico después de abrir el modal
        requestAnimationFrame(() => {
            const contentHtml = this.renderEvaluationContent(data);
            const bodyDiv = document.getElementById('evaluationModalBody');
            if (bodyDiv) {
                // Remover placeholder y agregar contenido real
                const placeholder = document.getElementById('evaluationLoadingPlaceholder');
                if (placeholder) {
                    placeholder.remove();
                }
                bodyDiv.innerHTML = `
                    <button type="button" class="btn-close position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Cerrar" style="z-index: 10;"></button>
                    ${contentHtml}
                `;
            }
        });

        // Limpiar listeners y remover modal cuando se cierre
        const handleModalHidden = () => {
            if (modalElement) {
                // Remover focus de cualquier elemento antes de remover el modal
                if (document.activeElement && modalElement.contains(document.activeElement)) {
                    document.activeElement.blur();
                }
                modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
                modalElement.remove();
            }
        };

        modalElement.addEventListener('hidden.bs.modal', handleModalHidden, { once: true });
    }

    /**
     * Obtener recomendación completa por dimensión
     */
    getDimensionRecommendationText(evaluation, dimensionKey, index) {
        const fromDimensionRecommendations = evaluation?.dimensionRecommendations?.[dimensionKey]?.recommendation;
        if (fromDimensionRecommendations && typeof fromDimensionRecommendations === 'string') {
            return fromDimensionRecommendations.trim();
        }

        if (Array.isArray(evaluation?.recommendations) && typeof evaluation.recommendations[index] === 'string') {
            return evaluation.recommendations[index].trim();
        }

        return '';
    }

    /**
     * Generar preview en una sola línea para recomendación
     */
    getRecommendationPreview(text, maxLength = 120) {
        if (!text) {
            return '';
        }

        const cleanText = text.replace(/\s+/g, ' ').trim();
        if (cleanText.length <= maxLength) {
            return cleanText;
        }

        return `${cleanText.slice(0, maxLength).trim()}...`;
    }

    /**
     * Mostrar modal secundario con recomendación completa
     */
    showRecommendationModal(dimensionKey) {
        if (!this.currentEvaluationData || !this.currentEvaluationData.scores) {
            return;
        }

        const entries = Object.entries(this.currentEvaluationData.scores);
        const index = entries.findIndex(([key]) => key === dimensionKey);
        if (index === -1) {
            return;
        }

        const [key, dimension] = entries[index];
        const recommendation = this.getDimensionRecommendationText(this.currentEvaluationData, key, index);

        if (!recommendation) {
            Toast.info('No hay recomendación detallada disponible para esta dimensión todavía.');
            return;
        }

        const existingModal = document.getElementById('dimensionRecommendationModal');
        if (existingModal) {
            const bsModal = bootstrap.Modal.getInstance(existingModal);
            if (bsModal) {
                bsModal.hide();
            }
            existingModal.remove();
        }

        const detailModalHtml = `
            <div class="modal fade" id="dimensionRecommendationModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-scrollable">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-lightbulb me-2"></i>
                                Recomendación - ${this.escapeHtml(dimension.name)}
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0 recommendation-full-text">${this.escapeHtml(recommendation)}</p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', detailModalHtml);
        const detailModalElement = document.getElementById('dimensionRecommendationModal');
        const detailModal = new bootstrap.Modal(detailModalElement);
        detailModal.show();

        const handleModalHidden = () => {
            if (document.activeElement && detailModalElement.contains(document.activeElement)) {
                document.activeElement.blur();
            }
            detailModalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
            detailModalElement.remove();
        };

        detailModalElement.addEventListener('hidden.bs.modal', handleModalHidden, { once: true });
    }

    /**
     * Renderizar contenido de evaluación con diseño ejecutivo
     */
    renderEvaluationContent(data) {
        if (!data.evaluation) {
            return `
                <div class="text-center p-5">
                    <div class="mb-4">
                        <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                            <span class="visually-hidden">Procesando...</span>
                        </div>
                    </div>
                    <h5 class="text-primary">Evaluación en Proceso</h5>
                    <p class="text-muted mb-4">La evaluación de ciberseguridad está siendo procesada con IA avanzada.<br>Este proceso puede tardar unos minutos.</p>
                    <div class="alert alert-info mx-auto" style="max-width: 500px;">
                        <i class="bi bi-info-circle me-2"></i>
                        <small><strong>Estado actual:</strong> ${data.status}</small>
                    </div>
                </div>
            `;
        }

        const evaluation = data.evaluation;
        return `
            <!-- Header con KPIs principales -->
            <div class="pt-4 px-4 pb-3">
                <div class="row g-3">
                    <!-- KPI Principal -->
                    <div class="col-md-3">
                        <div class="card border-0 shadow-sm h-100" style="background: linear-gradient(135deg, ${evaluation.maturityColor}20 0%, ${evaluation.maturityColor}10 100%);">
                            <div class="card-body text-center py-4">
                                <div class="mb-2">
                                    <i class="bi bi-shield-check text-primary" style="font-size: 2.5rem;"></i>
                                </div>
                                <h2 class="mb-0" style="font-size: 3rem; font-weight: 700;">${evaluation.globalScore}</h2>
                                <p class="text-muted mb-0 small">de 100 puntos</p>
                                <div class="mt-3">
                                    <span class="badge px-3 py-2" style="background-color: ${evaluation.maturityColor}; font-size: 0.9rem;">
                                        Nivel ${evaluation.maturityLevel}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de la Empresa -->
                    <div class="col-md-5">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <h6 class="text-primary mb-3">
                                    <i class="bi bi-building me-2"></i>
                                    Información de la Organización
                                </h6>
                                <div class="row g-2">
                                    <div class="col-12">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-briefcase text-muted me-2"></i>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.75rem;">Empresa</small>
                                                <strong>${evaluation.companyInfo?.name || 'No especificado'}</strong>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-envelope text-muted me-2"></i>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.75rem;">Contacto</small>
                                                <small>${evaluation.companyInfo?.email || 'No especificado'}</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-12">
                                        <div class="d-flex align-items-center">
                                            <i class="bi bi-diagram-3 text-muted me-2"></i>
                                            <div>
                                                <small class="text-muted d-block" style="font-size: 0.75rem;">Tamaño</small>
                                                <small>${evaluation.companyInfo?.size || 'PYME'}</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Estadísticas de Evaluación -->
                    <div class="col-md-4">
                        <div class="card border-0 shadow-sm h-100">
                            <div class="card-body">
                                <h6 class="text-primary mb-3">
                                    <i class="bi bi-graph-up me-2"></i>
                                    Estadísticas de Evaluación
                                </h6>
                                <div class="row g-2">
                                    <div class="col-6">
                                        <div class="text-center p-2 bg-light rounded">
                                            <h5 class="mb-0 text-primary">${evaluation.questionsAnalyzed}</h5>
                                            <small class="text-muted">Preguntas</small>
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <div class="text-center p-2 bg-light rounded">
                                            <h5 class="mb-0 text-success">7</h5>
                                            <small class="text-muted">Dimensiones</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Contenido Principal: Dimensiones -->
            <div class="px-4 pb-4 pt-3 border-top">
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <h5 class="mb-0">
                        <i class="bi bi-bar-chart-fill text-primary me-2"></i>
                        Análisis por Dimensiones NIST CSF 2.0
                    </h5>
                    <span class="badge bg-light text-dark px-3 py-2">
                        ${evaluation.maturityName}
                    </span>
                </div>
                
                <div class="row g-3">
                    ${Object.entries(evaluation.scores).map(([key, dimension], index) => {
                        const fullRecommendation = this.getDimensionRecommendationText(evaluation, key, index);
                        const recommendationPreview = this.getRecommendationPreview(fullRecommendation, 110);

                        return `
                        <div class="col-lg-6">
                            <div class="card border-0 shadow-sm h-100 hover-lift" style="transition: transform 0.2s;">
                                <div class="card-body p-4">
                                    <div class="d-flex justify-content-between align-items-center gap-3 mb-2">
                                        <h6 class="mb-0 fw-bold dimension-single-line">${dimension.name} · ${dimension.questions} preguntas</h6>
                                        <div class="text-end flex-shrink-0">
                                            <strong style="color: ${this.getScoreColor(dimension.score)};">${dimension.score}%</strong>
                                            <small class="text-muted ms-1">(${dimension.obtained}/${dimension.maximum} pts)</small>
                                        </div>
                                    </div>
                                    
                                    <!-- Barra de Progreso Mejorada -->
                                    <div class="position-relative mb-2">
                                        <div class="progress" style="height: 12px; border-radius: 10px; background-color: #f0f0f0;">
                                            <div class="progress-bar" role="progressbar" 
                                                 style="width: ${dimension.score}%; background: linear-gradient(90deg, ${this.getScoreColor(dimension.score)} 0%, ${this.getScoreColor(dimension.score)}dd 100%); border-radius: 10px;"
                                                 aria-valuenow="${dimension.score}" aria-valuemin="0" aria-valuemax="100">
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Métricas Detalladas -->
                                    <div class="d-flex align-items-center justify-content-between bg-light rounded p-2 mb-2 gap-2">
                                        <small class="text-muted dimension-single-line">
                                            <i class="bi bi-star-fill text-warning me-1" style="font-size: 0.75rem;"></i>
                                            Rating: <strong>${dimension.rating.toFixed(1)}</strong>
                                        </small>
                                        <small class="text-muted flex-shrink-0">
                                            Estado: <strong>${this.getMaturityStatus(dimension.score)}</strong>
                                        </small>
                                    </div>

                                    ${recommendationPreview ? `
                                        <div class="d-flex align-items-center gap-2 dimension-recommendation-line">
                                            <small class="text-muted recommendation-preview-line" title="${this.escapeHtml(fullRecommendation)}">${this.escapeHtml(recommendationPreview)}</small>
                                            <button type="button" class="btn btn-link btn-sm p-0 flex-shrink-0 recommendation-more-link" onclick="app.showRecommendationModal('${key}')">Ver Más</button>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Obtener estado de madurez según puntuación
     */
    getMaturityStatus(score) {
        if (score >= 90) return 'Óptimo';
        if (score >= 75) return 'Avanzado';
        if (score >= 50) return 'Definido';
        if (score >= 25) return 'Básico';
        return 'Inicial';
    }

    /**
     * Obtener color según puntuación
     */
    getScoreColor(score) {
        if (score >= 80) return '#28a745';
        if (score >= 65) return '#20c997';
        if (score >= 50) return '#ffc107';
        if (score >= 35) return '#fd7e14';
        return '#dc3545';
    }

    /**
     * Descargar informe PDF de evaluación
     */
    async downloadReport(fileId) {
        try {
            // 🔐 Usar AuthManager para request autenticado
            const response = await AuthManager.authenticatedFetch(`${this.apiBaseUrl}/${fileId}/report/download`);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al descargar el informe');
            }

            // Crear blob y descargar
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Informe_Ciberseguridad_${fileId.slice(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error downloading report:', error);
            Toast.error('Error al descargar el informe: ' + error.message);
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new FileManagementApp();
});