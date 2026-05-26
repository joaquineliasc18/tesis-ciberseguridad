// ========================================
// AUTH MANAGER - Frontend Authentication
// Gestiona tokens JWT, login, registro, logout
// ========================================

const AuthManager = {
    // Configuración
    API_BASE_URL: '/api',
    TOKEN_KEY: 'accessToken',
    REFRESH_TOKEN_KEY: 'refreshToken',
    USER_KEY: 'currentUser',

    /**
     * Registrar nuevo usuario
     * @param {string} name - Nombre completo
     * @param {string} email - Email
     * @param {string} password - Contraseña
     * @param {string} confirmPassword - Confirmación de contraseña
     * @returns {Promise<Object>} Resultado del registro
     */
    async register(name, email, password, confirmPassword) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    confirmPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('✅ Usuario registrado exitosamente');
                return { success: true, user: data.user };
            } else {
                console.error('❌ Error en registro:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Error de conexión en registro:', error);
            return { success: false, message: 'Error de conexión' };
        }
    },

    /**
     * Iniciar sesión
     * @param {string} email - Email
     * @param {string} password - Contraseña
     * @param {boolean} rememberMe - Recordar sesión
     * @returns {Promise<Object>} Resultado del login
     */
    async login(email, password, rememberMe = false) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Guardar tokens
                this.setToken(data.tokens.accessToken, rememberMe);
                this.setRefreshToken(data.tokens.refreshToken, rememberMe);
                
                // Guardar información del usuario
                this.setUser(data.user, rememberMe);

                console.log(`✅ Login exitoso: ${data.user.email} (${data.user.role})`);
                return { success: true, user: data.user };
            } else {
                console.error('❌ Error en login:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Error de conexión en login:', error);
            return { success: false, message: 'Error de conexión' };
        }
    },

    /**
     * Cerrar sesión
     * @returns {Promise<boolean>} True si exitoso
     */
    async logout() {
        try {
            const refreshToken = this.getRefreshToken();

            if (refreshToken) {
                // Llamar al endpoint de logout para revocar refresh token
                await fetch(`${this.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ refreshToken })
                });
            }

            // Limpiar tokens del almacenamiento
            this.clearAuthData();

            console.log('✅ Logout exitoso');
            return true;
        } catch (error) {
            console.error('❌ Error en logout:', error);
            // Limpiar de todas formas
            this.clearAuthData();
            return false;
        }
    },

    /**
     * Renovar access token usando refresh token
     * @returns {Promise<boolean>} True si exitoso
     */
    async refreshAccessToken() {
        try {
            const refreshToken = this.getRefreshToken();

            if (!refreshToken) {
                console.error('❌ No hay refresh token disponible');
                return false;
            }

            const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Actualizar access token
                const storage = localStorage.getItem(this.TOKEN_KEY) ? localStorage : sessionStorage;
                this.setToken(data.tokens.accessToken, storage === localStorage);

                console.log('✅ Access token renovado');
                return true;
            } else {
                console.error('❌ Error renovando token:', data.message);
                this.clearAuthData();
                return false;
            }
        } catch (error) {
            console.error('❌ Error de conexión renovando token:', error);
            return false;
        }
    },

    /**
     * Obtener información del usuario actual
     * @returns {Promise<Object|null>} Usuario o null
     */
    async getCurrentUser() {
        try {
            const token = this.getToken();

            if (!token) {
                return null;
            }

            const response = await fetch(`${this.API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                // Token expirado, intentar renovar
                const refreshed = await this.refreshAccessToken();
                if (refreshed) {
                    return await this.getCurrentUser(); // Reintentar con nuevo token
                }
                return null;
            }

            const data = await response.json();

            if (response.ok && data.success) {
                // Actualizar usuario en storage
                const storage = localStorage.getItem(this.USER_KEY) ? localStorage : sessionStorage;
                this.setUser(data.user, storage === localStorage);
                return data.user;
            }

            return null;
        } catch (error) {
            console.error('❌ Error obteniendo usuario actual:', error);
            return null;
        }
    },

    /**
     * Verificar si hay una sesión activa
     * @returns {boolean} True si autenticado
     */
    isAuthenticated() {
        const token = this.getToken();
        const user = this.getUser();
        return !!(token && user);
    },

    /**
     * Obtener token de acceso
     * @returns {string|null} Token o null
     */
    getToken() {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
    },

    /**
     * Guardar token de acceso
     * @param {string} token - Token JWT
     * @param {boolean} persistent - Guardar en localStorage (true) o sessionStorage (false)
     */
    setToken(token, persistent = false) {
        const storage = persistent ? localStorage : sessionStorage;
        storage.setItem(this.TOKEN_KEY, token);
    },

    /**
     * Obtener refresh token
     * @returns {string|null} Refresh token o null
     */
    getRefreshToken() {
        return localStorage.getItem(this.REFRESH_TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
    },

    /**
     * Guardar refresh token
     * @param {string} token - Refresh token
     * @param {boolean} persistent - Guardar en localStorage
     */
    setRefreshToken(token, persistent = false) {
        const storage = persistent ? localStorage : sessionStorage;
        storage.setItem(this.REFRESH_TOKEN_KEY, token);
    },

    /**
     * Obtener usuario del almacenamiento
     * @returns {Object|null} Usuario o null
     */
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Guardar usuario en almacenamiento
     * @param {Object} user - Datos del usuario
     * @param {boolean} persistent - Guardar en localStorage
     */
    setUser(user, persistent = false) {
        const storage = persistent ? localStorage : sessionStorage;
        storage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    /**
     * Limpiar todos los datos de autenticación
     */
    clearAuthData() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(this.USER_KEY);
    },

    /**
     * Hacer request autenticado con manejo de errores
     * @param {string} url - URL del endpoint
     * @param {Object} options - Opciones de fetch
     * @returns {Promise<Response>} Response
     */
    async authenticatedFetch(url, options = {}) {
        const token = this.getToken();

        if (!token) {
            throw new Error('No autenticado');
        }

        // Agregar token a headers
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(url, { ...options, headers });

        // Si 401, intentar renovar token
        if (response.status === 401) {
            const refreshed = await this.refreshAccessToken();
            
            if (refreshed) {
                // Reintentar con nuevo token
                const newToken = this.getToken();
                const newHeaders = {
                    ...options.headers,
                    'Authorization': `Bearer ${newToken}`
                };
                return await fetch(url, { ...options, headers: newHeaders });
            } else {
                // Redirigir al login
                window.location.href = '/login.html';
                throw new Error('Sesión expirada');
            }
        }

        return response;
    },

    /**
     * Verificar si usuario es administrador
     * @returns {boolean} True si es admin
     */
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'ADMIN';
    },

    /**
     * Proteger página (redirigir a login si no autenticado)
     * @param {string} requiredRole - Rol requerido ('ADMIN' o 'USER')
     */
    requireAuth(requiredRole = null) {
        if (!this.isAuthenticated()) {
            console.log('⚠️ No autenticado, redirigiendo a login...');
            window.location.href = '/login.html';
            return false;
        }

        if (requiredRole) {
            const user = this.getUser();
            if (user.role !== requiredRole) {
                console.log(`⚠️ Rol requerido: ${requiredRole}, usuario tiene: ${user.role}`);
                Toast.error('No tienes permiso para acceder a esta página');
                window.location.href = '/';
                return false;
            }
        }

        return true;
    }
};

// Export para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
