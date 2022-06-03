export class Dice {
  /** @type {boolean} */
  locked;
  /** @type {number} */
  value;

  /**
   * A constructor to make a new dice or re-make one from a json object
   * @param {{value?: number; locked?: number;}?} dice An object that represents a dice, usually from `this.toJSON()`
   */
  constructor({ value = Dice.getRandomDiceRoll(), locked = false } = {}) {
    this.value = value;
    this.locked = locked;
  }

  roll() {
    this.value = Dice.getRandomDiceRoll();
  }

  /**
   * Helper function to get a dice roll
   * To be easy to change in case there's a need for a d20 or something
   */
  static getRandomDiceRoll() {
    return Math.ceil(Math.random() * 6);
  }

  /**
   * Export a dice
   */
  toJSON() {
    return {
      value: this.value,
      locked: this.locked,
    };
  }
}

class Objective {
  /** @type {string} */
  name;
  /** @type {string} */
  display;
  /** @type {boolean} */
  locked;
  /** @type {number} */
  points;

  /**
   * A constructor to make a new objective or re-make one from a json object
   * @param {{value?: number; locked?: number;}?} objective An object that represents a objective, usually from `this.toJSON()`
   */
  constructor({ name, display, locked = false, points = 0 } = {}) {
    this.name = name;
    this.locked = locked;
    this.points = points;
    this.display = display;
  }

  /**
   * Export an objective
   */
  toJSON() {
    return {
      name: this.name,
      locked: this.locked,
      points: this.points,
      display: this.display,
    };
  }
}

