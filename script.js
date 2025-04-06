// Reemplaza esto con tu clave anónima de Supabase
const SUPABASE_CLIENT_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amFyb2l2YXBxa29mZ2hjdmNxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzg4MzgyNiwiZXhwIjoyMDU5NDU5ODI2fQ.Ux640A_yGkFd2zXDLGkyliDlE9Kgd2otAGKE22fqlTs";

const SUPABASE_URL = "https://mujaroivapqkofghcvcq.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11amFyb2l2YXBxa29mZ2hjdmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4ODM4MjYsImV4cCI6MjA1OTQ1OTgyNn0.-m1mMV0ehAJO3saN0wSwtMzZElkE-iOLpy6tvMLvc5E";
// Función para obtener los jugadores desde Supabase
async function getPlayers() {
  try {
    const responsePlayer = await fetch(
      `${SUPABASE_URL}/rest/v1/Players?select=*`,
      {
        method: "GET",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SUPABASE_CLIENT_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!responsePlayer.ok) {
      throw new Error(`Error HTTP: ${responsePlayer.status}`);
    }

    const data = await responsePlayer.json();
    console.log("Datos de jugadores recibidos:", data);

    return data;
  } catch (error) {
    console.error("Error al obtener los jugadores:", error);
    return [];
  }
}

// Función para obtener los torneos desde Supabase
async function getTorneos() {
  try {
    const responseTorneo = await fetch(
      `${SUPABASE_URL}/rest/v1/Torneo?select=*`,
      {
        method: "GET",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SUPABASE_CLIENT_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!responseTorneo.ok) {
      throw new Error(`Error HTTP: ${responseTorneo.status}`);
    }

    const data = await responseTorneo.json();
    console.log("Datos de torneos recibidos:", data);

    return data;
  } catch (error) {
    console.error("Error al obtener los torneos:", error);
    return [];
  }
}

// Función para obtener los partidos desde Supabase
async function getPartidos() {
  try {
    const responsePartidos = await fetch(
      `${SUPABASE_URL}/rest/v1/Partidos?select=*`,
      {
        method: "GET",
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${SUPABASE_CLIENT_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!responsePartidos.ok) {
      throw new Error(`Error HTTP: ${responsePartidos.status}`);
    }

    const data = await responsePartidos.json();
    console.log("Datos de partidos recibidos:", data);

    return data;
  } catch (error) {
    console.error("Error al obtener los partidos:", error);
    return [];
  }
}

// Función para agrupar jugadores por grupo dinámicamente
function groupPlayersByGroup(players, partidos, torneos) {
  // Obtener la información del torneo activo (asumiendo que es el primero si hay varios)
  const torneoActivo = torneos && torneos.length > 0 ? torneos[0] : null;
  const numeroGrupos =
    torneoActivo && torneoActivo.NumeroGrupos ? torneoActivo.NumeroGrupos : 5;

  // Crear un mapa de jugador a grupo basado en los partidos
  const playerToGroup = {};

  // Recorrer partidos para identificar los grupos de los jugadores
  partidos.forEach((partido) => {
    if (
      partido.NumeroGrupo &&
      partido.NumeroGrupo >= 1 &&
      partido.NumeroGrupo <= numeroGrupos
    ) {
      // Asignar el grupo a ambos jugadores
      playerToGroup[partido.Player1Id] = partido.NumeroGrupo;
      playerToGroup[partido.Player2Id] = partido.NumeroGrupo;
    }
  });

  // Inicializar grupos según la cantidad especificada en el torneo
  const groups = {};
  for (let i = 1; i <= numeroGrupos; i++) {
    groups[i] = [];
  }

  // Asignar jugadores a sus grupos
  players.forEach((player) => {
    const group = playerToGroup[player.id];
    if (group && groups[group]) {
      groups[group].push(player);
    }
  });

  return groups;
}
// Función para organizar partidos por semana
function organizeMatchesByWeek(partidos) {
  // Determinar las semanas disponibles
  const semanas = [...new Set(partidos.map((p) => p.NumeroSemana))].sort();

  // Inicializar el objeto de partidos por semana
  const matchesByWeek = {};

  // Crear una entrada para cada semana
  semanas.forEach((semana) => {
    matchesByWeek[semana] = [];
  });

  //   // Si no hay semanas, crear las semanas del 1 al 5 por defecto
  //   if (semanas.length === 0) {
  //     for (let i = 1; i <= 5; i++) {
  //       matchesByWeek[i] = [];
  //     }
  //   }

  // Distribuir los partidos en sus respectivas semanas
  partidos.forEach((partido) => {
    const semana = partido.NumeroSemana;
    if (semana && matchesByWeek[semana]) {
      matchesByWeek[semana].push({
        player1: partido.Player1Id,
        player2: partido.Player2Id,
        group: partido.NumeroGrupo,
        partidoId: partido.id,
        resultado: partido.Resultado || null,
        ganador: partido.PlayerGanador || null,
      });
    }
  });

  return matchesByWeek;
}

// Función para encontrar el nombre del jugador por ID
function getPlayerNameById(playerId, players) {
  const player = players.find((p) => p.id === playerId);
  return player ? player.Nombre : `Jugador ID: ${playerId}`;
}

// Función para mostrar los grupos de jugadores
function displayPlayerGroups(players, partidos, torneos) {
  const groupedPlayers = groupPlayersByGroup(players, partidos, torneos);
  const container = document.querySelector(".groups-container");

  if (!container) {
    console.warn("No se encontró el contenedor para mostrar los grupos");
    return;
  }

  // Limpia el contenedor
  container.innerHTML = "";

  // Crea elementos para cada grupo
  Object.keys(groupedPlayers)
    .sort()
    .forEach((groupNum) => {
      const groupDiv = document.createElement("div");
      groupDiv.className = "group";

      const groupTitle = document.createElement("h2");
      groupTitle.textContent = `Grupo ${groupNum}`;
      groupDiv.appendChild(groupTitle);

      // Crear tabla para estadísticas
      const statsTable = document.createElement("table");
      statsTable.className = "stats-table";

      // Crear encabezado de la tabla
      const tableHeader = document.createElement("thead");
      const headerRow = document.createElement("tr");

      headerRow.innerHTML = `
        <th>Jugador</th>
        <th>PJ</th>
        <th>PG</th>
        <th>PP</th>
        <th>PTS</th>
      `;

      tableHeader.appendChild(headerRow);
      statsTable.appendChild(tableHeader);

      // Crear cuerpo de la tabla
      const tableBody = document.createElement("tbody");

      // Calcular estadísticas para cada jugador
      const playersWithStats = groupedPlayers[groupNum].map((player) => {
        // Buscar partidos de este jugador
        const playerMatches = partidos.filter(
          (p) => p.Player1Id === player.id || p.Player2Id === player.id
        );

        // Calcular partidos jugados (con resultado)
        const matchesPlayed = playerMatches.filter((p) => p.Resultado).length;

        // Calcular partidos ganados
        const matchesWon = playerMatches.filter(
          (p) => p.PlayerGanador === player.id
        ).length;

        // Calcular partidos perdidos
        const matchesLost = matchesPlayed - matchesWon;

        // Calcular puntos (2 por victoria, 0 por derrota)
        const points = matchesWon * 2;

        return {
          ...player,
          stats: {
            played: matchesPlayed,
            won: matchesWon,
            lost: matchesLost,
            points: points,
          },
        };
      });

      // Ordenar jugadores por puntos (de mayor a menor)
      playersWithStats.sort((a, b) => b.stats.points - a.stats.points);

      // Añadir jugadores con sus estadísticas
      playersWithStats.forEach((player, index) => {
        const playerRow = document.createElement("tr");

        // Añadir clase para destacar posiciones
        if (index === 0) {
          playerRow.classList.add("position-1");
        } else if (index === 1) {
          playerRow.classList.add("position-2");
        }

        playerRow.innerHTML = `
          <td>${player.Nombre || `Jugador ID: ${player.id}`}</td>
          <td><span class="stat-value">${player.stats.played}</span></td>
          <td><span class="stat-value">${player.stats.won}</span></td>
          <td><span class="stat-value">${player.stats.lost}</span></td>
          <td><span class="stat-value">${player.stats.points}</span></td>
        `;

        tableBody.appendChild(playerRow);
      });

      statsTable.appendChild(tableBody);
      groupDiv.appendChild(statsTable);
      container.appendChild(groupDiv);
    });

  // Si no hay grupos, mostrar mensaje
  if (Object.keys(groupedPlayers).length === 0) {
    const noGroupsMsg = document.createElement("div");
    noGroupsMsg.className = "no-groups";
    noGroupsMsg.textContent = "No hay grupos definidos.";
    container.appendChild(noGroupsMsg);
  }
}

// Función para mostrar partidos por semana
function displayMatches(players, partidos, torneos) {
  // Obtener la información del torneo activo
  const torneoActivo = torneos && torneos.length > 0 ? torneos[0] : null;
  const cantidadFechas =
    torneoActivo && torneoActivo.CantidadFechas
      ? torneoActivo.CantidadFechas
      : 5;

  // Organizar partidos por semana
  const matchesByWeek = organizeMatchesByWeek(partidos);

  // Crear o actualizar los contenedores de semanas
  const weekContainersParent = document.querySelector(".container");
  const weekContainers = document.querySelectorAll(".week-container");

  // Eliminar contenedores de semana existentes
  weekContainers.forEach((container) => {
    container.remove();
  });

  // Crear un contenedor para las semanas
  const fechasContainer = document.createElement("div");
  fechasContainer.className = "fechas-container";

  // Agregar título de sección
  const seccionPartidos = document.createElement("div");
  seccionPartidos.className = "section-title";
  //   seccionPartidos.textContent = "Calendario de Partidos";
  weekContainersParent.appendChild(seccionPartidos);
  weekContainersParent.appendChild(fechasContainer);

  // Crear secciones para cada semana según la cantidad de fechas del torneo
  for (let i = 1; i <= cantidadFechas; i++) {
    const weekNumber = i;
    const weekContainer = document.createElement("div");
    weekContainer.className = "week-container";

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";
    weekHeader.textContent = `Semana ${weekNumber}`;

    const matchesGrid = document.createElement("div");
    matchesGrid.className = "matches-grid";

    // Obtén los partidos para esta semana
    const weekMatches = matchesByWeek[weekNumber] || [];

    if (weekMatches.length === 0) {
      // Si no hay partidos, mostrar mensaje
      const noMatchesMsg = document.createElement("div");
      noMatchesMsg.className = "no-matches";
      noMatchesMsg.textContent =
        "No hay partidos programados para esta semana.";
      matchesGrid.appendChild(noMatchesMsg);
    } else {
      // Crea elementos para cada partido
      weekMatches.forEach((match) => {
        const matchCard = document.createElement("div");
        matchCard.className = "match-card";

        const groupLabel = document.createElement("div");
        groupLabel.className = "group-label";
        groupLabel.textContent = `Grupo ${match.group}`;

        const matchPlayers = document.createElement("div");
        matchPlayers.className = "match-players";
        matchPlayers.innerHTML = `
            ${getPlayerNameById(match.player1, players)}
            <span class="versus">vs</span>
            ${getPlayerNameById(match.player2, players)}
          `;

        // Añadir resultado si existe
        if (match.resultado) {
          const resultDiv = document.createElement("div");
          resultDiv.className = "match-result";
          resultDiv.textContent = match.resultado;
          matchCard.appendChild(resultDiv);
        }

        // Marcar ganador si existe
        if (match.ganador) {
          matchCard.classList.add("match-completed");
          // Destacar al ganador
          if (match.ganador === match.player1) {
            matchPlayers.classList.add("player1-winner");
          } else if (match.ganador === match.player2) {
            matchPlayers.classList.add("player2-winner");
          }
        }

        matchCard.appendChild(groupLabel);
        matchCard.appendChild(matchPlayers);
        matchesGrid.appendChild(matchCard);
      });
    }

    weekContainer.appendChild(weekHeader);
    weekContainer.appendChild(matchesGrid);
    fechasContainer.appendChild(weekContainer);
  }

  // Insertar nota al final si existe
  const noteElement = document.querySelector(".note");
  if (noteElement) {
    weekContainersParent.appendChild(noteElement);
  }
}

// Función para cargar y mostrar todos los datos
async function loadAndDisplayData() {
  try {
    // Mostrar indicadores de carga
    const loadingElements = document.querySelectorAll(".loading");
    loadingElements.forEach((el) => {
      el.style.display = "block";
    });

    // Cargar datos
    const players = await getPlayers();
    const torneos = await getTorneos();
    const partidos = await getPartidos();

    // Ocultar indicadores de carga
    loadingElements.forEach((el) => {
      el.style.display = "none";
    });

    // Mostrar grupos de jugadores
    displayPlayerGroups(players, partidos);

    // Mostrar partidos
    displayMatches(players, partidos);

    return {
      players,
      torneos,
      partidos,
    };
  } catch (error) {
    console.error("Error al cargar y mostrar los datos:", error);

    // Mostrar mensaje de error
    const errorMsg = document.createElement("div");
    errorMsg.className = "error-message";
    errorMsg.textContent = `Error al cargar los datos: ${error.message}`;

    document.querySelector(".container").prepend(errorMsg);
  }
}

// Función para actualizar la página periódicamente (cada 5 minutos)
function setupPeriodicRefresh() {
  setInterval(() => {
    loadAndDisplayData();
  }, 5 * 60 * 1000); // 5 minutos
}

// Llama a la función cuando la página se carga
document.addEventListener("DOMContentLoaded", () => {
  loadAndDisplayData();
  setupPeriodicRefresh();
});
