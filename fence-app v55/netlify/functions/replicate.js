exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const OPENAI_KEY = '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';

  try {
    const body = JSON.parse(event.body);
    const { imageBase64, prompt } = body;

    // Strip the data URL prefix to get raw base64
    const base64Data = imageBase64.replace(/^data:image\/(jpeg|jpg|png|webp);base64,/, '');

    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Use FormData with gpt-image-1 which supports image input + editing
    const FormData = require('form-data');
    const fd = new FormData();
    fd.append('image', imageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });
    fd.append('prompt', prompt);
    fd.append('model', 'gpt-image-1');
    fd.append('n', '1');
    fd.append('size', '1024x1024');

    const response = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        ...fd.getHeaders()
      },
      body: fd.getBuffer()
    });

    const data = await response.json();

    if (data.error) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error.message })
      };
    }

    // gpt-image-1 returns base64 by default
    const b64 = data.data[0].b64_json;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'data:image/png;base64,' + b64 })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