export class Game {
  /** @type {number} */
  rounds;
  /** @type {number} */
  currentRound;
  maxRolls;
  diceRolled;
  /** @type {Dice[]} */
  dice;
  /** @type {Objective[]} */
  objectives;
  // Score is private so we can have a onScoreUpdate hook
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
      else this.dice = dice.map((dice) => new Dice(dice));
    } else {
      this.#newDice();
    }

    // If the recived `objectives` is what we expect then use it
    // Otherwise make our own
    // This is used to re-make a game from a previous state
    if (objectives && Array.isArray(objectives) && objectives.length) {
      this.objectives = objectives.map((objective) => new Objective(objective));
    } else {
      this.objectives = [
        new Objective({ name: "checkOnes", display: "Ones" }),
        new Objective({ name: "checkTwos", display: "Twos" }),
        new Objective({ name: "checkThrees", display: "Threes" }),
        new Objective({ name: "checkFours", display: "Fours" }),
        new Objective({ name: "checkFives", display: "Fives" }),
        new Objective({ name: "checkSixes", display: "Sixes" }),
        new Objective({ name: "checkAPair", display: "A pair" }),
        new Objective({ name: "checkTwoPairs", display: "Two Pairs" }),
        new Objective({ name: "checkThreeRepeats", display: "3 like" }),
        new Objective({ name: "checkFourRepeats", display: "4 like" }),
        new Objective({ name: "smallStraight", display: "Small Straight" }),
        new Objective({ name: "largeStraight", display: "Large Straight" }),
        new Objective({ name: "house", display: "House" }),
        new Objective({ name: "chance", display: "Chance" }),
        new Objective({ name: "checkYahtzee", display: "Yahtzee" }),
      ];
    }

    // Set default variables
    this.rounds = rounds || 9;
    this.currentRound = currentRound || 1;
    this.maxRolls = maxRolls || 3;
    this.diceRolled = diceRolled || 0;
    this.#score = score || 0;
    // Technically the score has been updated
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
      objectives: this.objectives,
    };
  }

  /**
   * A hook called on each dice roll
   * Can be used to implement render logic
   */
  onDiceRoll() {}
  /**
   * A hook called on each round
   * Can be used to implement render logic
   */
  onRound() {}
  /**
   * A hook called on each score update
   * Can be used to implement render logic
   */
  onScoreUpdate() {}

  // AirBNB can go suck it https://github.com/airbnb/javascript#accessors
  set score(value) {
    this.#score = value;
    this.onScoreUpdate();
  }

  get score() {
    return this.#score;
  }

  /**
   * Call this to go to the next round
   */
  round() {
    if (this.rounds == 0) {
      return; //End game
    }
    this.dice = [];
    this.throwDice();
    this.rounds--;
    this.maxRolls = 3;
    this.diceRolled = 0;
    this.onRound();
  }

  /**
   * A helper function to generate 6 dice (die?)
   */
  #newDice() {
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
    // If no dice (die?) exist then generate new ones
    if (!this.dice.length) return this.#newDice();

    if (this.diceRolled == this.maxRolls) {
      return; // cant throw the dice anymore
    } else {
      // Roll each dice
      for (let i = 0; i < this.dice.length; i++) {
        // If the dice is locked then go to the next dice
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
    return (this.#duplicatesCount(this.dice)[n] || 0) * n;
  }

  // Objective rules
  // Used because you can't json-fy a function
  // (safely)
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
  #duplicatesCount(dice) {
    const counts = {};

    for (const arr of dice) {
      counts[arr.value] = counts[arr.value] ? counts[arr.value] + 1 : 1;
    }

    return counts;
  }

  /**
   * Gets the sum of all dice (die?)
   * Used for rules that return the sum of all dice (die?)
   * Such as checkThreeRepeats and checkFourRepeats
   */
  #addUpAllDice() {
    let sum = 0;
    for (let i = 0, len = this.dice.length; i < len; ++i) {
      sum += this.dice[i].value;
    }
    return sum;
  }

  checkThreeRepeats() {
    const duplicateCount = this.#duplicatesCount(this.dice);
    const repeats = Object.entries(duplicateCount).find((dice) => dice[1] >= 3);
    if (repeats) return this.#addUpAllDice();
    else return 0;
  }
  checkFourRepeats() {
    const duplicateCount = this.#duplicatesCount(this.dice);
    const repeats = Object.entries(duplicateCount).find((dice) => dice[1] >= 4);
    if (repeats) return this.#addUpAllDice();
    else return 0;
  }

  /**
   * If all dice (die?) are the same then give 50 points
   */
  checkYahtzee() {
    const duplicateCount = this.#duplicatesCount(this.dice);
    const repeats = Object.entries(duplicateCount).find((dice) => dice[1] >= 5);
    if (repeats) return 50;
    else return 0;
  }

  smallStraight() {
    const arr = [1, 2, 3, 4];
    const arr2 = [2, 3, 4, 5];
    const arr3 = [3, 4, 5, 6];

    let option1 = arr.every((val) =>
      this.dice.map((dice) => dice.value).includes(val)
    );
    let option2 = arr2.every((val) =>
      this.dice.map((dice) => dice.value).includes(val)
    );
    let option3 = arr3.every((val) =>
      this.dice.map((dice) => dice.value).includes(val)
    );

    if (option1 == true || option2 == true || option3 == true) {
      return 30;
    }
    return 0;
  }

  largeStraight() {
    const arr = [1, 2, 3, 4, 5];
    const arr2 = [2, 3, 4, 5, 6];

    let option1 = arr.every((val) =>
      this.dice.map((dice) => dice.value).includes(val)
    );
    let option2 = arr2.every((val) =>
      this.dice.map((dice) => dice.value).includes(val)
    );

    if (option1 == true || option2 == true) return 40;

    return 0;
  }

  checkAPair() {
    return 0;
  }
  checkTwoPairs() {
    return 0
  }

  house() {
    const counts = {};

    for (const arr of this.dice) {
      counts[arr] = counts[arr] ? counts[arr] + 1 : 1;
    }

    const tmp = Object.values(counts);

    let threeOfAKind = false,
      twoOfAKind = false;
    for (let i = 0, len = tmp.length; i < len; ++i) {
      if (tmp[i] == 2) twoOfAKind = true;
      if (tmp[i] == 3) threeOfAKind = true;
    }

    if (twoOfAKind && threeOfAKind) return 25;
    return 0;
  }
  chance() {
    return 0;
  }
}
