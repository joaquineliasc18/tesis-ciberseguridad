/**
 * Sistema de Notificaciones Toast Profesional
 * Reemplaza los alert() nativos con toasts modernos
 */

class ToastNotification {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Crear contenedor de toasts si no existe
        if (!document.getElementById('toast-container')) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 400px;
            `;
            document.body.appendChild(this.container);
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    show(message, type = 'info', duration = 4000) {
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        const icons = {
            success: '<i class="bi bi-check-circle-fill"></i>',
            error: '<i class="bi bi-x-circle-fill"></i>',
            warning: '<i class="bi bi-exclamation-triangle-fill"></i>',
            info: '<i class="bi bi-info-circle-fill"></i>'
        };

        const colors = {
            success: { bg: '#d1fae5', border: '#10b981', icon: '#065f46' },
            error: { bg: '#fee2e2', border: '#ef4444', icon: '#991b1b' },
            warning: { bg: '#fef3c7', border: '#f59e0b', icon: '#92400e' },
            info: { bg: '#dbeafe', border: '#3b82f6', icon: '#1e40af' }
        };

        const color = colors[type] || colors.info;

        toast.style.cssText = `
            background: ${color.bg};
            border-left: 4px solid ${color.border};
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideInRight 0.3s ease-out;
            min-width: 320px;
            max-width: 400px;
            position: relative;
            backdrop-filter: blur(10px);
        `;

        toast.innerHTML = `
            <div style="color: ${color.icon}; font-size: 1.5rem; line-height: 1;">
                ${icons[type]}
            </div>
            <div style="flex: 1; color: ${color.icon}; font-weight: 500; font-size: 0.95rem; line-height: 1.4;">
                ${message}
            </div>
            <button class="toast-close" style="
                background: none;
                border: none;
                color: ${color.icon};
                opacity: 0.6;
                cursor: pointer;
                font-size: 1.25rem;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: opacity 0.2s;
                line-height: 1;
            " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                <i class="bi bi-x"></i>
            </button>
        `;

        // Agregar estilos de animación si no existen
        if (!document.getElementById('toast-animations')) {
            const style = document.createElement('style');
            style.id = 'toast-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Botón cerrar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.remove(toast);
        });

        // Agregar toast al contenedor
        this.container.appendChild(toast);

        // Auto-cerrar después del duration
        if (duration > 0) {
            setTimeout(() => {
                this.remove(toast);
            }, duration);
        }

        return toast;
    }

    remove(toast) {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, 300);
    }

    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Modal de confirmación moderno (reemplaza confirm() nativo)
     * @param {string} message - Mensaje de confirmación
     * @param {string} title - Título del modal (opcional)
     * @returns {Promise<boolean>} - true si confirma, false si cancela
     */
    confirm(message, title = '¿Estás seguro?') {
        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.2s ease-out;
            `;

            // Crear modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: white;
                border-radius: 16px;
                padding: 0;
                max-width: 440px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                overflow: hidden;
            `;

            modal.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                    padding: 24px;
                    color: white;
                ">
                    <h5 style="margin: 0; font-size: 1.25rem; font-weight: 600;">
                        <i class="bi bi-question-circle-fill me-2"></i>${title}
                    </h5>
                </div>
                <div style="padding: 24px;">
                    <p style="margin: 0; color: #4b5563; font-size: 1rem; line-height: 1.6;">
                        ${message}
                    </p>
                </div>
                <div style="
                    padding: 16px 24px;
                    background: #f9fafb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button class="btn-cancel" style="
                        padding: 10px 24px;
                        border: 2px solid #d1d5db;
                        background: white;
                        color: #6b7280;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.95rem;
                    ">
                        Cancelar
                    </button>
                    <button class="btn-confirm" style="
                        padding: 10px 24px;
                        border: none;
                        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                        color: white;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                        font-size: 0.95rem;
                        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                    ">
                        Confirmar
                    </button>
                </div>
            `;

            // Agregar estilos de animación modal
            if (!document.getElementById('modal-animations')) {
                const style = document.createElement('style');
                style.id = 'modal-animations';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes scaleIn {
                        from {
                            transform: scale(0.7);
                            opacity: 0;
                        }
                        to {
                            transform: scale(1);
                            opacity: 1;
                        }
                    }
                    @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            // Event handlers
            const btnCancel = modal.querySelector('.btn-cancel');
            const btnConfirm = modal.querySelector('.btn-confirm');

            // Hover effects
            btnCancel.addEventListener('mouseenter', () => {
                btnCancel.style.background = '#f3f4f6';
                btnCancel.style.borderColor = '#9ca3af';
            });
            btnCancel.addEventListener('mouseleave', () => {
                btnCancel.style.background = 'white';
                btnCancel.style.borderColor = '#d1d5db';
            });

            btnConfirm.addEventListener('mouseenter', () => {
                btnConfirm.style.transform = 'translateY(-2px)';
                btnConfirm.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
            });
            btnConfirm.addEventListener('mouseleave', () => {
                btnConfirm.style.transform = 'translateY(0)';
                btnConfirm.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
            });

            const closeModal = (result) => {
                overlay.style.animation = 'fadeOut 0.2s ease-out';
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(result);
                }, 200);
            };

            btnCancel.addEventListener('click', () => closeModal(false));
            btnConfirm.addEventListener('click', () => closeModal(true));
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(false);
            });

            // Cerrar con ESC
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    closeModal(false);
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Focus en botón confirmar
            setTimeout(() => btnConfirm.focus(), 100);
        });
    }
}

// Instancia global
const Toast = new ToastNotification();

// También exponer como window.Toast para acceso global
window.Toast = Toast;
