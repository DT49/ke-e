/**
 * @module
 */
import _ from 'lodash';
import assert from 'assert';
import {isArbitrary} from './arbitrary';
import {pint} from './types/number';
import {elements} from './combinators';
import {stdOpts} from './constants';

/**
 * Something to do monkey testing.
 */
class ChaosMonkey {
  constructor(opts = {}) {
    this._seed = opts.seed || pint.generate();
    this._engine = stdOpts.engine.seed(this._seed);
    this.actions = {};
    this._preconds = {};
    this._postconds = {};
    this._speed = opts.speed || 50;
    this._locale = 'en';
    this._preDo = opts.preDo || _.noop;
    this._postDo = opts.postDo || _.noop;
  }
  /**
   * Add a behaviour.
   *
   * @param {string} name
   * @param {Arbitrary} action
   */
  behaviour(name, action, opts = {}) {
    assert(_.isString(name), 'name must be a string.');
    assert(isArbitrary(action), 'action must be a Arbitrary.');
    this.actions[name] = action;
    this._preconds[name] = opts.precond || _.noop;
    this._postconds[name] = opts.postcond || _.noop;
  }
  /**
   * Do random behaviour.
   */
  doRandomBehaviour() {
    const randomActName = elements(Object.keys(this.actions))
          .engine(this._engine)
          .generate();
    const precond = this._preconds[randomActName];
    const postcond = this._postconds[randomActName];
    const randomAction = this.actions[randomActName]
                         .locale(this._locale)
                         .engine(this._engine);
    // hook helpers
    const preDo = () => {
      this._preDo.apply(this);
      precond.apply(this);
    };

    const postDo = (...args) => {
      this._postDo.apply(this, args);
      postcond.apply(this, args);
    };

    preDo();
    randomAction.promise()
      .then(postDo)
      .catch(console.error);
  }
  /**
   * Replay monkey testing by given seed.
   *
   * @return {number} seed 32-bit integer.
   */
  replay(seed) {
    assert(_.isInteger(seed), 'seed must be a integer');
    this._seed = seed;
    this.start();
  }
  /**
   * Start running monkey testing.
   *
   * @return {number} interval id.
   */
  start() {
    this.stop();
    console.log(`seed: ${this._seed}`);
    const task = () => this.doRandomBehaviour();
    return this.timeId = setInterval(task, this._speed);
  }
  /**
   * Stop running monkey testing.
   */
  stop() {
    clearInterval(this.timeId);
    this.timeId = null;
  }
}

export {
  ChaosMonkey
};
