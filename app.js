const YOUTUBE_API_KEY = "";
const YOUTUBE_CHANNEL_ID = "";

const posts = [
  { date: "May 18, 2026", title: "Making room for the next chapter", excerpt: "A few thoughts on changing pace, staying curious and keeping the work personal." },
  { date: "April 04, 2026", title: "The value of being present", excerpt: "Why the small moments behind a shoot often become the ones worth remembering." },
  { date: "March 12, 2026", title: "A creative life, one project at a time", excerpt: "An honest note on consistency, collaboration and building with intention." }
];

function renderPosts() {
  document.querySelector("#post-grid").innerHTML = posts.map(post => `<article class="post"><time>${post.date}</time><h3>${post.title}</h3><p>${post.excerpt}</p><a href="mailto:info@didarahmad.com?subject=${encodeURIComponent(post.title)}">Read more →</a></article>`).join("");
}

async function loadVideos() {
  const grid = document.querySelector("#youtube-grid");
  if (!YOUTUBE_API_KEY || !YOUTUBE_CHANNEL_ID) {
    grid.innerHTML = '<p class="loading">Add your YouTube API key and channel ID in <code>app.js</code> to show the latest videos.</p>';
    return;
  }
  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.search = new URLSearchParams({ key: YOUTUBE_API_KEY, channelId: YOUTUBE_CHANNEL_ID, part: "snippet", order: "date", maxResults: "6", type: "video" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("YouTube request failed");
    const { items } = await response.json();
    grid.innerHTML = items.map(({ id, snippet }) => `<a class="video-card" href="https://www.youtube.com/watch?v=${id.videoId}" target="_blank" rel="noopener"><img src="${snippet.thumbnails.high.url}" alt="${snippet.title}"><div><small>${new Date(snippet.publishedAt).toLocaleDateString()}</small><h3>${snippet.title}</h3></div></a>`).join("");
    document.querySelector("#youtube-channel-link").href = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}`;
  } catch {
    grid.innerHTML = '<p class="loading">Videos are temporarily unavailable. Please visit the YouTube channel directly.</p>';
  }
}

document.querySelector(".menu-button").addEventListener("click", event => {
  const links = document.querySelector(".links");
  links.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(links.classList.contains("open")));
});
document.querySelector("#year").textContent = new Date().getFullYear();
renderPosts();
loadVideos();
