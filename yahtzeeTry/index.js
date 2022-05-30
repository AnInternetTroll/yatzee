// importere klasse fra game.js
import { Game } from "./game.js";

// hente DOM elementer
const rollButton = document.getElementById("rollDiceButton");
const dicesContainer = document.querySelector(".dices");
const scoreTablesContainer = document.querySelector(".scoretables");
const restartGame = document.querySelector("#restartGame");
const nextRoundButton = document.querySelector("#nextRound");
const currentRoundEl = document.querySelector(".current-round");

const previousGame = localStorage.getItem("previousGame");

//current round blir brukt til å vise fram hvilket runde mann er i 
let currentRound = 0;
//Dette er for å gi en objective true eller false, vis det er false ikke gjør noe, vis det er true så kan man ikke locke på en objective lenger
let hasSelectedObjective = false;

/**
 * event listener for å restarte spillet. 
 * Det sletter elementet med key: previousGame 
 * og reloader siden for å legge til changes
 */
restartGame.addEventListener("click", (e) => {
  localStorage.removeItem("previousGame");
  window.location.reload();
});


/**
 * Event listener på nextRound knappen
 * Vis det ikke er noe objectives som er valgt så skal den ta en alert for å si til brukeren
 * at han skal velge en objective
 * Ellers skal det starte nytt runde og oppdatere hvilken runde mann er i
 */
nextRoundButton.addEventListener("click", (e) => {
  if (!hasSelectedObjective) {
    alert("No Objective Selected! Please select a objective!");
    return;
  } else{
    game.round();
    currentRoundEl.textContent = currentRound
  } 
});

/**
 * Dette startet nytt game og sjekker om det er et game på localstorage.
 * VIss det er et game så skal den oppdatere forkjellige elementer, ellers skal den starte en runde fra scratch
 */
const game = new Game(previousGame ? JSON.parse(previousGame) : undefined);
renderDice();

/**
 * Dette gir oss en nytt terning
 */
rollButton.addEventListener("click", (e) => {
  e.preventDefault();
  // funksjon fra game.js
  game.throwDice();
});

/**
 * Så når terning blir kasta så skal den vise et nytt terning og lagre spillet.
 */
game.onDiceRoll = () => {
  renderDice();
  saveGame();
 
};

/**
 * Først tømmer vi diven for terningene i tilffele det er noen terninger som er lagret. 
 * Lager en forEach for å legge til en terning på spillet. 
 * Alt blir generert dynamisk, så vi legger til verdiene med template strings slik at vi kan skrive variabler inn på html
 */

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

  /**
   * Her tar vi og legger en eventListener på hver eneste terning. Og vis noen trykker på den 
   * så skal den gi verdien Locked til knappen som ble trykket på og den skal også gi den en klasse
   * for å kunne style den i css
   */

  lockDice.forEach((dice) => {
    dice.addEventListener("click", (e) => {
      // låser en terning ved hjelp av indexen til en ternign
      game.lockDice(dice.dataset.index);
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
      <th> Score </th>
    </tr>
  `;

  game.objectives.forEach((objective) => {
    scoreTablesContainer.innerHTML += `
    <tr>
          <td>${objective.display}</td>
          <td class="score-button">
          <button 
            class="rolled-score ${objective.locked && "locked-objective"}" 
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
  scoreTablesContainer.innerHTML += `
       <tr>
       <td>Total</td>
        <td>${game.score}</td>
       </tr>
       `;

       /**
        * Denne funksjonen låser objectives, lagrer og oppdaterer verdiene.
        * Det legger også en klasse for styling
        */
  requestAnimationFrame(() => {
    const objectivesElements = document.querySelectorAll(
      "button[data-objective]"
    );
    objectivesElements.forEach((objectiveEl) => {
      if (hasSelectedObjective) {
      }
      objectiveEl.addEventListener("click", (e) => {
        if (e.currentTarget.dataset.locked === "true" ) {
          return;
        } if (hasSelectedObjective) return;
        else {
          hasSelectedObjective = true;
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
        }
      });
    });
  });
}
/**
 * Denne funksjonen lagrer spillet på localstorage slik at vi kan få tak i den om vi reloader pagen
 */
const saveGame = () =>
  localStorage.setItem("previousGame", JSON.stringify(game));

  //Hver runde så skal den plusse til en runde og sette objectives som ikke er valgt med false
game.onRound = () => {
  currentRound++
  hasSelectedObjective = false;
};

//Hver gang scoren blir oppdatert så lagrer vi  den på localstorage
game.onScoreUpdate = () => {
  saveGame();
};
//Til slutt lagrer vi alt, oppdaterer score og renderer tables med nytt data
game.round();
game.onScoreUpdate();
renderRoundTables();
