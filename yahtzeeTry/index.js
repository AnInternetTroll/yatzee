// importere klassene fra game.js
import { Game } from "./game.js";

// hente DOM elementer
const rollButton = document.getElementById("rollDiceButton");
const dicesContainer = document.querySelector(".dices");
const scoreTablesContainer = document.querySelector(".scoretables");
const restartGame = document.querySelector("#restartGame");
const nextRoundButton = document.querySelector("#nextRound");
const totalScoreEl = document.querySelector("#total");

const previousGame = localStorage.getItem("previousGame");

restartGame.addEventListener("click", (e) => {
  localStorage.removeItem("previousGame");
  window.location.reload();
});

nextRoundButton.addEventListener("click", (e) => {
  game.round();
});

// Starter et gam
const game = new Game(previousGame ? JSON.parse(previousGame) : undefined);
renderDice();

// Kalle på throwDice() fra game.js for å kaste nytt terning
rollButton.addEventListener("click", (e) => {
  e.preventDefault();
  // funksjon fra game.js
  game.throwDice();
});

// Tømme diven før vi renderer et ternining
game.onDiceRoll = () => {
  renderDice();
  saveGame();
};

function renderDice() {
  dicesContainer.innerHTML = "";

  // rendere et dynamist terning for hvert roll
  game.dice.forEach((dice, index) => {
    // hver knapp for en dataset med sin index
    dicesContainer.innerHTML += `
        <button class="dice ${
          dice.locked ? "lock" : ""
        }" data-index="${index}">${dice.value}</button>
    `;
  });

  // Henter de nye rendera knappene med datasettet
  const lockDice = document.querySelectorAll("[data-index]");

  lockDice.forEach((dice) => {
    dice.addEventListener("click", (e) => {
      // låser en terning ved hjelp av indexen til en ternign
      game.lockDice(dice.dataset.index);
      dice.classList.add("lock");
    });
  });
  renderRoundTables();
}

function renderRoundTables() {
  scoreTablesContainer.innerHTML = "";
  scoreTablesContainer.innerHTML += `
    <tr> 
      <th> Type </th> 
      <th> Score </th>
    </tr>
  `

  game.objectives.forEach((objective) => {
    scoreTablesContainer.innerHTML += `
    <tr>
          <td>${objective.display}</td>
          <td class="score-button">
          <button 
            class="rolled-score" 
            data-objective="${objective.name}"
            data-locked="${objective.locked}"
          >
              ${
                objective.locked
                  ? objective.points
                  : game[objective.name]() || 0
              }
          </button>
          </td>
        </tr>
        `;
       });
  requestAnimationFrame(() => {
    const objectivesElements = document.querySelectorAll(
      "button[data-objective]"
    );
    objectivesElements.forEach((objectiveEl) => {
      objectiveEl.addEventListener("click", (e) => {
        if (e.currentTarget.dataset.locked === "true") return;
        const objectiveName = e.currentTarget.dataset.objective;
        const objectiveIndex = game.objectives.findIndex(
          (objective) => objective.name === objectiveName
        );
        const earnedScore = game[objectiveName]();
        game.score += earnedScore;
        game.objectives[objectiveIndex].points = earnedScore;
        game.objectives[objectiveIndex].locked = true;
        e.currentTarget.dataset.locked = true;
        objectiveEl.classList.add("locked-objective");
      });
    });
  });
}

function saveGame() {
  localStorage.setItem("previousGame", JSON.stringify(game));
}

game.onScoreUpdate = () => {
  totalScoreEl.textContent = game.score;
  saveGame();
};

game.round();
game.onScoreUpdate();
renderRoundTables();
