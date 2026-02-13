const axios = require("axios");

async function tikApi(url) {
  try {
    const apiURL = `https://rakib-tik-api-production.up.railway.app/api/tiktok?url=${encodeURIComponent(url)}&apikey=rakib69`;

    const response = await axios.get(apiURL);
    const res = response.data;

    if (!res.status || !res.data?.no_watermark) {
      return { error: "Video not found from API" };
    }

    return {
      title: res.data.title,
      author: res.data.author,
      thumbnail: res.data.thumbnail,
      video: res.data.no_watermark,
      music: res.data.music
    };

  } catch (err) {
    console.error(err);
    return { error: "API request failed" };
  }
}

module.exports = tikApi;
