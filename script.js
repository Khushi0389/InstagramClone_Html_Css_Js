let postsData = JSON.parse(localStorage.getItem("postsData")) || [];
let currentPostIndex = null;
let cropper;
let followData = JSON.parse(localStorage.getItem("followData")) || {};
let storiesData = JSON.parse(localStorage.getItem("storiesData")) || [];
const currentUser = localStorage.getItem("loggedInUser");

if (currentUser && !followData[currentUser]) {
  followData[currentUser] = { followers: [], following: [] };
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function saveToStorage() {
  localStorage.setItem("postsData", JSON.stringify(postsData));
  localStorage.setItem("followData", JSON.stringify(followData));
  localStorage.setItem("storiesData", JSON.stringify(storiesData));
}

function renderPosts() {
  const container = document.getElementById("posts");
  if (!container) return;
  container.innerHTML = "";

  postsData.forEach((post, i) => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <h4>${post.username} <span style="color:gray;">${timeAgo(post.timestamp)}</span>
        ${post.username !== currentUser ? renderFollowBtn(post.username) : ""}
        <span class="more-options" onclick="deletePost(${i})">⋯</span>
      </h4>
      <img src="${post.img}" />
      <div class="actions">
        <span onclick="toggleLike(${i})">${post.liked ? "❤️" : "🤍"}</span>
        <span onclick="openCommentModal(${i})">💬</span>
        <span>✈️</span>
        <span style="float:right;" onclick="toggleSave(${i})">${post.saved ? "📌" : "📍"}</span>
      </div>
      <p><strong>${post.likes} likes</strong></p>
      <p>${post.caption}</p>
    `;
    container.appendChild(div);
  });
}

function renderFollowBtn(username) {
  const isFollowing = followData[currentUser]?.following.includes(username);
  return `<button onclick="toggleFollow('${username}')">${isFollowing ? "Unfollow" : "Follow"}</button>`;
}

function toggleFollow(userToFollow) {
  if (!currentUser || currentUser === userToFollow) return;
  let following = followData[currentUser].following;
  let followers = followData[userToFollow]?.followers || [];

  if (following.includes(userToFollow)) {
    following = following.filter(f => f !== userToFollow);
    followers = followers.filter(f => f !== currentUser);
  } else {
    following.push(userToFollow);
    followers.push(currentUser);
  }

  followData[currentUser].following = following;
  followData[userToFollow] = { ...followData[userToFollow], followers };
  saveToStorage();
  renderPosts();
}

function toggleLike(i) {
  postsData[i].liked = !postsData[i].liked;
  postsData[i].likes += postsData[i].liked ? 1 : -1;
  saveToStorage(); renderPosts();
}

function toggleSave(i) {
  postsData[i].saved = !postsData[i].saved;
  saveToStorage(); renderPosts();
}

function deletePost(i) {
  if (confirm("Delete post?")) {
    postsData.splice(i, 1);
    saveToStorage(); renderPosts();
  }
}

function openCommentModal(index) {
  currentPostIndex = index;
  const modal = document.getElementById("commentModal");
  const commentsBox = document.getElementById("modalComments");

  commentsBox.innerHTML = postsData[index].comments.map((c, i) =>
    `<p>${c} <span onclick="deleteComment(${i})">❌</span></p>`
  ).join("");
  modal.style.display = "block";
}

function addComment() {
  const comment = document.getElementById("newComment").value.trim();
  if (comment) {
    postsData[currentPostIndex].comments.push(comment);
    saveToStorage();
    openCommentModal(currentPostIndex);
    document.getElementById("newComment").value = "";
  }
}

function deleteComment(i) {
  postsData[currentPostIndex].comments.splice(i, 1);
  saveToStorage(); openCommentModal(currentPostIndex);
}

function closeModal() {
  document.getElementById("commentModal").style.display = "none";
}

function insertEmoji(e) {
  const input = document.getElementById("newComment");
  input.value += e;
  input.focus();
}

document.getElementById("uploadImage")?.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById("cropContainer").style.display = "block";
    const img = document.getElementById("cropImagePreview");
    img.src = e.target.result;
    if (cropper) cropper.destroy();
    cropper = new Cropper(img, { aspectRatio: 1 });
  };
  reader.readAsDataURL(file);
});

function cropAndUpload() {
  const caption = document.getElementById("captionInput").value.trim();
  if (!cropper || !caption || !currentUser) return alert("Crop + caption + login required");

  cropper.getCroppedCanvas().toBlob(blob => {
    const reader = new FileReader();
    reader.onload = e => {
      postsData.unshift({
        username: currentUser,
        img: e.target.result,
        caption,
        likes: 0, liked: false, saved: false,
        comments: [],
        timestamp: Date.now(),
      });
      saveToStorage(); renderPosts();
      document.getElementById("cropContainer").style.display = "none";
      cropper.destroy();
    };
    reader.readAsDataURL(blob);
  });
}

// --------- STORIES ---------
function renderStories() {
  const container = document.getElementById("storyBar");
  if (!container) return;

  container.innerHTML = "";  

  storiesData = storiesData.map(user => {
  // Remove old stories (older than 24hrs)
  user.stories = user.stories.filter(s => Date.now() - s.timestamp <= 86400000);
  return user;
}).filter(user => user.stories.length > 0);

  storiesData.forEach(user => {
  user.stories.forEach((story, index) => {
    const div = document.createElement("div");
    div.className = "story-item";
    div.innerHTML = `
      <img src="${story.img}" onclick="openStory('${user.username}', ${index})">
      <p style="display:flex; justify-content:space-between; align-items:center;">
  ${user.username}
  ${user.username === currentUser ? 
    `<span onclick="deleteSingleStory('${user.username}', ${index})" style="cursor:pointer; font-size:0.9em;">🗑️</span>` 
    : ""}
</p>

    `;
    container.appendChild(div);
  });
});

  saveToStorage();
}

function uploadStory() {
  const input = document.getElementById("storyUploadInput");
  const file = input.files[0];
  console.log("Upload triggered:", file);  

  if (!file || !currentUser) return alert("Login and select image");

  const reader = new FileReader();
  reader.onload = e => {
    console.log("Image base64:", e.target.result.slice(0, 30));  
    addStory(e.target.result);
    input.value = "";
  };
  reader.readAsDataURL(file);
}


function addStory(imageData) {
  if (!currentUser) return;

  let userStories = storiesData.find(u => u.username === currentUser);
  const story = { img: imageData, timestamp: Date.now() };

  if (userStories) {
    userStories.stories.unshift(story);
  } else {
    storiesData.unshift({ username: currentUser, stories: [story] });
  }

  saveToStorage();
  renderStories();
}

function openStory(username, index = 0) {
  const user = storiesData.find(u => u.username === username);
  if (!user || !user.stories[index]) return;
  const story = user.stories[index];

  const modal = document.getElementById("storyModal");
  document.getElementById("storyImage").src = story.img;

  const leftMins = Math.floor((86400000 - (Date.now() - story.timestamp)) / 60000);
  modal.querySelector("img").alt = `${username} – ${leftMins} mins left`;

  modal.style.display = "flex";

  setTimeout(() => {
    if (index + 1 < user.stories.length) {
      openStory(username, index + 1);
    } else {
      closeStory();
    }
  }, 5000);
}

function closeStory() {
  document.getElementById("storyModal").style.display = "none";
}
function deleteSingleStory(username, index) {
  if (!confirm("Delete this story?")) return;

  const user = storiesData.find(u => u.username === username);
  if (!user) return;

  user.stories.splice(index, 1);

  // If user has no stories left, remove user from array
  if (user.stories.length === 0) {
    storiesData = storiesData.filter(u => u.username !== username);
  }

  saveToStorage();
  renderStories();
}


// --------- AUTH ---------
function registerUser() {
  const uname = document.getElementById("regUsername").value.trim();
  const pwd = document.getElementById("regPassword").value;
  let users = JSON.parse(localStorage.getItem("users")) || {};
  if (users[uname]) return alert("User exists");

  users[uname] = pwd;
  followData[uname] = { followers: [], following: [] };
  localStorage.setItem("users", JSON.stringify(users));
  saveToStorage();
  alert("Registered!");
  window.location.href = "login.html";
}

function loginUser() {
  const uname = document.getElementById("loginUsername").value.trim();
  const pwd = document.getElementById("loginPassword").value;
  let users = JSON.parse(localStorage.getItem("users")) || {};
  if (!users[uname] || users[uname] !== pwd) return alert("Invalid");

  localStorage.setItem("loggedInUser", uname);
  window.location.href = "home.html";
}

// --------- THEME & ROUTE ---------
function applyTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.body.classList.add(theme);
  document.getElementById("themeIcon").textContent = theme === "dark" ? "🌙" : "🌞";
  document.getElementById("darkToggle").checked = theme === "dark";
}

document.getElementById("darkToggle")?.addEventListener("change", () => {
  const theme = document.getElementById("darkToggle").checked ? "dark" : "light";
  document.body.classList.remove("light", "dark");
  document.body.classList.add(theme);
  localStorage.setItem("theme", theme);
  document.getElementById("themeIcon").textContent = theme === "dark" ? "🌙" : "🌞";
});

function navigate(page) {
  window.location.href = page;
}

// INIT
window.onload = () => {
  applyTheme();
  renderPosts();
  renderStories();
};
