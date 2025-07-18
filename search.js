const searchInput = document.getElementById("searchInput");
const recentBox = document.getElementById("recentSearches");

let recent = JSON.parse(localStorage.getItem("recentSearches")) || [];

function renderRecent() {
  recentBox.innerHTML = "<strong>Recent:</strong>";
  recent.slice(-5).reverse().forEach((item) => {
    const p = document.createElement("p");
    p.textContent = item;
    recentBox.appendChild(p);
  });
}

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    const query = e.target.value.trim();
    if (query && !recent.includes(query)) {
      recent.push(query);
      localStorage.setItem("recentSearches", JSON.stringify(recent));
    }
    e.target.value = "";
    renderRecent();
  }
});

renderRecent();
