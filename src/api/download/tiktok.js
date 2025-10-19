const axios = require('axios');
const https = require('https');

const agent = new https.Agent({
	rejectUnauthorized: true,
	maxVersion: 'TLSv1.3',
	minVersion: 'TLSv1.2'
});

module.exports = (app) => {
	/**
	 * GET /download/tiktok?url=<tiktok_url>
	 * Returns normalized JSON with video/image URLs and metadata.
	 */
	app.get('/download/tiktok', async (req, res) => {
		const url = (req.query.url || '').trim();
		if (!url) {
			return res.status(400).json({ status: false, message: 'Missing required query parameter: url' });
		}

		try {
			function formatNumber(integer) {
				let numb = parseInt(integer) || 0;
				return Number(numb).toLocaleString().replace(/,/g, '.');
			}

			function formatDate(n, locale = 'en') {
				// tikwm create_time can be unix seconds or iso — try both
				let d = new Date(n);
				if (!isNaN(n) && String(n).length === 10) d = new Date(Number(n) * 1000);
				if (isNaN(d)) d = new Date();
				return d.toLocaleDateString(locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				});
			}

			const domain = 'https://www.tikwm.com/api/';
			const response = await axios.post(domain, {}, {
				httpsAgent: agent,
				headers: {
					'Accept': 'application/json, text/javascript, */*; q=0.01',
					'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Origin': 'https://www.tikwm.com',
					'Referer': 'https://www.tikwm.com/',
					'Sec-Ch-Ua': '"Not)A;Brand" ;v="24" , "Chromium" ;v="116"',
					'Sec-Ch-Ua-Mobile': '?1',
					'Sec-Ch-Ua-Platform': 'Android',
					'Sec-Fetch-Dest': 'empty',
					'Sec-Fetch-Mode': 'cors',
					'Sec-Fetch-Site': 'same-origin',
					'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
					'X-Requested-With': 'XMLHttpRequest'
				},
				params: {
					url,
					hd: 1
				},
				timeout: 15000
			});

			const dataRaw = response.data && response.data.data ? response.data.data : null;
			if (!dataRaw) {
				return res.status(500).json({ status: false, message: 'Unexpected response from tikwm' });
			}

			let media = [];
			// If response contains images (e.g., multiple photos)
			if (dataRaw.images && (!dataRaw.size && !dataRaw.wm_size && !dataRaw.hd_size)) {
				(dataRaw.images || []).forEach(v => media.push({ type: 'photo', url: v }));
			} else {
				if (dataRaw.wmplay) media.push({ type: 'watermark', url: dataRaw.wmplay });
				if (dataRaw.play) media.push({ type: 'nowatermark', url: dataRaw.play });
				if (dataRaw.hdplay) media.push({ type: 'nowatermark_hd', url: dataRaw.hdplay });
			}

			const json = {
				status: true,
				title: dataRaw.title || null,
				taken_at: dataRaw.create_time ? formatDate(dataRaw.create_time).replace('1970', '') : null,
				region: dataRaw.region || null,
				id: dataRaw.id || null,
				durations: dataRaw.duration || null,
				duration: dataRaw.duration ? `${dataRaw.duration} Seconds` : null,
				cover: dataRaw.cover || null,
				size_wm: dataRaw.wm_size || null,
				size_nowm: dataRaw.size || null,
				size_nowm_hd: dataRaw.hd_size || null,
				data: media,
				music_info: dataRaw.music_info ? {
					id: dataRaw.music_info.id || null,
					title: dataRaw.music_info.title || null,
					author: dataRaw.music_info.author || null,
					album: dataRaw.music_info.album || null,
					url: dataRaw.music || (dataRaw.music_info && dataRaw.music_info.play) || null
				} : null,
				stats: {
					views: formatNumber(dataRaw.play_count),
					likes: formatNumber(dataRaw.digg_count),
					comment: formatNumber(dataRaw.comment_count),
					share: formatNumber(dataRaw.share_count),
					download: formatNumber(dataRaw.download_count)
				},
				author: dataRaw.author ? {
					id: dataRaw.author.id || null,
					fullname: dataRaw.author.unique_id || null,
					nickname: dataRaw.author.nickname || null,
					avatar: dataRaw.author.avatar || null
				} : null
			};

			return res.json(json);
		} catch (err) {
			console.error('[TIKTOK DL ERROR]', err?.message || err);
			const message = err?.response?.data || err?.message || 'Internal error';
			return res.status(500).json({ status: false, message });
		}
	});
};
