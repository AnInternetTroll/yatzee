// importere klasse fra game.js
import { Game } from "./game.js";

class Player {
  /** @type {string} */
  name;
  /** @type {Game} */
  game;
  /** @type {boolean} */
  hasSelectedObjective;

  /**
   * @param {{
   *  name: string;
   *  game: Game;
   * }} param0
   */
  constructor({
    name = "Unknown name",
    game = new Game(),
    hasSelectedObjective = false,
  }) {
    this.name = name;
    this.game = game instanceof Game ? game : new Game(game);
    //Dette er for å gi en objective true eller false, vis det er false ikke gjør noe, vis det er true så kan man ikke locke på en objective lenger
    this.hasSelectedObjective = hasSelectedObjective || false;
  }

  toJSON() {
    return {
      name: this.name,
      game: this.game,
      hasSelectedObjective: this.hasSelectedObjective,
    };
  }
}

// hente DOM elementer
const rollButton = document.getElementById("rollDiceButton");
const dicesContainer = document.querySelector(".dices");
const scoreTablesContainer = document.querySelector(".scoretables");
const restartGame = document.querySelector("#restartGame");
const nextRoundButton = document.querySelector("#nextRound");
const currentRoundEl = document.querySelector(".current-round");
const finalScoreEl = document.querySelector("#finalScore");

const previousGame = localStorage.getItem("previousGame");
const previousGameStats = localStorage.getItem("previousGameStats")

let currentRound = 1;
let currentPlayer = 0;

/** @type {Player[]} */
const players = previousGame ? JSON.parse(previousGame).map(player => new Player(player)) : [];

if (!players.length) {
  let playerCount = 0;
  let playerName = "";
  do {
    playerName = prompt("Give me a name for player " + (playerCount + 1));
    console.log(playerName, typeof playerName, playerName.length);
    if (!playerName) {
      if (playerCount === 0)
        players.push(
          new Player({
            name: "Player 1",
          })
        );
      continue;
    }
    players.push(
      new Player({
        name: playerName,
      })
    );
    playerCount++;
  } while (playerName.length && (playerCount !== 0 || playerCount == 4));
}

/**
 * event listener for å restarte spillet.
 * Det sletter elementet med key: previousGame
 * og reloader siden for å legge til changes
 */
restartGame.addEventListener("click", (e) => {
  localStorage.removeItem("previousGame");
  localStorage.removeItem("previousGameStats");
  window.location.reload();
});

/**
 * Event listener på nextRound knappen
 * Vis det ikke er noe objectives som er valgt så skal den ta en alert for å si til brukeren
 * at han skal velge en objective
 * Ellers skal det starte nytt runde og oppdatere hvilken runde mann er i
 */
nextRoundButton.addEventListener("click", (e) => {
  if (!players[currentPlayer].hasSelectedObjective) {
    alert("No Objective Selected! Please select a objective!");
    return;
  } else {
    if (currentPlayer === players.length - 1) {
      currentRound++;
      if (!players[currentPlayer].game.rounds) {
        finalScoreEl.innerHTML = `
          <tr>
            <td> Player </th>
            <td> Score </th>
          </tr>
          `;
        players.forEach((player) => {
          finalScoreEl.innerHTML += `
          <tr>
            <td> ${player.name} </td>
            <td> ${player.game.score} </td>
          </tr>
          `;
        });
      }
      currentPlayer = 0;
      console.log("Current player has been reset", currentPlayer);
    } else {
      currentPlayer++;
      console.log("Current player has been incremented", currentPlayer);
    }
    players[currentPlayer].hasSelectedObjective = false;
    players[currentPlayer].game.round();
    saveGame();
    currentRoundEl.textContent = currentRound;
  }
});

/**
 * Dette startet nytt game og sjekker om det er et game på localstorage.
 * VIss det er et game så skal den oppdatere forkjellige elementer, ellers skal den starte en runde fra scratch
 */
//const game = new Game(previousGame ? JSON.parse(previousGame) : undefined);
renderDice();

/**
 * Dette gir oss en nytt terning
 */
rollButton.addEventListener("click", (e) => {
  e.preventDefault();
  // funksjon fra game.js
  players[currentPlayer].game.throwDice();
});

/**
 * Først tømmer vi diven for terningene i tilffele det er noen terninger som er lagret.
 * Lager en forEach for å legge til en terning på spillet.
 * Alt blir generert dynamisk, så vi legger til verdiene med template strings slik at vi kan skrive variabler inn på html
 */

function renderDice() {
  dicesContainer.innerHTML = "";

  // rendere et dynamist terning for hvert roll
  players[currentPlayer].game.dice.forEach((dice, index) => {
    // hver knapp for en dataset med sin index
    dicesContainer.innerHTML += `
        <button 
          class="dice ${dice.locked ? "lock" : ""}" 
          data-index="${index}"
          data-player="${currentPlayer}"
        >${dice.value}</button>
    `;
  });

  // Henter de nye rendera knappene med datasettet
  const lockDice = document.querySelectorAll("[data-index]");

  /**
   * Her tar vi og legger en eventListener på hver eneste terning. Og vis noen trykker på den
   * så skal den gi verdien Locked til knappen som ble trykket på og den skal også gi den en klasse
   * for å kunne style den i css
   */
  lockDice.forEach((dice) => {
    dice.addEventListener("click", (e) => {
      console.log(
        "Current Player",
        currentPlayer,
        "Has locked the dice",
        dice.dataset.index
      );
      // låser en terning ved hjelp av indexen til en ternign
      players[e.currentTarget.dataset.player].game.lockDice(dice.dataset.index);
      console.log(
        "After lock",
        players[e.currentTarget.dataset.player].game.dice[dice.dataset.index]
      );
      dice.classList.add("lock");
    });
  });
  renderRoundTables();
}

