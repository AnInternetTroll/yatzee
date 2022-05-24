export class Dice {
  locked;
  value;

  constructor({ value = Dice.getRandomDiceRoll(), locked = false } = {}) {
    this.value = value;
    this.locked = locked;
  }

  roll() {
    this.value = Dice.getRandomDiceRoll();
  }

  static getRandomDiceRoll() {
    return Math.ceil(Math.random() * 6);
  }

  toJSON() {
    return {
      value: this.value,
      locked: this.locked,
    };
  }
}

class Objective {
  name;
  display;
  locked;
  points;

  constructor({ name, display, locked = false, points = 0 } = {}) {
    this.name = name;
    this.locked = locked;
    this.points = points;
    this.display = display;
  }

  toJSON() {
    return {
      name: this.name,
      locked: this.locked,
      points: this.points,
    };
  }
}

export class Game {
  rounds;
  currentRound;
  maxRolls;
  diceRolled;
  dice;
  objectives;
  #score;

  /**
   * Restore a previous game from an exported instance
   * Or set up a new game
   */
  constructor({
    rounds,
    currentRound,
    maxRolls,
    diceRolled,
    dice,
    score,
    objectives,
  } = {}) {
    // If we recieve dice and there are dice then use those
    // Else generate new dice
    // Is it dice or die?
    if (dice && Array.isArray(dice) && dice.length) {
      if (typeof dice.roll === "function") this.dice = dice;
      else this.dice = dice.map((dice) => new Dice(dice));    } else {
      this.newDice();
    }

    if (objectives && Array.isArray(objectives) && objectives.length) {
      this.objectives = objectives.map((objective) => new Objective(objective));
    } else {
      this.objectives = [
        new Objective({ name: "checkOnes", display: "Enere" }),
        new Objective({ name: "checkTwos", display: "Toere" }),
        new Objective({ name: "checkThrees", display: "Trere" }),
        new Objective({ name: "checkFours", display: "Firere" }),
        new Objective({ name: "checkFives", display: "Femere" }),
        new Objective({ name: "checkSixes", display: "Seksere"}),
        new Objective({ name: "checkThreeRepeats", display: "4 like" }),
        new Objective({ name: "checkFourRepeats", display : "5 like"}),
        new Objective({ name: "checkYahtzee", display : "Yahtzee"}),,
      ];
    }

    // Set default variables
    this.rounds = rounds || 9;
    this.currentRound = currentRound || 1;
    this.maxRolls = maxRolls || 3;
    this.diceRolled = diceRolled || 0;
    this.#score = score || 0;
    this.onScoreUpdate();
  }

  /**
   * Export the data as a json string
   * Used to save a game
   */
  toJSON() {
    return {
      rounds: this.rounds,
      currentRound: this.currentRound,
      maxRolls: this.maxRolls,
      diceRolled: this.diceRolled,
      dice: this.dice,
      score: this.score,
    };
  }

  /**
   * A hook called on each dice roll
   * Can be used to implement render logic
   */
  onDiceRoll() {}
  onScoreUpdate() {}

  set score(value) {
    this.#score = value;
    this.onScoreUpdate();
  }

  get score() {
    return this.#score;
  }

  round() {
    if (this.rounds == 0) {
      return; //End game
    }
    this.dice = [];
    this.throwDice();
    this.rounds--;
    this.maxRolls = 3;
  }

  newDice() {
    if (!this.dice) this.dice = [];
    for (let i = 0; i < 5; ++i) {
      this.dice.push(new Dice());
    }
    this.onDiceRoll();
  }

  /**
   * Lock a dice
   * Locked dice won't be re-rolled on `throwDice`
   */
  lockDice(index) {
    this.dice[index].locked = true;
  }

  throwDice() {
    if (!this.dice.length) return this.newDice();

    if (this.diceRolled == this.maxRolls) {
      return; // cant throw the dice anymore
    } else {
      for (let i = 0; i < this.dice.length; i++) {
        if (this.dice[i].locked) continue;
        this.dice[i].roll();
      }
      this.diceRolled++;
    }
    this.onDiceRoll();
  }
  /**
   * Private helper method
   * Used to calculate the score
   * Of dice sums of the same number
   * @param {number} n The dice value to be checked against
   *
   * @example
   * ```js
   * dice = [1,2,2,2,2];
   * checkN(2) == 8
   * ```
   */
  #checkN(n) {
    return (this.duplicatesCount(this.dice)[n] || 0) * n;
  }

  checkOnes() {
    return this.#checkN(1);
  }
  checkTwos() {
    return this.#checkN(2);
  }
  checkThrees() {
    return this.#checkN(3);
  }
  checkFours() {
    return this.#checkN(4);
  }
  checkFives() {
    return this.#checkN(5);
  }
  checkSixes() {
    return this.#checkN(6);
  }

  /**
   * Generate a frequency table from a dice array
   * @param {Dice[]} dice
   *
   * @returns {Record<string, number>} The frequency table
   * @example
   * ```js
   * const dice = [1,1,1,2,4,5];
   * console.log(duplicatesCount(dice))
   * {
   *  "1": 3,
   *  "2": 1,
   *  "4": 1,
   *  "5": 1
   * }
   * ```
   */
  duplicatesCount(dice) {
    const counts = {};

    for (const arr of dice) {
      counts[arr.value] = counts[arr.value] ? counts[arr.value] + 1 : 1;
    }

    return counts;
  }

  addUpAllDice() {
    let sum = 0;
    for (let i = 0, len = this.dice.length; i < len; ++i) {
      sum += this.dice[i].value;
    }
    return sum;
  }

  checkThreeRepeats() {
    const duplicateCount = this.duplicatesCount(this.dice);
    const repeats = Object.entries(duplicateCount).find((dice) => dice[1] >= 3);
    if (repeats) return this.addUpAllDice();
  }
  checkFourRepeats() {
    const duplicateCount = this.duplicatesCount(this.dice);
    const repeats = Object.entries(duplicateCount).find((dice) => dice[1] >= 4);
    if (repeats) return this.addUpAllDice();
  }

  checkYahtzee() {
    const duplicateCount = this.duplicatesCount(this.dice);
    const repeats = Object.entries(duplicateCount).find((dice) => dice[1] >= 5);
    if (repeats) return 50;
  }
}
