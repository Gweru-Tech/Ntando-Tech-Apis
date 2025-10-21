const QRCode = require('qrcode');

async function generateQR(text, options = {}) {
  try {
    const qrOptions = {
      errorCorrectionLevel: options.errorLevel || 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: options.dark || '#000000',
        light: options.light || '#FFFFFF'
      },
      width: options.size || 300
    };

    const qrDataURL = await QRCode.toDataURL(text, qrOptions);

    return {
      success: true,
      data: {
        qrCode: qrDataURL,
        text: text,
        format: 'base64'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = async (req, res) => {
  const { text, size, dark, light } = req.query;

  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text parameter is required',
      example: '/tools/qrcode?text=Hello World&size=500'
    });
  }

  const result = await generateQR(text, {
    size: parseInt(size) || 300,
    dark: dark,
    light: light
  });

  res.json(result);
};