/**
 * Denne funksjonen lager hele table dynamisk
 * og legger til de verdiene med template strings
 */
function renderRoundTables() {
  scoreTablesContainer.innerHTML = "";
  scoreTablesContainer.innerHTML += `
    <tr> 
      <th> Type </th> 
      ${players
        .map(
          (player, playerIndex) => `
        <th class="${playerIndex === currentPlayer ? "active" : ""}"> ${
            player.name
          } </th>
      `
        )
        .join(" ")}
    </tr>
  `;

  players[0].game.objectives.forEach((objective, objectiveIndex) => {
    scoreTablesContainer.innerHTML += `
    <tr>
          <td>${objective.display}</td>
          ${players
            .map(
              (player, playerIndex) => `
                <td class="score-button">
                  <button 
                    class="rolled-score ${
                      player.game.objectives[objectiveIndex].locked
                        ? "locked-objective"
                        : ""
                    }" 
                    data-objective="${objective.name}"
                    data-locked="${
                      player.game.objectives[objectiveIndex].locked
                    }"
                    data-player="${playerIndex}"
                  >
                    ${
                      player.game.objectives[objectiveIndex].locked
                        ? player.game.objectives[objectiveIndex].points
                        : player.game[objective.name]() || 0
                    }
                  </button>
                  </td>`
            )
            .join("")}
        </tr>
        `;
  });
  scoreTablesContainer.innerHTML += `
       <tr>
       <td>Total</td>
       ${players
         .map(
           (player) => `
          <td>${player.game.score}</td>
       `
         )
         .join("")}
       </tr>
       `;

  /**
   * Denne funksjonen låser objectives, lagrer og oppdaterer verdiene.
   * Det legger også en klasse for styling
   */
  requestAnimationFrame(() => {
    const objectivesElements = document.querySelectorAll(
      `button[data-objective][data-player="${currentPlayer}"]`
    );
    objectivesElements.forEach((objectiveEl) => {
      if (players[objectiveEl.dataset.player].hasSelectedObjective) {
      }
      objectiveEl.addEventListener("click", (e) => {
        if (e.currentTarget.dataset.locked === "true") {
          return;
        }
        if (players[e.currentTarget.dataset.player].hasSelectedObjective)
          return;
        else {
          players[e.currentTarget.dataset.player].hasSelectedObjective = true;
          const objectiveName = e.currentTarget.dataset.objective;
          const objectiveIndex = players[
            e.currentTarget.dataset.player
          ].game.objectives.findIndex(
            (objective) => objective.name === objectiveName
          );
          console.log(objectiveName);
          const earnedScore =
            players[e.currentTarget.dataset.player].game[objectiveName]();
          players[e.currentTarget.dataset.player].game.score += earnedScore;
          players[e.currentTarget.dataset.player].game.objectives[
            objectiveIndex
          ].points = earnedScore;
          players[e.currentTarget.dataset.player].game.objectives[
            objectiveIndex
          ].locked = true;
          e.currentTarget.dataset.locked = true;
          objectiveEl.classList.add("locked-objective");
        }
      });
    });
  });
  currentRoundEl.textContent = currentRound;
}
/**
 * Denne funksjonen lagrer spillet på localstorage slik at vi kan få tak i den om vi reloader pagen
 */
const saveGame = () => {
  localStorage.setItem("previousGame", JSON.stringify(players));
  localStorage.setItem("previousGameStats", JSON.stringify({
    currentPlayer,
    currentRound,
  }));
}

//Hver runde så skal den plusse til en runde og sette objectives som ikke er valgt med false
const onRound = (playerIndex) => {
  console.log(
    "Player",
    playerIndex,
    "Out of",
    players.length,
    "Current player",
    currentPlayer,
    "Has triggered a new round"
  );
  saveGame();
};

//Hver gang scoren blir oppdatert så lagrer vi  den på localstorage
const onScoreUpdate = () => {
  saveGame();
};

/**
 * Så når terning blir kasta så skal den vise et nytt terning og lagre spillet.
 */
const onDiceRoll = () => {
  renderDice();
  saveGame();
};

for (let i = 0; i < players.length; i++) {
  players[i].game.onDiceRoll = onDiceRoll;
  players[i].game.onScoreUpdate = onScoreUpdate;
  players[i].game.onRound = () => onRound(i);

  players[i].game.onScoreUpdate();
}

//current round blir brukt til å vise fram hvilket runde mann er i
try {
  const stats = JSON.parse(previousGameStats);
  currentPlayer = stats.currentPlayer;
  currentRound = stats.currentRound;
} catch(err) {
  console.log("Probably no stats available ", err?.message || err);
}

players[currentPlayer].hasSelectedObjective = false;
//Til slutt lagrer vi alt, oppdaterer score og renderer tables med nytt data
players[currentPlayer].game.round();

renderRoundTables();
