import { NextApiRequest, NextApiResponse } from 'next';

const AddTranslation = (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dir = path.resolve('./src', 'translations', 'extracted', 'missing.en.json');

    const data = fs.readFileSync(dir);
    const existing = JSON.parse(data);
    const body = req.body;
    const combined = { ...existing, ...body };

    fs.writeFileSync(dir, JSON.stringify(combined, null, 2));
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Error adding missing translations', e);
    res.status(500).json({ error: true });
  }
};

export default AddTranslation;
