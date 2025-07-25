const SUPABASE_URL = "https://mujaroivapqkofghcvcq.supabase.co";

// Función para obtener los jugadores desde Supabase
async function getPlayers() {
  try {
    const responsePlayer = await fetch(
      `${SUPABASE_URL}/functions/v1/GetJugadores`,
      {
        method: "GET",
        headers: {
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
// async function getTorneos() {
//   try {
//     const responseTorneo = await fetch(
//       `${SUPABASE_URL}/rest/v1/Torneo?select=*`,
//       {
//         method: "GET",
//         headers: {
//           apikey: ANON_KEY,
//           Authorization: `Bearer ${SUPABASE_CLIENT_ANON_KEY}`,
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     if (!responseTorneo.ok) {
//       throw new Error(`Error HTTP: ${responseTorneo.status}`);
//     }

//     const data = await responseTorneo.json();
//     console.log("Datos de torneos recibidos:", data);

//     return data;
//   } catch (error) {
//     console.error("Error al obtener los torneos:", error);
//     return [];
//   }
// }

// Función para obtener los partidos desde Supabase
async function getPartidos() {
  try {
    const responsePartidos = await fetch(
      `${SUPABASE_URL}/functions/v1/GetPartidos`,
      {
        method: "POST",
        headers: {
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

// Función para actualizar el resultado de un partido usando la Edge Function
async function updatePartidoResultado(partidoId, resultadoFinal, ganadorId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/ActualizarPartido`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: partidoId,
          Resultado: resultadoFinal,
          PlayerGanador: ganadorId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Error: ${response.status} - ${errorData.error || "Error desconocido"}`
      );
    }
    const data = await response.json();
    console.log("Partido actualizado:", data);
    return true;
  } catch (error) {
    console.error("Error al actualizar partido:", error);
    return false;
  }
}

// Función para eliminar lógicamente el resultado de un partido
async function deleteResultadoById(partidoId) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/EliminarLogicoPartido?id=${partidoId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al eliminar resultado:", errorData);
      throw new Error(
        `Error: ${response.status} - ${errorData.error || "Error desconocido"}`
      );
    }

    return true;
  } catch (error) {
    console.error("Error completo:", error);
    return false;
  }
}

// Función para agrupar jugadores por grupo dinámicamente
function groupPlayersByGroup(players, partidos, torneos) {
  // Obtener la información del torneo activo (asumiendo que es el primero si hay varios)
  const torneoActivo = torneos && torneos.length > 0 ? torneos[0] : null;
  const numeroGrupos =
    torneoActivo && torneoActivo.NumeroGrupos ? torneoActivo.NumeroGrupos : 8;

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
        const points = matchesWon * 3;

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

        // Crear un elemento span para el nombre y hacerlo clicable
        const playerName = player.Nombre || `Jugador ID: ${player.id}`;
        const playerTelefono = player.Telefono;

        playerRow.innerHTML = `
          <td><span class="player-name" style="cursor: pointer; color: #0066cc; text-decoration: underline;">${playerName}</span></td>
          <td><span class="stat-value">${player.stats.played}</span></td>
          <td><span class="stat-value">${player.stats.won}</span></td>
          <td><span class="stat-value">${player.stats.lost}</span></td>
          <td><span class="stat-value">${player.stats.points}</span></td>
        `;

        tableBody.appendChild(playerRow);

        // Añadir evento click al nombre del jugador
        const playerNameSpan = playerRow.querySelector(".player-name");
        playerNameSpan.addEventListener("click", function () {
          // Mostrar SweetAlert con el ID del jugador
          Swal.fire({
            title: `Telefono del Jugador ${playerName}`,
            text: `${playerTelefono ?? "Sin numero"}`,
            icon: "info",
            confirmButtonText: "Cerrar",
          });
        });
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

// Función para mostrar los partidos por semana
function displayMatches(players, partidos, torneos) {
  const torneoActivo = torneos && torneos.length > 0 ? torneos[0] : null;
  const cantidadFechas = torneoActivo?.CantidadFechas || 1;

  const matchesByWeek = organizeMatchesByWeek(partidos);

  const weekContainersParent = document.querySelector(".container");
  const weekContainers = document.querySelectorAll(".week-container");
  weekContainers.forEach((container) => container.remove());

  const fechasContainer = document.createElement("div");
  fechasContainer.className = "fechas-container";

  const seccionPartidos = document.createElement("div");
  seccionPartidos.className = "section-title";
  weekContainersParent.appendChild(seccionPartidos);
  weekContainersParent.appendChild(fechasContainer);

  for (let i = 1; i <= cantidadFechas; i++) {
    const weekNumber = i;
    const weekContainer = document.createElement("div");
    weekContainer.className = "week-container";

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";
    weekHeader.textContent = `Calendario`; //${weekNumber}

    const matchesGrid = document.createElement("div");
    matchesGrid.className = "matches-grid";

    let weekMatches = matchesByWeek[weekNumber] || [];

    // NUEVO: Ordenar partidos de la semana por el número de grupo
    weekMatches.sort((a, b) => a.group - b.group);

    if (weekMatches.length === 0) {
      const noMatchesMsg = document.createElement("div");
      noMatchesMsg.className = "no-matches";
      noMatchesMsg.textContent =
        "No hay partidos programados para esta semana.";
      matchesGrid.appendChild(noMatchesMsg);
    } else {
      weekMatches.forEach((match) => {
        const matchCard = document.createElement("div");
        matchCard.className = "match-card";
        matchCard.id = `partido-${match.partidoId}`;
        matchCard.dataset.partidoId = match.partidoId;
        matchCard.dataset.player1Id = match.player1;
        matchCard.dataset.player2Id = match.player2;
        matchCard.dataset.grupo = match.group;
        matchCard.dataset.semana = weekNumber;

        const groupLabel = document.createElement("div");
        groupLabel.className = "group-label";
        groupLabel.textContent = `Grupo ${match.group}`;

        const matchPlayers = document.createElement("div");
        matchPlayers.className = "match-players";

        const player1Span = document.createElement("span");
        player1Span.className = "player-name";
        player1Span.textContent = getPlayerNameById(match.player1, players);

        const vsSpan = document.createElement("span");
        vsSpan.className = "versus";
        vsSpan.textContent = "vs";

        const player2Span = document.createElement("span");
        player2Span.className = "player-name";
        player2Span.textContent = getPlayerNameById(match.player2, players);

        // NUEVO: limpiar siempre las clases para evitar que queden colores antiguos
        matchCard.classList.remove("match-completed");
        player1Span.classList.remove("player-winner", "player-loser");
        player2Span.classList.remove("player-winner", "player-loser");

        // Marcar ganador si existe
        if (match.ganador) {
          matchCard.classList.add("match-completed");

          if (match.ganador === match.player1) {
            player1Span.classList.add("player-winner");
            player2Span.classList.add("player-loser");
          } else if (match.ganador === match.player2) {
            player2Span.classList.add("player-winner");
            player1Span.classList.add("player-loser");
          }
        }

        matchPlayers.appendChild(player1Span);
        matchPlayers.appendChild(vsSpan);
        matchPlayers.appendChild(player2Span);

        matchCard.appendChild(groupLabel);

        if (match.resultado) {
          const resultDiv = document.createElement("div");
          resultDiv.className = "match-result";
          resultDiv.textContent = match.resultado;
          matchCard.appendChild(resultDiv);
        }

        matchCard.appendChild(matchPlayers);

        const resultButton = document.createElement("button");

        // Agregar botón solo para partidos sin resultado
        if (!match.resultado) {
          resultButton.className = "result-button";
          resultButton.style.marginTop = "10px";
          resultButton.style.width = "100%";
          resultButton.style.padding = "5px";
          resultButton.style.backgroundColor = "#5bc0de";
          resultButton.style.color = "white";
          resultButton.style.border = "none";
          resultButton.style.borderRadius = "4px";
          resultButton.style.cursor = "pointer";
          resultButton.textContent = "Agregar resultado";

          // Evitar que el clic en el botón active el clic de la tarjeta
          resultButton.addEventListener("click", function (event) {
            event.stopPropagation();
            const player1Name = getPlayerNameById(match.player1, players);
            const player2Name = getPlayerNameById(match.player2, players);

            Swal.fire({
              title: "Agregar resultado",
              html: `
                <p><strong>Partido #${match.partidoId}</strong></p>
                <p>${player1Name} vs ${player2Name}</p>
                <p>Grupo ${match.group} - Semana ${weekNumber}</p>
                <div class="set-form" style="margin-top: 15px; background-color: #333; color: white; border-radius: 5px; overflow: hidden;">
                  <div style="display: flex; padding: 10px; background-color: #222;">
                    <div style="flex: 0.5; font-weight: bold;">Participante</div>
                    <div style="flex: 1; font-weight: bold; text-align: center;">Resultado</div>
                    <div style="width: 80px; font-weight: bold; text-align: center;">Ganador</div>
                  </div>
                  
                  <!-- Primera fila - Jugador 1 -->
                  <div style="display: flex; padding: 10px; border-bottom: 1px solid #444;">
                    <div style="flex: 0.5;">${player1Name}</div>
                    <div id="player1-results" style="display: flex; flex: 1;">
                      <div style="flex: 1; text-align: center;">
                        <input type="number" id="player1-score-1" min="0" max="7" maxlength="1" oninput="this.value = this.value > 7 ? 7 : Math.abs(this.value).toString().slice(0,1)" style="width: 60px; text-align: center; background-color: #444; color: white; border: none; padding: 5px;">
                      </div>
                    </div>
                    <div style="width: 80px; text-align: center;">
                      <input type="radio" name="ganador" id="ganador-player1" value="${match.player1}">
                    </div>
                  </div>
                  
                  <!-- Segunda fila - Jugador 2 -->
                  <div style="display: flex; padding: 10px;">
                    <div style="flex: 0.5;">${player2Name}</div>
                    <div id="player2-results" style="display: flex; flex: 1;">
                      <div style="flex: 1; text-align: center;">
                        <input type="number" id="player2-score-1" min="0" max="7" maxlength="1" oninput="this.value = this.value > 7 ? 7 : Math.abs(this.value).toString().slice(0,1)" style="width: 60px; text-align: center; background-color: #444; color: white; border: none; padding: 5px;">
                      </div>
                    </div>
                    <div style="width: 80px; text-align: center;">
                      <input type="radio" name="ganador" id="ganador-player2" value="${match.player2}">
                    </div>
                  </div>
                </div>
                <div style="text-align: right; margin-top: 10px;">
                  <button id="add-set-btn" style="background-color: #FF6B35; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">ADICIONAR UN SET</button>
                </div>
              `,
              icon: "info",
              showCancelButton: true,
              confirmButtonText: "Guardar",
              cancelButtonText: "Cancelar",
              didOpen: () => {
                // Agregar funcionalidad al botón "ADICIONAR UN SET"
                document
                  .getElementById("add-set-btn")
                  .addEventListener("click", function () {
                    // Contar el número actual de columnas de resultado
                    const resultsContainer =
                      document.getElementById("player1-results");
                    const setCount =
                      resultsContainer.querySelectorAll("div").length + 1;

                    if (setCount <= 3) {
                      // Limitamos a 3 sets como máximo
                      // Agregar nueva columna para el jugador 1
                      const player1Col = document.createElement("div");
                      player1Col.style = "flex: 1; text-align: center;";
                      player1Col.innerHTML = `<input type="number" id="player1-score-${setCount}" min="0" max="7" maxlength="1" oninput="this.value = this.value > 7 ? 7 : Math.abs(this.value).toString().slice(0,1)" style="width: 60px; text-align: center; background-color: #444; color: white; border: none; padding: 5px;">`;
                      document
                        .getElementById("player1-results")
                        .appendChild(player1Col);

                      // Agregar nueva columna para el jugador 2
                      const player2Col = document.createElement("div");
                      player2Col.style = "flex: 1; text-align: center;";
                      player2Col.innerHTML = `<input type="number" id="player2-score-${setCount}" min="0" max="7" maxlength="1" oninput="this.value = this.value > 7 ? 7 : Math.abs(this.value).toString().slice(0,1)" style="width: 60px; text-align: center; background-color: #444; color: white; border: none; padding: 5px;">`;
                      document
                        .getElementById("player2-results")
                        .appendChild(player2Col);
                    }

                    // Si alcanzamos el límite de sets, deshabilitamos el botón
                    if (setCount >= 3) {
                      document.getElementById("add-set-btn").disabled = true;
                      document.getElementById("add-set-btn").style.opacity =
                        "0.5";
                    }
                  });
              },
            }).then((result) => {
              if (result.isConfirmed) {
                // Recopilar los resultados de todos los sets
                const setResults = [];
                const setCount = document.querySelectorAll(
                  "#player1-results > div"
                ).length;

                let totalSetsPlayer1 = 0;
                let totalSetsPlayer2 = 0;

                for (let i = 1; i <= setCount; i++) {
                  const player1Score =
                    document.getElementById(`player1-score-${i}`).value || 0;
                  const player2Score =
                    document.getElementById(`player2-score-${i}`).value || 0;

                  if (player1Score !== "" || player2Score !== "") {
                    setResults.push(`${player1Score}-${player2Score}`);

                    // Determinar ganador del set
                    if (parseInt(player1Score) > parseInt(player2Score)) {
                      totalSetsPlayer1++;
                    } else if (
                      parseInt(player2Score) > parseInt(player1Score)
                    ) {
                      totalSetsPlayer2++;
                    }
                  }
                }

                // Obtener el ganador seleccionado por el usuario
                let ganadorId = null;
                const ganadorPlayer1 =
                  document.getElementById("ganador-player1");
                const ganadorPlayer2 =
                  document.getElementById("ganador-player2");

                if (ganadorPlayer1 && ganadorPlayer1.checked) {
                  ganadorId = match.player1;
                } else if (ganadorPlayer2 && ganadorPlayer2.checked) {
                  ganadorId = match.player2;
                } else {
                  // Si no hay selección, determinar ganador automáticamente
                  if (totalSetsPlayer1 > totalSetsPlayer2) {
                    ganadorId = match.player1;
                  } else if (totalSetsPlayer2 > totalSetsPlayer1) {
                    ganadorId = match.player2;
                  }
                }

                // Formatear el resultado final (ej: 6-1/6-2/7-6)
                const resultadoFinal = setResults.join("/");

                // Llamar a la función para actualizar el resultado en la base de datos
                updatePartidoResultado(
                  match.partidoId,
                  resultadoFinal,
                  ganadorId
                ).then((exitoso) => {
                  if (exitoso) {
                    Swal.fire({
                      title: "Éxito",
                      text: "El resultado ha sido guardado correctamente.",
                      icon: "success",
                      confirmButtonText: "OK",
                    }).then(() => {
                      // Recargar los datos después de guardar
                      loadAndDisplayData();
                    });
                  } else {
                    Swal.fire({
                      title: "Error",
                      text: "Hubo un problema al guardar el resultado. Por favor, inténtalo de nuevo.",
                      icon: "error",
                      confirmButtonText: "OK",
                    });
                  }
                });
              }
            });
          });
        } else {
          // El partido ya tiene resultado => mostrar botón para eliminar el resultado
          resultButton.className = "result-button";
          resultButton.style.marginTop = "10px";
          resultButton.style.width = "100%";
          resultButton.style.padding = "5px";
          resultButton.style.backgroundColor = "#FF6B35";
          resultButton.style.color = "white";
          resultButton.style.border = "none";
          resultButton.style.borderRadius = "4px";
          resultButton.style.cursor = "pointer";
          resultButton.textContent = "Eliminar resultado";

          // Evento para eliminar el resultado
          resultButton.addEventListener("click", function (event) {
            event.stopPropagation();

            Swal.fire({
              title: "Confirmar eliminación",
              text: `¿Estás seguro de que deseas eliminar el resultado del partido #${match.partidoId}?`,
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Sí, eliminar",
              cancelButtonText: "Cancelar",
            }).then((result) => {
              if (result.isConfirmed) {
                // Llamar a la función para eliminar el resultado
                deleteResultadoById(match.partidoId).then((exitoso) => {
                  if (exitoso) {
                    Swal.fire({
                      title: "Éxito",
                      text: "El resultado ha sido eliminado correctamente.",
                      icon: "success",
                      confirmButtonText: "OK",
                    }).then(() => {
                      // Recargar los datos después de eliminar
                      loadAndDisplayData();
                    });
                  } else {
                    Swal.fire({
                      title: "Error",
                      text: "Hubo un problema al eliminar el resultado. Por favor, inténtalo de nuevo.",
                      icon: "error",
                      confirmButtonText: "OK",
                    });
                  }
                });
              }
            });
          });
        }

        matchCard.appendChild(resultButton);

        const idBadge = document.createElement("div");
        idBadge.className = "match-id-badge";
        idBadge.textContent = `#${match.partidoId}`;
        idBadge.style.fontSize = "0.7rem";
        idBadge.style.color = "#999";
        idBadge.style.textAlign = "right";
        idBadge.style.marginTop = "5px";

        matchCard.appendChild(idBadge);
        matchesGrid.appendChild(matchCard);

        // Al hacer clic en la tarjeta (no en el botón) se muestra la información del partido
        matchCard.addEventListener("click", function () {
          const player1Name = getPlayerNameById(match.player1, players);
          const player2Name = getPlayerNameById(match.player2, players);
          const resultado = match.resultado
            ? match.resultado
            : "Sin resultado registrado";
          const ganador = match.ganador
            ? getPlayerNameById(match.ganador, players)
            : "Por definir";

          Swal.fire({
            title: `Partido #${match.partidoId}`,
            html: `
                <strong>Grupo:</strong> ${match.group}<br>
                <strong>Semana:</strong> ${weekNumber}<br><br>
                <strong>${player1Name}</strong> vs <strong>${player2Name}</strong><br><br>
                <strong>Resultado:</strong> ${resultado}<br>
                <strong>Ganador:</strong> ${ganador}
              `,
            icon: "info",
            confirmButtonText: "Cerrar",
          });
        });
      });
    }

    weekContainer.appendChild(weekHeader);
    weekContainer.appendChild(matchesGrid);
    fechasContainer.appendChild(weekContainer);
  }

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
    // const torneos = await getTorneos();
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
      // torneos,
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
