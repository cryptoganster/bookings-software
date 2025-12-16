# Instrucciones para Pruebas Manuales de Login

## ✅ Problema Resuelto

**Problema**: Las peticiones OPTIONS (CORS preflight) estaban fallando con 404.

**Solución**: Se agregó configuración de CORS en el backend con `app.enableCors()`.

**Commit**: `feat: enable CORS for frontend communication` (subido a GitHub)

---

## 🧪 Cómo Probar el Login en el Navegador

### Paso 1: Verificar que los servidores están corriendo

Los servidores ya están corriendo:
- **Backend**: `http://localhost:3000` ✅
- **Frontend**: `http://localhost:5173` ✅

### Paso 2: Abrir el Frontend

1. Abre tu navegador (Chrome, Firefox, Safari, etc.)
2. Navega a: `http://localhost:5173`
3. Deberías ver la página de login

### Paso 3: Probar Login Exitoso

**Credenciales de prueba:**
- **Email**: `test@example.com`
- **Password**: `Test123!`

**Pasos:**
1. Ingresa el email: `test@example.com`
2. Ingresa el password: `Test123!` (¡Cuidado con mayúsculas!)
3. Click en el botón "Iniciar Sesión" o "Login"
4. **Resultado esperado**: Deberías ser redirigido al dashboard (`/`)

### Paso 4: Verificar localStorage

1. Abre las DevTools del navegador (F12 o Cmd+Option+I en Mac)
2. Ve a la pestaña "Application" (Chrome) o "Storage" (Firefox)
3. En el panel izquierdo, expande "Local Storage"
4. Click en `http://localhost:5173`
5. **Verifica que existe la key**: `auth-storage`
6. **Verifica que contiene**:
   ```json
   {
     "state": {
       "user": {
         "id": "...",
         "email": "test@example.com",
         "name": "Test Business Owner",
         "businessId": "..."
       },
       "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "isAuthenticated": true
     },
     "version": 0
   }
   ```

### Paso 5: Probar Logout

1. Busca el botón de "Logout" o "Cerrar Sesión" en la interfaz
2. Click en el botón
3. **Resultado esperado**:
   - Deberías ser redirigido a `/login`
   - El `auth-storage` en localStorage debería estar vacío o eliminado
   - Ya no deberías poder acceder a rutas protegidas

### Paso 6: Probar Protección de Rutas

1. Asegúrate de estar deslogueado (sin token en localStorage)
2. Intenta acceder directamente a: `http://localhost:5173/`
3. **Resultado esperado**: Deberías ser redirigido automáticamente a `/login`

### Paso 7: Probar Login con Credenciales Incorrectas

1. En la página de login, ingresa:
   - Email: `test@example.com`
   - Password: `WrongPassword123`
2. Click en "Iniciar Sesión"
3. **Resultado esperado**: 
   - Deberías ver un mensaje de error
   - No deberías ser redirigido
   - No debería guardarse nada en localStorage

---

## 🐛 Troubleshooting

### Si ves errores de CORS en la consola del navegador:

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Verifica que el frontend esté corriendo en `http://localhost:5173`
3. Refresca la página (Cmd+R o Ctrl+R)
4. Si persiste, reinicia ambos servidores:
   ```bash
   # Detener
   Ctrl+C en la terminal donde corre pnpm dev
   
   # Reiniciar
   pnpm dev
   ```

### Si el login no funciona:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Network"
3. Intenta hacer login
4. Busca la petición a `/api/auth/login`
5. Verifica:
   - **Status**: Debería ser 201 (Created) si es exitoso
   - **Response**: Debería contener `user` y `token`
   - Si es 401: Verifica que la contraseña sea exactamente `Test123!`
   - Si es 404: Verifica que el backend esté corriendo

### Si no ves el formulario de login:

1. Verifica que el frontend esté corriendo
2. Abre la consola del navegador y busca errores
3. Verifica que no haya errores de compilación en la terminal

---

## 📝 Notas Importantes

- **La contraseña es case-sensitive**: `Test123!` (con T mayúscula)
- **El email debe ser exacto**: `test@example.com`
- **Los servidores deben estar corriendo**: Verifica en la terminal
- **CORS ya está configurado**: No deberías ver errores de CORS

---

## ✅ Checklist de Pruebas

- [ ] Login exitoso con credenciales correctas
- [ ] Redirección al dashboard después del login
- [ ] Token guardado en localStorage
- [ ] Logout limpia el estado y redirige a login
- [ ] Rutas protegidas redirigen a login si no estás autenticado
- [ ] Login con credenciales incorrectas muestra error

---

## 🎯 Resultado Esperado

Si todas las pruebas pasan, el **Checkpoint 22 está completamente verificado** y puedes proceder al **Task 23: Crear layout principal**.
