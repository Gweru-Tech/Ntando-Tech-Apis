import { Supadata } from '@supadata/js';

const supadata = new Supadata({
  apiKey: 'sd_3bba8e23f2744eeb531e01df42f0799f',
});
const video = await supadata.youtube.video({
  id: 'https://youtu.be/dQw4w9WgXcQ', // can be id or url
});
console.log(video.title);
