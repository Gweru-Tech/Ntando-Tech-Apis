const express = require('express');
const chalk = require('chalk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/', express.static(path.join(__dirname, 'api-page')));
app.use('/src', express.static(path.join(__dirname, 'src')));

const settingsPath = path.join(__dirname, './src/settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

// Custom JSON response middleware
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function (data) {
        if (data && typeof data === 'object') {
            const responseData = {
                status: data.status || (data.success ? 'success' : 'error'),
                creator: settings.apiSettings.creator || "Ntando Mods",
                ...data
            };
            return originalJson.call(this, responseData);
        }
        return originalJson.call(this, data);
    };
    next();
});

// API Routes Auto-loader
let totalRoutes = 0;
const apiFolder = path.join(__dirname, './src/api');

console.log(chalk.bgHex('#87CEEB').hex('#333').bold(' 🐞 Loading Ladybug API Routes... '));

function loadRoutes(folderPath, routePrefix = '') {
    if (!fs.existsSync(folderPath)) {
        console.log(chalk.bgHex('#FFB6C1').hex('#333').bold(` Creating API folder: ${folderPath} `));
        fs.mkdirSync(folderPath, { recursive: true });
        return;
    }

    fs.readdirSync(folderPath).forEach((item) => {
        const itemPath = path.join(folderPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            // Recursively load routes from subdirectories
            loadRoutes(itemPath, `${routePrefix}/${item}`);
        } else if (path.extname(item) === '.js') {
            try {
                const routeName = path.basename(item, '.js');
                const routePath = `${routePrefix}/${routeName}`;
                
                // Load the route handler
                const routeHandler = require(itemPath);
                
                // Register the route
                app.get(routePath, routeHandler);
                app.post(routePath, routeHandler);
                
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` ✓ Loaded: ${routePath} `));
            } catch (error) {
                console.log(chalk.bgHex('#FF6B6B').hex('#FFF').bold(` ✗ Failed to load: ${item} - ${error.message} `));
            }
        }
    });
}

// Load all API routes
loadRoutes(apiFolder);

console.log(chalk.bgHex('#90EE90').hex('#333').bold(' ═══════════════════════════════════════ '));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(` 🐞 Load Complete! Total Routes: ${totalRoutes} `));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(' ═══════════════════════════════════════ '));

// Home route - API Documentation
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-page', 'index.html'));
});

// Settings/Config endpoint
app.get('/api/settings', (req, res) => {
    res.json({
        success: true,
        data: settings
    });
});

// API Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        status: 'online',
        uptime: process.uptime(),
        totalRoutes: totalRoutes,
        version: settings.version,
        name: settings.name,
        timestamp: new Date().toISOString()
    });
});

// List all available routes
app.get('/api/routes', (req, res) => {
    const routes = [];
    
    app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
            routes.push({
                path: middleware.route.path,
                methods: methods
            });
        }
    });

    res.json({
        success: true,
        totalRoutes: routes.length,
        routes: routes
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Ping endpoint
app.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'pong',
        timestamp: Date.now()
    });
});

// 404 Handler
app.use((req, res, next) => {
    const notFoundPath = path.join(__dirname, 'api-page', '404.html');
    
    if (fs.existsSync(notFoundPath)) {
        res.status(404).sendFile(notFoundPath);
    } else {
        res.status(404).json({
            success: false,
            status: 'error',
            message: 'Route not found',
            path: req.path,
            suggestion: 'Visit / for API documentation'
        });
    }
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(chalk.bgHex('#FF6B6B').hex('#FFF').bold(` Error: ${err.message} `));
    console.error(err.stack);
    
    const errorPath = path.join(__dirname, 'api-page', '500.html');
    
    if (fs.existsSync(errorPath)) {
        res.status(500).sendFile(errorPath);
    } else {
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log(chalk.bgHex('#FFB6C1').hex('#333').bold(' 🐞 SIGTERM received, shutting down gracefully... '));
    server.close(() => {
        console.log(chalk.bgHex('#90EE90').hex('#333').bold(' 🐞 Server closed '));
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(' ═══════════════════════════════════════ '));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 🐞 Ladybug API Server Started! `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 🌐 Port: ${PORT} `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 📡 Status: http://localhost:${PORT}/api/status `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 📚 Docs: http://localhost:${PORT}/ `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(' ═══════════════════════════════════════ '));
});

module.exports = app;
