export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;

        const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.NIM_API_KEY}`
            },
            body: JSON.stringify({
                model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
                messages,
                max_tokens: 300,
                temperature: 0.6,
                stream: false
            })
        });

        const rawText = await response.text();
        console.log('NIM raw response:', rawText);

        let data;
        try {
            data = JSON.parse(rawText);
        } catch (e) {
            return res.status(500).json({ error: 'Invalid JSON from NIM', raw: rawText });
        }

        // Return full data so frontend can inspect
        return res.status(200).json(data);

    } catch (err) {
        console.error('Proxy error:', err);
        return res.status(500).json({ error: err.message });
    }
}