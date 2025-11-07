const ACCESS_KEY = "ZCd564sFTuzC9x8n7JDr9h6guE9hiHGeP2qkePribBk"

const el = (s) => document.querySelector(s)
const grid = el("#grid")
const statusEl = el("#status")
const searchForm = el("#search-form")
const searchInput = el("#search-input")
const searchBtn = el("#search-btn")
const btnXHR = el("#btn-xhr")
const btnFetch = el("#btn-fetch")
const btnAsync = el("#btn-async")
const btnLoadMore = el("#load-more")
const recentChipsEl = el("#recent-chips")
const clearRecents = el("#clear-recents")
const modal = el("#modal")
const modalImg = el("#modal-img")
const modalMeta = el("#modal-meta")
const modalClose = el("#modal-close")

const state = {
  method: "async",
  query: "",
  page: 1,
  perPage: 12,
  total: 0,
  isLoading: false,
}

const saveRecents = (list) => localStorage.setItem("recentSearches", JSON.stringify(list.slice(0, 10)))
const loadRecents = () => JSON.parse(localStorage.getItem("recentSearches") || "[]")

function setStatus(msg, kind = "info") {
  statusEl.textContent = msg
  statusEl.style.color = kind === "error" ? "red" : "gray"
}

function setLoading(value) {
  state.isLoading = value
  grid.setAttribute("aria-busy", String(value))
  if (value) {
    setStatus("Loading images…")
    searchBtn.disabled = true
    btnLoadMore.disabled = true
    statusEl.insertAdjacentHTML("beforeend", ' <span class="spinner" aria-hidden="true"></span>')
  } else {
    searchBtn.disabled = false
    btnLoadMore.disabled = false
  }
}

function buildURL(query, page = 1) {
  const params = new URLSearchParams({
    query,
    page,
    per_page: state.perPage,
    client_id: ACCESS_KEY,
  })
  return `https://api.unsplash.com/search/photos?${params.toString()}`
}

function activateMethodButton(active) {
  [btnXHR, btnFetch, btnAsync].forEach((btn) => {
    const isActive = btn === active
    btn.classList.toggle("is-active", isActive)
    btn.setAttribute("aria-pressed", String(isActive))
  })
}

function cardTemplate(photo) {
  const alt = photo.alt_description || "Unsplash photo"
  const avatar = photo.user?.profile_image?.small || ""
  const author = photo.user?.name || "Unknown"
  const link = photo.links?.html || "#"
  const likes = photo.likes ?? "—"
  return `
    <article class="card" data-full="${photo.urls?.regular}" data-alt="${alt}" data-credit="${author}" data-link="${link}">
      <img class="card__img" src="${photo.urls?.small}" alt="${alt}" loading="lazy">
      <div class="card__meta">
        <div class="card__credit">
          <img src="${avatar}" alt="">
          <span class="truncate"><a href="${link}" target="_blank" rel="noopener">${author}</a></span>
        </div>
        <span>❤️ ${likes}</span>
      </div>
    </article>`
}

function renderPhotos(payload, { append = false } = {}) {
  const photos = payload.results || []
  state.total = payload.total || 0
  const html = photos.map(cardTemplate).join("")
  if (append) grid.insertAdjacentHTML("beforeend", html)
  else grid.innerHTML = html
  btnLoadMore.hidden = state.page * state.perPage >= state.total
  setStatus(
    state.total
      ? `Showing ${Math.min(state.page * state.perPage, state.total)} of ${state.total} results for “${state.query}”.`
      : `No results for “${state.query}”.`,
    state.total ? "info" : "error"
  )
}

// -------------------- Network Methods --------------------
function requestXHR(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("GET", url)
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300
      ? resolve(JSON.parse(xhr.responseText))
      : reject(new Error(`XHR ${xhr.status}`)))
    xhr.onerror = () => reject(new Error("Network error (XHR)"))
    xhr.send()
  })
}

function requestFetch(url) {
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Fetch ${r.status}`)
      return r.json()
    })
}

async function requestAsync(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Async ${res.status}`)
  return res.json()
}

// -------------------- Main Controller --------------------
async function runSearch({ append = false } = {}) {
  const query = searchInput.value.trim() || "nature"
  state.query = query
  if (!query) return
  setLoading(true)
  const url = buildURL(query, state.page)
  try {
    let payload
    if (state.method === "xhr") payload = await requestXHR(url)
    if (state.method === "fetch") payload = await requestFetch(url)
    if (state.method === "async") payload = await requestAsync(url)
    renderPhotos(payload, { append })
    bumpRecent(query)
  } catch (err) {
    console.error(err)
    setStatus("Couldn’t fetch images. Check your Access Key and network, then try again.", "error")
  } finally {
    setLoading(false)
  }
}

// -------------------- Recents --------------------
function bumpRecent(q) {
  const recents = loadRecents().filter((x) => x.toLowerCase() !== q.toLowerCase())
  recents.unshift(q)
  saveRecents(recents)
  paintRecents()
}

function paintRecents() {
  const recents = loadRecents()
  recentChipsEl.innerHTML = recents.map((q) => `<button class="chip" data-q="${q}">${q}</button>`).join("")
  clearRecents.disabled = recents.length === 0
}

// -------------------- Events --------------------
searchForm.addEventListener("submit", (e) => {
  e.preventDefault()
  state.query = searchInput.value.trim()
  state.page = 1
  runSearch({ append: false })
})

btnLoadMore.addEventListener("click", () => {
  state.page += 1
  runSearch({ append: true })
})

btnXHR.addEventListener("click", () => {
  state.method = "xhr"
  activateMethodButton(btnXHR)
  state.query = searchInput.value.trim() || "nature"
  state.page = 1
  runSearch()
})

btnFetch.addEventListener("click", () => {
  state.method = "fetch"
  activateMethodButton(btnFetch)
  state.query = searchInput.value.trim() || "nature"
  state.page = 1
  runSearch()
})

btnAsync.addEventListener("click", () => {
  state.method = "async"
  activateMethodButton(btnAsync)
  state.query = searchInput.value.trim() || "nature"
  state.page = 1
  runSearch()
})

recentChipsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip")
  if (!chip) return
  searchInput.value = chip.dataset.q
  state.query = chip.dataset.q
  state.page = 1
  runSearch({ append: false })
})

clearRecents.addEventListener("click", () => {
  localStorage.removeItem("recentSearches")
  paintRecents()
})

window.addEventListener("keydown", (e) => {
  if (e.key === "/") { e.preventDefault(); searchInput.focus() }
  if (e.key === "1") { state.method = "xhr"; activateMethodButton(btnXHR); runSearch() }
  if (e.key === "2") { state.method = "fetch"; activateMethodButton(btnFetch); runSearch() }
  if (e.key === "3") { state.method = "async"; activateMethodButton(btnAsync); runSearch() }
})

grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card")
  if (!card) return
  modalImg.src = card.dataset.full
  modalImg.alt = card.dataset.alt
  modalMeta.innerHTML = `Photo by <a href="${card.dataset.link}" target="_blank" rel="noopener">${card.dataset.credit}</a> on Unsplash`
  modal.showModal()
})

modalClose.addEventListener("click", () => modal.close())
modal.addEventListener("click", (e) => { if (e.target === modal) modal.close() })

paintRecents()
setStatus("Try “nature”, “mountains”, or “city”. Then toggle methods to compare.")
