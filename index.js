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
app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/', express.static(path.join(__dirname, 'api-page')));

const settingsPath = path.join(__dirname, './src/settings.json');
let settings;

// Load settings safely
try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (error) {
    console.log(chalk.bgHex('#FF6B6B').hex('#FFF').bold(` ⚠️  Warning: Could not load settings.json - ${error.message} `));
    settings = {
        name: "Ladybug🐞 APIs",
        version: "v1.0.0",
        apiSettings: {
            creator: "Ntando Mods"
        },
        categories: []
    };
}

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
            loadRoutes(itemPath, `$${routePrefix}/$$ {item}`);
        } else if (path.extname(item) === '.js') {
            try {
                const routeName = path.basename(item, '.js');
                const routePath = `$${routePrefix}/$$ {routeName}`;
                
                // Clear require cache to allow hot reloading
                delete require.cache[require.resolve(itemPath)];
                
                // Load the route handler
                const routeHandler = require(itemPath);
                
                // Validate route handler
                if (typeof routeHandler !== 'function') {
                    throw new Error('Route handler must be a function');
                }
                
                // Register the route (both GET and POST)
                app.get(routePath, routeHandler);
                app.post(routePath, routeHandler);
                
                totalRoutes++;
                console.log(chalk.bgHex('#FFFF99').hex('#333').bold(` ✓ Loaded: ${routePath} `));
            } catch (error) {
                console.log(chalk.bgHex('#FF6B6B').hex('#FFF').bold(` ✗ Failed to load: $${item} -$$ {error.message} `));
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
    const indexPath = path.join(__dirname, 'api-page', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ladybug🐞 APIs</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                    }
                    .container {
                        background: white;
                        color: #333;
                        padding: 40px;
                        border-radius: 20px;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    }
                    h1 { color: #667eea; margin-bottom: 20px; }
                    a {
                        display: inline-block;
                        background: #667eea;
                        color: white;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 25px;
                        margin: 10px;
                        transition: transform 0.3s;
                    }
                    a:hover { transform: translateY(-3px); }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🐞 Ladybug APIs</h1>
                    <p>API Server is running!</p>
                    <p>Total Routes: ${totalRoutes}</p>
                    <div>
                        <a href="/api/status">📊 Status</a>
                        <a href="/api/routes">📋 Routes</a>
                        <a href="/api/settings">⚙️ Settings</a>
                    </div>
                </div>
            </body>
            </html>
        `);
    }
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
        version: settings.version || 'v1.0.0',
        name: settings.name || 'Ladybug🐞 APIs',
        timestamp: new Date().toISOString(),
        memory: {
            used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
        },
        platform: process.platform,
        nodeVersion: process.version
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
        routes: routes.sort((a, b) => a.path.localeCompare(b.path))
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
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

// API Info endpoint
app.get('/api/info', (req, res) => {
    res.json({
        success: true,
        name: settings.name || 'Ladybug🐞 APIs',
        version: settings.version || 'v1.0.0',
        description: settings.description || 'API Server',
        creator: settings.apiSettings?.creator || 'Ntando Mods',
        totalRoutes: totalRoutes,
        uptime: process.uptime(),
        endpoints: {
            status: '/api/status',
            routes: '/api/routes',
            settings: '/api/settings',
            health: '/health',
            ping: '/ping'
        }
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
            suggestion: 'Visit / for API documentation or /api/routes to see all available routes'
        });
    }
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(chalk.bgHex('#FF6B6B').hex('#FFF').bold(` ❌ Error: ${err.message} `));
    console.error(err.stack);
    
    const errorPath = path.join(__dirname, 'api-page', '500.html');
    
    if (fs.existsSync(errorPath) && !req.xhr && req.accepts('html')) {
        res.status(500).sendFile(errorPath);
    } else {
        res.status(500).json({
            success: false,
            status: 'error',
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
            timestamp: new Date().toISOString()
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log(chalk.bgHex('#FFB6C1').hex('#333').bold(' 🐞 SIGTERM received, shutting down gracefully... '));
    server.close(() => {
        console.log(chalk.bgHex('#90EE90').hex('#333').bold(' 🐞 Server closed successfully '));
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log(chalk.bgHex('#FFB6C1').hex('#333').bold(' 🐞 SIGINT received, shutting down gracefully... '));
    server.close(() => {
        console.log(chalk.bgHex('#90EE90').hex('#333').bold(' 🐞 Server closed successfully '));
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(chalk.bgHex('#FF6B6B').hex('#FFF').bold(' ❌ Uncaught Exception: '));
    console.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.bgHex('#FF6B6B').hex('#FFF').bold(' ❌ Unhandled Rejection at: '), promise);
    console.error(chalk.bgHex('#FF6B6B').hex('#FFF').bold(' Reason: '), reason);
});

// Start server
const server = app.listen(PORT, () => {
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(' ═══════════════════════════════════════ '));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 🐞 Ladybug API Server Started! `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 🌐 Port: ${PORT} `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 📡 Status: http://localhost:${PORT}/api/status `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 📚 Docs: http://localhost:${PORT}/ `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` 📋 Routes: http://localhost:${PORT}/api/routes `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(` ⚙️  Settings: http://localhost:${PORT}/api/settings `));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(' ═══════════════════════════════════════ '));
});

module.exports = app;
