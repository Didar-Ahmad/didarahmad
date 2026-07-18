// youtube.js
// Loads channel avatars and latest videos using the YouTube Data API.
// Create a local file js/youtube-config.js with:
// window.YOUTUBE_CONFIG = { apiKey: 'YOUR_KEY', handles: ['letsfindways','DidarAhmadofficial','DidarAhmad_vlogs'] };

(function(){
  const defaultHandles=['letsfindways','DidarAhmadofficial','DidarAhmad_vlogs'];
  const cfg = window.YOUTUBE_CONFIG || { apiKey: null, handles: defaultHandles };

  async function fetchChannelIdForHandle(handle){
    const apiKey = cfg.apiKey;
    if(!apiKey) return null;
    try{
      const q = encodeURIComponent('@'+handle);
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${q}&key=${apiKey}&maxResults=1`;
      const res = await fetch(searchUrl);
      const data = await res.json();
      return data.items?.[0]?.snippet?.channelId || data.items?.[0]?.id?.channelId || null;
    }catch(e){return null}
  }

  async function fetchChannelThumbnail(channelId){
    const apiKey = cfg.apiKey;
    if(!apiKey) return null;
    try{
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      const thumb = data.items?.[0]?.snippet?.thumbnails;
      return thumb?.medium?.url || thumb?.default?.url || thumb?.high?.url || null;
    }catch(e){return null}
  }

  async function addChannelAvatars(){
    const apiKey = cfg.apiKey;
    if(!apiKey) return;
    const anchors = Array.from(document.querySelectorAll('a[href*="youtube.com/@"]'));
    await Promise.all(anchors.map(async a=>{
      try{
        const m = a.href.match(/@([^/?#]+)/);
        if(!m) return;
        const handle = m[1];
        const channelId = await fetchChannelIdForHandle(handle);
        if(!channelId) return;
        const thumb = await fetchChannelThumbnail(channelId);
        if(!thumb) return;
        if(a.querySelector('.yt-avatar')) return;
        const img = document.createElement('img');
        img.src = thumb;
        img.alt = `${handle} avatar`;
        img.className = 'yt-avatar';
        img.width = 48;
        img.height = 48;
        a.prepend(img);
      }catch(e){/* ignore */}
    }));
  }

  async function loadLatestVideos(){
    const target=document.querySelector('[data-youtube-feed]');
    if(!target || !cfg.apiKey) return;
    try{
      const channels = await Promise.all(cfg.handles.map(async handle=>await fetchChannelIdForHandle(handle)));
      const validChannels = channels.filter(Boolean);
      const results = await Promise.all(validChannels.map(async channelId=>{
        const url = `https://www.googleapis.com/youtube/v3/search?key=${cfg.apiKey}&channelId=${channelId}&part=snippet,id&order=date&type=video&maxResults=3`;
        const res = await fetch(url);
        const data = await res.json();
        return data.items || [];
      }));
      const videos = results.flat().sort((a,b)=>new Date(b.snippet.publishedAt)-new Date(a.snippet.publishedAt)).slice(0,6);
      target.innerHTML = videos.map(video=>`<article class="video-card"><a href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" rel="noopener"><img class="video-thumb" src="${video.snippet.thumbnails.medium.url}" alt="${escapeHtml(video.snippet.title)}"></a><div><p>${new Date(video.snippet.publishedAt).toLocaleDateString()}</p><h3>${escapeHtml(video.snippet.title)}</h3><a class="text-link" href="https://www.youtube.com/watch?v=${video.id.videoId}" target="_blank" rel="noopener">Watch video ↗</a></div></article>`).join('');
    }catch(error){console.warn('Unable to load YouTube videos.',error)}
  }

  function escapeHtml(s){return String(s).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":"&#39;"})[c])}

  // Kick off
  document.addEventListener('DOMContentLoaded',()=>{
    addChannelAvatars();
    loadLatestVideos();
  });
})();