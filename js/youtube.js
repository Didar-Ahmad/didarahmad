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
      if(data.error){
        console.warn('YouTube API search error for',handle,data.error);
        return null;
      }
      return data.items?.[0]?.snippet?.channelId || data.items?.[0]?.id?.channelId || null;
    }catch(e){console.warn('YouTube search failed for',handle,e);return null}
  }

  async function fetchChannelThumbnail(channelId){
    const apiKey = cfg.apiKey;
    if(!apiKey) return null;
    try{
      const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${channelId}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if(data.error){
        console.warn('YouTube channels API error for',channelId,data.error);
        return null;
      }
      const thumb = data.items?.[0]?.snippet?.thumbnails;
      return thumb?.medium?.url || thumb?.default?.url || thumb?.high?.url || null;
    }catch(e){console.warn('Fetching channel thumbnail failed',e);return null}
  }

  function makeInitialsPlaceholder(handle,size=48){
    const initial = (handle||'?').charAt(0).toUpperCase();
    const bg = '#e6e6e6';
    const fg = '#333';
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'><rect width='100%' height='100%' fill='${bg}' rx='${size/2}' ry='${size/2}'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-size='${Math.round(size*0.5)}' fill='${fg}'>${initial}</text></svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }

  async function addChannelAvatars(){
    const apiKey = cfg.apiKey;
    // Only target the small channel links in the profile area (avoid cards)
    const anchors = Array.from(document.querySelectorAll('.channel-profile a[href*="youtube.com/@"]'));
    await Promise.all(anchors.map(async a=>{
      try{
        // don't add if an avatar already exists in the link
        if(a.querySelector('.yt-avatar') || a.querySelector('.yt-avatar-fallback')) return;
        const m = a.href.match(/@([^/?#]+)/);
        if(!m) return;
        const handle = m[1];

        let imgSrc = null;
        if(apiKey){
          const channelId = await fetchChannelIdForHandle(handle);
          if(channelId){
            const thumb = await fetchChannelThumbnail(channelId);
            if(thumb) imgSrc = thumb;
            else console.warn('No thumbnail found for channel',channelId,handle);
          }else{
            console.warn('Channel ID not found for handle',handle);
          }
        } else {
          console.warn('No YouTube API key configured; using placeholder for',handle);
        }

        if(imgSrc){
          const img = document.createElement('img');
          img.src = imgSrc;
          img.alt = `${handle} avatar`;
          img.className = 'yt-avatar';
          img.width = 48; img.height = 48;
          a.prepend(img);
        } else {
          // fallback: initials SVG
          const span = document.createElement('span');
          span.className = 'yt-avatar-fallback';
          span.style.display = 'inline-block';
          span.style.width = '48px';
          span.style.height = '48px';
          span.style.borderRadius = '50%';
          span.style.overflow = 'hidden';
          span.style.marginRight = '12px';
          const img = document.createElement('img');
          img.src = makeInitialsPlaceholder(handle,48);
          img.alt = `${handle} avatar`;
          img.style.width = '48px'; img.style.height = '48px'; img.style.display='block';
          img.style.borderRadius='50%';
          span.appendChild(img);
          a.prepend(span);
        }
      }catch(e){console.warn('addChannelAvatars error',e)}
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
        if(data.error){console.warn('YouTube search list error',data.error); return []}
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