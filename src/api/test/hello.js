module.exports = async (req, res) => {
    try {
        const { name } = req.query;
        
        res.json({
            success: true,
            message: `Hello ${name || 'World'}!`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
