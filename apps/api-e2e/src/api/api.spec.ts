import axios from 'axios';

describe('GET /', () => {
  it('should return a message', async () => {
    const res = await axios.get(`/`);

    expect(res.status).toBe(200);
    expect(res.data).toHaveProperty('name', 'Kanora Media Server API');
    expect(res.data).toHaveProperty('version');
    expect(res.data).toHaveProperty('timestamp');
  });
});
