const players = [
  { name: "Omar Al-Farouq", team: "KSA", points: 31.2, rebounds: 9.8, assists: 6.1 },
  { name: "Khalid Al-Mansour", team: "UAE", points: 28.5, rebounds: 5.4, assists: 7.2 },
  { name: "Yousef Al-Hassan", team: "EGY", points: 29.9, rebounds: 8.1, assists: 4.9 },
  { name: "Tariq Al-Salem", team: "QAT", points: 26.7, rebounds: 6.3, assists: 5.5 },
  { name: "Fahad Al-Omari", team: "JOR", points: 27.8, rebounds: 7.5, assists: 5.0 },
];

const tableBody = document.querySelector("tbody");
const searchInput = document.querySelector("input");
const teamDropdown = document.querySelector("select");
const darkModeToggle = document.querySelector("button");
const tableHeaders = document.querySelectorAll("th");

const summaryContainer = document.createElement("div");
summaryContainer.id = "summary";
summaryContainer.style.marginTop = "20px";
summaryContainer.style.fontWeight = "bold";
document.body.appendChild(summaryContainer);

function populateTeamDropdown() {
  const uniqueTeams = ["All", ...new Set(players.map(p => p.team))];
  teamDropdown.innerHTML = uniqueTeams
    .map(team => `<option value="${team}">${team}</option>`)
    .join("");
}
populateTeamDropdown();

function renderTable(data) {
  tableBody.innerHTML = "";
  data.forEach(player => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${player.name}</td>
      <td>${player.team}</td>
      <td>${player.points}</td>
      <td>${player.rebounds}</td>
      <td>${player.assists}</td>
    `;
    tableBody.appendChild(row);
  });
  updateSummary(data);
}

function updateSummary(data) {
  if (data.length === 0) {
    summaryContainer.textContent = "No players match your filters.";
    return;
  }
  const avgPoints = (data.reduce((sum, p) => sum + p.points, 0) / data.length).toFixed(1);
  const avgRebounds = (data.reduce((sum, p) => sum + p.rebounds, 0) / data.length).toFixed(1);
  const avgAssists = (data.reduce((sum, p) => sum + p.assists, 0) / data.length).toFixed(1);
  summaryContainer.textContent = `Averages — Points: ${avgPoints}, Rebounds: ${avgRebounds}, Assists: ${avgAssists}`;
}

function filterPlayers() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedTeam = teamDropdown.value;
  const filteredPlayers = players.filter(player => {
    const matchesName = player.name.toLowerCase().includes(searchTerm);
    const matchesTeam = selectedTeam === "All" || player.team === selectedTeam;
    return matchesName && matchesTeam;
  });
  renderTable(filteredPlayers);
}

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "Light Mode"
    : "Dark Mode";
});

searchInput.addEventListener("input", filterPlayers);
teamDropdown.addEventListener("change", filterPlayers);

tableBody.addEventListener("mouseover", e => {
  const row = e.target.closest("tr");
  if (row) row.style.backgroundColor = "lightgray";
});
tableBody.addEventListener("mouseout", e => {
  const row = e.target.closest("tr");
  if (row) row.style.backgroundColor = "";
});

let sortDirection = 1;
tableHeaders.forEach(header => {
  header.addEventListener("click", () => {
    const key = header.textContent.toLowerCase();
    if (["points", "rebounds", "assists"].includes(key)) {
      const sortedPlayers = [...players].sort(
        (a, b) => (a[key] - b[key]) * sortDirection
      );
      sortDirection *= -1;
      renderTable(sortedPlayers);
    }
  });
});

renderTable(players);
