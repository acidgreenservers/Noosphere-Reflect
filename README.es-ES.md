

# Noosphere Reflect 📘 - Sistema de Archivado y Preservación de Chat con IA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.8.8-green.svg)](CHANGELOG.md)
[![Build Status](https://github.com/acidgreenservers/Noosphere-Reflect/actions/workflows/deploy.yml/badge.svg)](https://github.com/acidgreenservers/Noosphere-Reflect/actions)
[![Node](https://img.shields.io/badge/node-%3E%3D20.x-brightgreen.svg)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](tsconfig.json)

**Preserva el Significado a Través de la Memoria** — Un sistema de archivado de chat con IA de alta fidelidad con una extensión de Chrome para capturar con un solo clic desde Claude, ChatGPT, Gemini, LeChat, Grok, Llamacoder y Kimi.

---

## 🚀 Primeros Pasos

> Los comandos a continuación están verificados para este repositorio. Si tu plataforma es diferente, consulta [Solución de Problemas](#-troubleshooting) más abajo.

### Requisitos Previos

- **Node.js:** 20.x o superior
- **npm:** 10.x o superior
- **Navegador:** Chrome/Edge (para compatibilidad con la Extensión)

### 1) Clonar e Instalar

```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect
npm install
```

### 2) Configuración del Entorno (Opcional)

Si planeas usar el modo **AI Studio** para analizar registros no estructurados o exportaciones a **Google Drive**:

```bash
cp .env.example .env
# Edita .env y agrega tu GEMINI_API_KEY y credenciales de Google OAuth
```

### 3) Ejecutar Localmente

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000/Noosphere-Reflect/`

### 4) Compilar y Probar

```bash
npm run build   # Compilar para producción (salida en dist/)
npm test        # Ejecutar el conjunto de pruebas de Vitest
npm run lint    # Ejecutar verificaciones de ESLint
```

---

## ⚡ Inicio Rápido

La ruta más rápida desde **clonar → aplicación en ejecución**:

```bash
git clone https://github.com/acidgreenservers/Noosphere-Reflect.git
cd Noosphere-Reflect && npm install && npm run dev
```

Luego abre `http://localhost:3000/Noosphere-Reflect/`. Para una guía detallada de 90 segundos, consulta **[QUICKSTART.md](QUICKSTART.md)**.

---

## 🏗️ Arquitectura

Noosphere Reflect utiliza un **Patrón de Puente** para capturar y preservar conversaciones de IA:

```text
  [ AI Platforms ] --(Ext)--> [ Web App ] --(IndexedDB)--> [ Local Archive ]
        |                         ^                             |
        +----(MD/JSON Export)-----+----(Manual Import)---------+
```

Consulta **[ARCHITECTURE.md](ARCHITECTURE.md)** para el diagrama ASCII completo y un análisis profundo de los componentes.

---

## 🔒 Seguridad

La seguridad está integrada en el diseño, no agregada como una reflexión tardía:

- **Soberanía de Datos**: 100 % almacenamiento local (IndexedDB); ningún dato sale de tu máquina a menos que lo exportes explícitamente.
- **Protección XSS**: Sanitización completa mediante `DOMPurify`.
- **Validación de Protocolos**: Bloqueo de esquemas de URL peligrosos en markdown.

Consulta **[SECURITY.md](SECURITY.md)** para nuestra postura completa y directrices de reporte.

---

## 🛠️ Stack Tecnológico

- **Núcleo**: React 19, TypeScript 5.8, Vite 6.2
- **Persistencia**: IndexedDB (vía la biblioteca `idb`)
- **Estilos**: Tailwind CSS v4
- **Búsqueda**: MiniSearch (indexación basada en Workers)
- **IA**: Google Gemini 2.0 Flash (para análisis inteligente)

---

## 🧩 Características

- **Captura Multiplataforma**: Soporte nativo para Claude, ChatGPT, Gemini y más.
- **Gestión de Artefactos**: Adjuntar y vincular archivos a sesiones o mensajes específicos.
- **Búsqueda Avanzada**: Búsqueda instantánea y polimórfica en Chats, Memorias y Prompts.
- **Organización de Carpetas**: Gestión jerárquica para tu archivo en crecimiento.
- **Múltiples Exportaciones**: Formatos HTML, Markdown y JSON con tematización fiel a la marca.

---

## 🆕 Novedades

### v0.5.8.8 - Proyecto Phoenix y Analizadores Nativos

- **UI Estandarizada**: Experiencia unificada de "Consola Neural" para los extracores de Claude y LeChat.
- **Analizador Nativo de Reflect**: Reimportación con 100 % de fidelidad para exportaciones de Noosphere Reflect.
- **Arquitectura de Analizador Modular**: Estructura primero por formato (html/json/markdown).
- **Optimización de Búsqueda**: Indexación por lotes con reducción del 96 % en la duración.

### v0.5.8.5 - Vinculación de Artefactos y Pulido

- **Detección de Búsqueda Directa**: Coincidencia inteligente de nombres de archivo en el texto del chat.
- **Estética de Píldora**: UI mejorada con estilos `rounded-full` y retroalimentación "Escala y Resplandor".

---

## 🆘 Solución de Problemas

### La aplicación no se carga

- Asegúrate de usar la versión correcta de Node.js (`node -v`).
- Intenta eliminar `node_modules` y ejecutar `npm install` nuevamente.
- Verifica la ruta base: `http://localhost:3000/Noosphere-Reflect/`.

---

## 🤝 Contribuir

¡Bienvenidas las contribuciones! Consulta **[CONTRIBUTING.md](CONTRIBUTING.md)** para nuestro flujo de trabajo y estándares de código.

---

## 📄 Licencia

Este proyecto está licenciado bajo la **Licencia MIT**. Consulta [LICENSE](LICENSE) para más detalles.

---

**Última Actualización**: 1 de julio de 2026
**Estado**: Versión Estable ✅
